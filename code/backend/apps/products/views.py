from django.db.models import Avg, Count, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Now
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.promotions.models import Promotion

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


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
        .annotate(
            rating_average=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
            review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            discount_percent=_active_discount_subquery(),
        )
        .order_by("-created_at")
    )
    serializer_class = ProductSerializer
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category__slug"]
    search_fields = ["name", "description"]
