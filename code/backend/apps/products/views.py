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
        Product.objects.filter(
            is_active=True,
        )
        .filter(Q(shop__isnull=True) | Q(shop__visible_on_main_store=True))
        .select_related("category", "seller")
        .prefetch_related(
            Prefetch(
                "images",
                queryset=ProductImage.objects.filter(is_active=True).order_by("order", "created_at"),
            )
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
    filter_backends = [AccentInsensitiveSearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["price_xof", "stock", "created_at", "updated_at"]

    def _seller(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["seller"] = self._seller()
        return context

    def get_queryset(self):
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
        serializer.save(seller=self._seller())

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class ProductImageListCreateView(ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _seller(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def _product(self):
        try:
            return Product.objects.get(slug=self.kwargs["slug"], seller=self._seller())
        except Product.DoesNotExist:
            raise NotFound("Produit introuvable ou non associé à ce vendeur.")

    def get_queryset(self):
        return ProductImage.objects.filter(product=self._product(), is_active=True).order_by("order", "created_at")

    def perform_create(self, serializer):
        serializer.save(product=self._product())


class ProductImageDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "id"
    lookup_url_kwarg = "image_id"

    def _seller(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

    def _product(self):
        try:
            return Product.objects.get(slug=self.kwargs["slug"], seller=self._seller())
        except Product.DoesNotExist:
            raise NotFound("Produit introuvable ou non associé à ce vendeur.")

    def get_queryset(self):
        return ProductImage.objects.filter(product=self._product(), is_active=True).order_by("order", "created_at")

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=HTTP_204_NO_CONTENT)


def _seller_from_request(request):
    try:
        return request.user.seller_profile
    except SellerProfile.DoesNotExist:
        raise NotFound("Aucun profil vendeur n'est associé à ce compte.")


def _seller_product(slug, seller):
    return get_object_or_404(Product, slug=slug, seller=seller)


class OptionGroupViewSet(viewsets.ModelViewSet):
    serializer_class = OptionGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _seller(self):
        return _seller_from_request(self.request)

    def _product(self):
        return _seller_product(self.kwargs["product_slug"], self._seller())

    def get_queryset(self):
        return OptionGroup.objects.filter(product=self._product()).prefetch_related("options")

    def perform_create(self, serializer):
        serializer.save(product=self._product())


class OptionViewSet(viewsets.ModelViewSet):
    serializer_class = OptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _seller(self):
        return _seller_from_request(self.request)

    def _group(self):
        product = _seller_product(self.kwargs["product_slug"], self._seller())
        return get_object_or_404(OptionGroup, pk=self.kwargs["group_pk"], product=product)

    def get_queryset(self):
        return Option.objects.filter(group=self._group())

    def perform_create(self, serializer):
        serializer.save(group=self._group())
