from django.db.models import Avg, Count, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Now
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.promotions.models import Promotion
from apps.sellers.models import SellerProfile

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, SellerProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
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
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related("category")
        .prefetch_related("images")
        .annotate(
            rating_average=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            discount_percent=_active_discount_subquery(),
        )
        .order_by("-created_at")
    )
    serializer_class = ProductSerializer
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "category__slug": ["exact"],
        "unit": ["exact"],
        "price_xof": ["gte", "lte"],
        "stock": ["gt"],
    }
    search_fields = ["name", "description"]
    ordering_fields = ["price_xof", "created_at"]


class SellerProductViewSet(viewsets.ModelViewSet):
    serializer_class = SellerProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["price_xof", "stock", "created_at", "updated_at"]

    def _seller(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def get_queryset(self):
        return (
            Product.objects.filter(seller=self._seller())
            .select_related("category")
            .prefetch_related("images")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(seller=self._seller())

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
