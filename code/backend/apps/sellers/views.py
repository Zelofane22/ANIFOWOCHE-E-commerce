import csv
import io
import logging

from datetime import date, timedelta

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, F, Sum, Q
from django.db.models.functions import ExtractHour, ExtractIsoWeekDay, TruncDate
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import APIException, NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.core.maintenance import block_if_maintenance
from apps.payments.serializers import PaymentSerializer
from apps.notifications.services import notify_invoice
from apps.payments.services import PaymentRelaunchError, RELAUNCHABLE_STATUSES, relaunch_payment
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.users.serializers import UserSerializer

from .limits import has_feature, orders_quota_reached, require_feature
from .models import SellerProfile, Shop
from .serializers import (
    PublicShopSerializer,
    SellerOrderStatusSerializer,
    SellerProfileSerializer,
    SellerRegisterSerializer,
)

KPI_PERIOD_DAYS = 30
VALID_PERIODS = (7, 30, 90)
LOW_STOCK_THRESHOLD = 10


def _percent_change(current, previous):
    """Calcule la variation en pourcentage entre deux périodes (None si pas de référence)."""
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


class SellerRegisterView(generics.CreateAPIView):
    serializer_class = SellerRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        """Enregistre un vendeur et retourne ses tokens JWT avec son profil et sa boutique."""
        # Validation des données d'inscription.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Création du compte vendeur (profil + boutique) et génération des tokens.
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        seller = user.seller_profile
        return Response(
            {
                "user": UserSerializer(user).data,
                "seller": SellerProfileSerializer(seller).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class SellerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Récupère le profil vendeur de l'utilisateur connecté (404 si absent).
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def patch(self, request, *args, **kwargs):
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        return super().patch(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        return super().put(request, *args, **kwargs)


class ShopSlugAvailabilityView(APIView):
    """Indique si un slug de boutique est disponible (la boutique du vendeur est exclue)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Slug normalisé puis comparaison hors boutique du vendeur connecté.
        slug = slugify(request.query_params.get("slug", ""))[:180]
        if not slug:
            return Response({"slug": "", "available": False})
        queryset = Shop.objects.filter(slug=slug)
        seller = getattr(request.user, "seller_profile", None)
        if seller is not None:
            queryset = queryset.exclude(seller=seller)
        return Response({"slug": slug, "available": not queryset.exists()})


def _seller_report_payload(seller, request):
    """Construit les données de reporting du vendeur (dashboard + export CSV).

    Retourne un tuple ``(data, error)`` : ``error`` est une Response DRF si les
    paramètres de période sont invalides, sinon ``None``. Logique partagée par
    ``SellerDashboardView`` et ``SellerReportExportView``.
    """
    # Périmètre des données : commandes et produits du vendeur (actifs).
    seller_orders = Order.objects.filter(items__product__seller=seller).distinct()
    seller_products = seller.products.filter(is_active=True)

    # Bornes temporelles des deux périodes comparées (actuelle et précédente).
    now = timezone.now()
    now_bound = now

    # --- Query params : period / date_from / date_to ---
    period_raw = request.query_params.get("period")
    date_from_raw = request.query_params.get("date_from")
    date_to_raw = request.query_params.get("date_to")

    has_date_range = date_from_raw or date_to_raw

    if has_date_range:
        # Validation : les deux dates ou aucune ne doit manquer.
        if not date_from_raw or not date_to_raw:
            return None, Response(
                {"detail": "Les paramètres date_from et date_to doivent être fournis ensemble."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            period_start = date.fromisoformat(date_from_raw)
        except (ValueError, TypeError):
            return None, Response(
                {"detail": "Format de date_from invalide. Utilisez le format YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            now_bound = date.fromisoformat(date_to_raw)
        except (ValueError, TypeError):
            return None, Response(
                {"detail": "Format de date_to invalide. Utilisez le format YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if period_start > now_bound:
            return None, Response(
                {"detail": "La date_from doit être antérieure ou égale à date_to."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        duration_days = (now_bound - period_start).days
        previous_start = period_start - timedelta(days=duration_days)
        days_used = duration_days
    else:
        # Paramètre period : 7, 30 ou 90 jours.
        if period_raw is not None:
            try:
                days = int(period_raw)
            except (ValueError, TypeError):
                return None, Response(
                    {"detail": "Le paramètre period doit être un entier parmi 7, 30 ou 90."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if days not in VALID_PERIODS:
                return None, Response(
                    {"detail": "Le paramètre period doit être 7, 30 ou 90."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            days = KPI_PERIOD_DAYS
        days_used = days
        period_start = now - timedelta(days=days)
        previous_start = now - timedelta(days=2 * days)
        now_bound = now

    orders_period = seller_orders.filter(created_at__gte=period_start)
    orders_previous = seller_orders.filter(
        created_at__gte=previous_start, created_at__lt=period_start
    )

    # KPIs de revenus et de commandes sur les deux périodes (hors annulations).
    non_cancelled_period = orders_period.exclude(status=Order.Status.CANCELLED)
    non_cancelled_previous = orders_previous.exclude(status=Order.Status.CANCELLED)
    revenue_period = non_cancelled_period.aggregate(total=Sum("total_xof"))["total"] or 0
    revenue_previous = non_cancelled_previous.aggregate(total=Sum("total_xof"))["total"] or 0
    orders_count_period = orders_period.count()
    orders_count_previous = orders_previous.count()
    non_cancelled_count_period = non_cancelled_period.count()

    # Statistiques avancées (#250) : panier moyen (revenu / commandes non
    # annulées) et taux de conversion (part des commandes non annulées).
    avg_order_value = round(revenue_period / non_cancelled_count_period) if non_cancelled_count_period else 0
    conversion_rate = round(non_cancelled_count_period / orders_count_period * 100, 1) if orders_count_period else 0

    # Série des ventes par jour pour le graphique d'évolution.
    sales_by_day = (
        orders_period.exclude(status=Order.Status.CANCELLED)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("total_xof"))
        .order_by("day")
    )

    # Heures / jours de forte activité (fonctionnalité Pro `advanced_stats`).
    # Count distinct : seller_orders est joint sur items (évite le double comptage).
    activity = None
    if has_feature(seller, "advanced_stats"):
        by_hour = [0] * 24
        for row in (
            orders_period.order_by().annotate(h=ExtractHour("created_at"))
            .values("h").annotate(c=Count("id", distinct=True))
        ):
            by_hour[row["h"]] = row["c"]
        by_weekday = [0] * 7  # index 0 = lundi ... 6 = dimanche
        for row in (
            orders_period.order_by().annotate(d=ExtractIsoWeekDay("created_at"))
            .values("d").annotate(c=Count("id", distinct=True))
        ):
            by_weekday[row["d"] - 1] = row["c"]
        has_data = any(by_hour)
        activity = {
            "by_hour": by_hour,
            "by_weekday": by_weekday,
            "peak_hour": by_hour.index(max(by_hour)) if has_data else None,
            "peak_weekday": by_weekday.index(max(by_weekday)) if has_data else None,
        }

    # Revenu total cumulé du vendeur.
    total_revenue = seller_orders.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0

    # Compteurs du jour : commandes du jour et commandes en attente de préparation.
    today = timezone.localdate()
    orders_today = seller_orders.filter(created_at__date=today).count()
    pending_orders = seller_orders.filter(status=Order.Status.RECEIVED).count()

    # Répartition des commandes par statut.
    status_distribution = (
        seller_orders.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    # Top 5 des produits par chiffre d'affaires.
    top_products = (
        OrderItem.objects.filter(order__in=seller_orders)
        .exclude(order__status=Order.Status.CANCELLED)
        .values("product__id", "product__name")
        .annotate(total_revenue=Sum(F("quantity") * F("unit_price_xof")), total_quantity=Sum("quantity"))
        .order_by("-total_revenue")[:5]
    )

    # Chiffre d'affaires par catégorie de produits.
    category_breakdown = (
        OrderItem.objects.filter(order__in=seller_orders)
        .exclude(order__status=Order.Status.CANCELLED)
        .values("product__category__name")
        .annotate(total=Sum(F("quantity") * F("unit_price_xof")))
        .order_by("-total")
    )

    # Alertes de stock faible et dernières commandes reçues.
    low_stock = seller_products.filter(stock__lte=LOW_STOCK_THRESHOLD).exclude(made_to_order=True).order_by("stock")[:5]

    recent_orders = seller_orders.prefetch_related("items__product").order_by("-created_at")[:5]

    # Assemblage de la réponse complète du reporting.
    data = {
        "seller": SellerProfileSerializer(seller).data,
        "metrics": {
            "products": seller_products.count(),
            "orders_today": orders_today,
            "pending_orders": pending_orders,
            "total_orders": seller_orders.count(),
            "total_revenue": total_revenue,
        },
        "kpi": {
            "revenue": revenue_period,
            "revenue_change": _percent_change(revenue_period, revenue_previous),
            "orders": orders_count_period,
            "orders_change": _percent_change(orders_count_period, orders_count_previous),
            "avg_order_value": avg_order_value,
            "conversion_rate": conversion_rate,
            "period_days": days_used,
        },
        "sales_chart": [
            {"day": row["day"].strftime("%d/%m"), "total": row["total"]}
            for row in sales_by_day
        ],
        "activity": activity,
        "status_distribution": {row["status"]: row["count"] for row in status_distribution},
        "top_products": [
            {"id": row["product__id"], "name": row["product__name"], "revenue": row["total_revenue"], "quantity": row["total_quantity"]}
            for row in top_products
        ],
        "category_breakdown": [
            {"name": row["product__category__name"] or "Autres", "total": row["total"]}
            for row in category_breakdown
        ],
        "low_stock": [
            {"id": p.id, "name": p.name, "stock": p.stock}
            for p in low_stock
        ],
        "recent_orders": OrderSerializer(recent_orders, many=True).data,
    }
    return data, None


class SellerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Tableau de bord vendeur : KPIs, ventes, répartition, alertes stock."""
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        data, error = _seller_report_payload(seller, request)
        if error:
            return error
        return Response(data)


class SellerReportExportView(APIView):
    """Export CSV des statistiques du vendeur (fonctionnalité ``exports``).

    Réservé aux offres incluant l'export (PRO/BUSINESS) — la boutique officielle
    est exemptée. Les autres plans reçoivent un 403 structuré (code feature_not_included, required_plan, current_plan).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        require_feature(seller, "exports")

        data, error = _seller_report_payload(seller, request)
        if error:
            return error

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from and date_to:
            period_label = f"{date_from} au {date_to}"
        else:
            period_label = f"{data['kpi']['period_days']} derniers jours"

        shop_name = seller.shop.name if getattr(seller, "shop", None) else seller.display_name

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Rapport de ventes", shop_name])
        writer.writerow(["Période", period_label])
        writer.writerow([])
        writer.writerow(["Indicateur", "Valeur"])
        writer.writerow(["Chiffre d'affaires (FCFA)", data["kpi"]["revenue"]])
        writer.writerow(["Commandes", data["kpi"]["orders"]])
        writer.writerow(["Panier moyen (FCFA)", data["kpi"]["avg_order_value"]])
        writer.writerow(["Taux de conversion (%)", data["kpi"]["conversion_rate"]])
        writer.writerow(["Produits actifs", data["metrics"]["products"]])
        writer.writerow(["Commandes en attente", data["metrics"]["pending_orders"]])
        writer.writerow([])
        writer.writerow(["Ventes par jour", "Montant (FCFA)"])
        writer.writerows([[row["day"], row["total"]] for row in data["sales_chart"]])
        writer.writerow([])
        writer.writerow(["Produit", "Quantité vendue", "Chiffre d'affaires (FCFA)"])
        writer.writerows([
            [row["name"], row["quantity"], row["revenue"]]
            for row in data["top_products"]
        ])
        writer.writerow([])
        writer.writerow(["Catégorie", "Chiffre d'affaires (FCFA)"])
        writer.writerows([[row["name"], row["total"]] for row in data["category_breakdown"]])
        writer.writerow([])
        writer.writerow(["Statut de commande", "Nombre"])
        writer.writerows([[key, value] for key, value in data["status_distribution"].items()])

        response = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = (
            f"attachment; filename=rapport-ventes-{date.today():%Y%m%d}.csv"
        )
        return response


class SellerOrderViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "patch", "head", "options"]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Sérialiseur spécifique pour les mises à jour de statut (avec motif d'annulation).
        if self.action in ("update", "partial_update"):
            return SellerOrderStatusSerializer
        return OrderSerializer

    def get_queryset(self):
        # Restreint les commandes à celles qui contiennent au moins un produit du vendeur.
        try:
            seller = self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")
        return Order.objects.filter(items__product__seller=seller).prefetch_related("items__product").distinct()

    def partial_update(self, request, *args, **kwargs):
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        return super().update(request, *args, **kwargs)


class PublicShopView(generics.RetrieveAPIView):
    serializer_class = PublicShopSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        # Seules les boutiques publiées sont visibles publiquement.
        return Shop.objects.filter(is_published=True).select_related("seller")

    def get_object(self):
        shop = super().get_object()
        # Quota mensuel de commandes atteint (plan FREE) : boutique masquée
        # jusqu'au mois suivant, sans toucher à is_published.
        if orders_quota_reached(shop.seller):
            raise NotFound("Cette boutique est temporairement indisponible.")
        return shop


class SellerPaymentRelaunchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        """Relance un paiement FedaPay échoué d'une commande du vendeur (US-34).""" 
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        # Récupération du profil vendeur de l'utilisateur connecté.
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        # La commande doit appartenir au vendeur.
        order = Order.objects.filter(
            pk=order_id,
            items__product__seller=seller,
        ).distinct().first()
        if not order:
            raise NotFound("Commande introuvable.")

        # Recherche du paiement relançable le plus récent de la commande.
        payment = order.payments.filter(
            provider=Payment.Provider.FEDAPAY,
            status__in=RELAUNCHABLE_STATUSES,
        ).order_by("-created_at").first()
        if not payment:
            return Response(
                {"detail": "Aucun paiement relançable pour cette commande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Création d'une nouvelle tentative de paiement via le service métier.
            new_payment = relaunch_payment(payment)
        except PaymentRelaunchError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(PaymentSerializer(new_payment).data, status=status.HTTP_201_CREATED)


class SellerConfirmPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        """Confirme manuellement un paiement en attente (paiement à la livraison) et prépare la commande.""" 
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        # Récupération du profil vendeur de l'utilisateur connecté.
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        # La commande doit appartenir au vendeur.
        order = Order.objects.filter(
            pk=order_id,
            items__product__seller=seller,
        ).distinct().first()
        if not order:
            raise NotFound("Commande introuvable.")

        # Recherche du paiement en attente le plus récent de la commande.
        payment = order.payments.filter(
            status=Payment.Status.PENDING,
        ).order_by("-created_at").first()
        if not payment:
            return Response(
                {"detail": "Aucun paiement en attente pour cette commande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Approbation du paiement puis passage de la commande en « préparée ».
        payment.status = Payment.Status.APPROVED
        payment.save(update_fields=["status"])

        order.status = Order.Status.PREPARED
        order.save(update_fields=["status"])

        # Envoi de la facture au client.
        notify_invoice(payment)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


logger = logging.getLogger(__name__)


class PublicShopProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        # Produits de la boutique (ou du vendeur sans boutique), uniquement actifs, avec images et options.
        shop = get_object_or_404(Shop, slug=self.kwargs["shop_slug"], is_published=True)
        # Quota mensuel de commandes atteint (plan FREE) : boutique masquée jusqu'au mois suivant.
        if orders_quota_reached(shop.seller):
            raise NotFound("Cette boutique est temporairement indisponible.")
        return Product.objects.filter(
            Q(shop=shop) | Q(shop__isnull=True, seller=shop.seller),
            is_active=True,
        ).select_related("category", "seller").prefetch_related(
            "images", "option_groups__options"
        )

    def retrieve(self, request, *args, **kwargs):
        # Récupération du détail produit avec repli sur une réponse 500 propre en cas d'erreur inattendue.
        try:
            return super().retrieve(request, *args, **kwargs)
        except APIException:
            # Les erreurs fonctionnelles (404 boutique masquée, etc.) gardent leur statut.
            raise
        except Exception as e:
            logger.exception("PublicShopProductDetailView error")
            return Response(
                {"error": str(e), "detail": "Erreur lors du chargement du produit"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SellerPlansView(APIView):
    """Catalogue public des offres vendeur (prix + limites + fonctionnalités).
    Alimente la page d'atterrissage (#228) et la page plan du dashboard (#245).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .limits import PLAN_LIMITS, PLAN_FEATURES
        from .serializers import SellerPlanSerializer

        plans = []
        for code, limits in PLAN_LIMITS.items():
            plans.append(
                {
                    "code": code,
                    "name": SellerProfile.Plan(code).label,
                    "price_xof": limits["price_xof"],
                    "promo_price_xof": limits.get("promo_price_xof"),
                    "promo_duration_months": limits.get("promo_duration_months"),
                    "max_products": limits["max_products"],
                    "max_orders_per_month": limits["max_orders_per_month"],
                    "features": sorted(PLAN_FEATURES.get(code, frozenset())),
                }
            )
        return Response({"plans": SellerPlanSerializer(plans, many=True).data})


class SellerSubscriptionView(APIView):
    """Abonnement payant du vendeur (pipeline E9).

    - POST : souscrit à un plan (checkout FedaPay), retourne l'abonnement avec
      son lien de paiement.
    - GET  : retourne l'abonnement le plus récent + le plan actuel et ses limites.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def _get_seller(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def post(self, request):
        from .services import SubscriptionError, create_subscription

        seller = self._get_seller()
        plan = request.data.get("plan", "").upper()
        try:
            subscription = create_subscription(seller, plan)
        except SubscriptionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        from .serializers import SellerSubscriptionSerializer
        return Response(
            SellerSubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED
        )

    def get(self, request):
        from .limits import build_limits_payload
        from .serializers import SellerSubscriptionSerializer

        seller = self._get_seller()
        latest = seller.subscriptions.order_by("-created_at").first()
        return Response(
            {
                "subscription": (
                    SellerSubscriptionSerializer(latest).data if latest else None
                ),
                "current_plan": seller.plan,
                "limits": build_limits_payload(seller),
            }
        )


class SellerSubscriptionRelaunchView(APIView):
    """Relance le paiement d'un abonnement vendeur échoué (le vendeur agit seul)."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        blocked = block_if_maintenance()
        if blocked:
            return blocked
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        subscription = seller.subscriptions.order_by("-created_at").first()
        if not subscription:
            return Response(
                {"detail": "Aucun abonnement à relancer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services import SubscriptionError, relaunch_subscription

        try:
            new_subscription = relaunch_subscription(subscription)
        except SubscriptionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import SellerSubscriptionSerializer
        return Response(
            SellerSubscriptionSerializer(new_subscription).data,
            status=status.HTTP_201_CREATED,
        )


class SellerSubscriptionCancelView(APIView):
    """Résilie l'abonnement actif du vendeur (accès conservé jusqu'à l'échéance)."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        subscription = seller.subscriptions.filter(status="approved").order_by("-created_at").first()
        if not subscription:
            return Response(
                {"detail": "Aucun abonnement actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services import SubscriptionError, cancel_subscription

        try:
            subscription = cancel_subscription(subscription)
        except SubscriptionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import SellerSubscriptionSerializer
        return Response(SellerSubscriptionSerializer(subscription).data, status=status.HTTP_200_OK)


class SellerSubscriptionReactivateView(APIView):
    """Réactive un abonnement dont la résiliation a été demandée."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        subscription = seller.subscriptions.filter(status="approved").order_by("-created_at").first()
        if not subscription:
            return Response(
                {"detail": "Aucun abonnement actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services import SubscriptionError, reactivate_subscription

        try:
            subscription = reactivate_subscription(subscription)
        except SubscriptionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import SellerSubscriptionSerializer
        return Response(SellerSubscriptionSerializer(subscription).data, status=status.HTTP_200_OK)
