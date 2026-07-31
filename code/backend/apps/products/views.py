from django.db.models import Avg, Count, IntegerField, OuterRef, Prefetch, Q, Subquery
from django.db.models.functions import Now
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from .filters import AccentInsensitiveSearchFilter
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT

from django.shortcuts import get_object_or_404
from rest_framework import status

from apps.promotions.models import Promotion
from apps.sellers.models import SellerProfile

from .models import Category, Option, OptionGroup, Product, ProductImage
from .serializers import (CategorySerializer, OptionGroupSerializer,
                          OptionSerializer, ProductImageSerializer,
                          ProductSerializer, SellerProductSerializer)

class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD des catégories de produits (géré via l'admin backoffice)."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


def _active_discount_subquery():
    # Sous-requête corrélée (pas une jointure) : évite la multiplication de lignes
    # qui fausserait les agrégats reviews (Avg/Count) calculés dans la même queryset.
    active_promotions = (
        Promotion.objects.filter(
            is_active=True,
            starts_at__lte=Now(),
            ends_at__gte=Now(),
        )
        .filter(Q(products=OuterRef("pk")) | Q(categories=OuterRef("category_id")))
        .order_by("-discount_percent")
        .values("discount_percent")[:1]
    )
    return Subquery(active_promotions, output_field=IntegerField())


class ProductViewSet(viewsets.ModelViewSet):
    """Catalogue public des produits actifs (vitrine principale), avec recherche, filtres et tri."""
    # Produits actifs de la vitrine principale, avec catégorie/vendeur, images actives,
    # note moyenne, nombre d'avis approuvés et remise promotionnelle active.
    queryset = (
        Product.objects.filter(
            is_active=True,
        )
        .filter(Q(shop__isnull=True) | Q(shop__visible_on_main_store=True))
        .select_related("category", "seller")
        .prefetch_related(
            Prefetch(
                "images",
                queryset=ProductImage.objects.filter(is_active=True).order_by("order", "created_at"),
            ),
            "option_groups__options",
        )
        .annotate(
            rating_average=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            discount_percent=_active_discount_subquery(),
        )
        .order_by("-created_at")
    )
    serializer_class = ProductSerializer
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, AccentInsensitiveSearchFilter, filters.OrderingFilter]
    # Filtres exposés à l'API (catégorie, unité, fourchette de prix, stock).
    filterset_fields = {
        "category__slug": ["exact"],
        "unit": ["exact"],
        "price_xof": ["gte", "lte"],
        "stock": ["gt"],
    }
    search_fields = ["name", "description"]
    ordering_fields = ["price_xof", "created_at"]


class SellerProductViewSet(viewsets.ModelViewSet):
    """Gestion des produits d'un vendeur (authentifié) : création, lecture, mise à jour, suppression."""
    serializer_class = SellerProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "slug"
    filter_backends = [AccentInsensitiveSearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["price_xof", "stock", "created_at", "updated_at"]

    def _seller(self):
        # Récupère le profil vendeur de l'utilisateur connecté (404 si absent).
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def get_serializer_context(self):
        # Passe le vendeur courant au sérialiseur (nécessaire pour la validation boutique).
        context = super().get_serializer_context()
        context["seller"] = self._seller()
        return context

    def get_queryset(self):
        # Produits du vendeur uniquement, avec leurs données liées, triés par mise à jour.
        return (
            Product.objects.filter(seller=self._seller())
        .select_related("category", "seller")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.filter(is_active=True).order_by("order", "created_at"),
                )
            )
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        # Associe automatiquement le produit au vendeur courant.
        serializer.save(seller=self._seller())

    def perform_destroy(self, instance):
        # Suppression « douce » : le produit est désactivé plutôt que supprimé.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class ProductImageListCreateView(ListCreateAPIView):
    """Liste et création des images d'un produit appartenant au vendeur."""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _seller(self):
        # Récupère le profil vendeur de l'utilisateur connecté (404 si absent).
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def _product(self):
        # Récupère le produit du vendeur ciblé par le slug d'URL.
        try:
            return Product.objects.get(slug=self.kwargs["slug"], seller=self._seller())
        except Product.DoesNotExist:
            raise NotFound("Produit introuvable ou non associé à ce vendeur.")

    def get_queryset(self):
        # Images actives du produit, triées par ordre d'affichage.
        return ProductImage.objects.filter(product=self._product(), is_active=True).order_by("order", "created_at")

    def perform_create(self, serializer):
        # Associe l'image au produit du vendeur.
        serializer.save(product=self._product())


class ProductImageDetailView(RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour et suppression d'une image d'un produit du vendeur."""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "id"
    lookup_url_kwarg = "image_id"

    def _seller(self):
        # Récupère le profil vendeur de l'utilisateur connecté (404 si absent).
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def _product(self):
        # Récupère le produit du vendeur ciblé par le slug d'URL.
        try:
            return Product.objects.get(slug=self.kwargs["slug"], seller=self._seller())
        except Product.DoesNotExist:
            raise NotFound("Produit introuvable ou non associé à ce vendeur.")

    def get_queryset(self):
        # Images actives du produit, triées par ordre d'affichage.
        return ProductImage.objects.filter(product=self._product(), is_active=True).order_by("order", "created_at")

    def perform_destroy(self, instance):
        # Suppression « douce » : l'image est désactivée plutôt que supprimée.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

    def delete(self, request, *args, **kwargs):
        # Réponse 204 après la suppression douce.
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=HTTP_204_NO_CONTENT)


def _seller_from_request(request):
    # Récupère le profil vendeur de la requête (404 si absent) — helper partagé.
    try:
        return request.user.seller_profile
    except SellerProfile.DoesNotExist:
        raise NotFound("Aucun profil vendeur n'est associé à ce compte.")


def _seller_product(slug, seller):
    # Récupère un produit appartenant au vendeur, ou 404.
    return get_object_or_404(Product, slug=slug, seller=seller)


class OptionGroupViewSet(viewsets.ModelViewSet):
    """CRUD des groupes d'options d'un produit du vendeur."""
    serializer_class = OptionGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _seller(self):
        # Profil vendeur de l'utilisateur connecté.
        return _seller_from_request(self.request)

    def _product(self):
        # Produit du vendeur ciblé par le slug d'URL.
        return _seller_product(self.kwargs["product_slug"], self._seller())

    def get_queryset(self):
        # Groupes d'options du produit, avec leurs options préchargées.
        return OptionGroup.objects.filter(product=self._product()).prefetch_related("options")

    def perform_create(self, serializer):
        # Associe le groupe d'options au produit du vendeur.
        serializer.save(product=self._product())


class OptionViewSet(viewsets.ModelViewSet):
    """CRUD des options d'un groupe d'options d'un produit du vendeur."""
    serializer_class = OptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _seller(self):
        # Profil vendeur de l'utilisateur connecté.
        return _seller_from_request(self.request)

    def _group(self):
        # Récupère le groupe d'options (d'un produit du vendeur) ciblé par l'URL.
        product = _seller_product(self.kwargs["product_slug"], self._seller())
        return get_object_or_404(OptionGroup, pk=self.kwargs["group_pk"], product=product)

    def get_queryset(self):
        # Options du groupe ciblé.
        return Option.objects.filter(group=self._group())

    def perform_create(self, serializer):
        # Associe l'option au groupe ciblé.
        serializer.save(group=self._group())
