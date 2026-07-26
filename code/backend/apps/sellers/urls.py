from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.products.views import ProductImageDetailView, ProductImageListCreateView, SellerProductViewSet
from .views import (
    PublicShopView,
    SellerConfirmPaymentView,
    SellerDashboardView,
    SellerPaymentRelaunchView,
    SellerProfileView,
    SellerRegisterView,
    SellerOrderViewSet,
)

router = DefaultRouter()
router.register("seller/products", SellerProductViewSet, basename="seller-product")
router.register("seller/orders", SellerOrderViewSet, basename="seller-order")

urlpatterns = [
    path("", include(router.urls)),
    path("seller/products/<slug:slug>/images/", ProductImageListCreateView.as_view(), name="seller-product-images"),
    path("seller/products/<slug:slug>/images/<int:image_id>/", ProductImageDetailView.as_view(), name="seller-product-image-detail"),
    path("seller/register/", SellerRegisterView.as_view(), name="seller-register"),
    path("seller/profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("seller/dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("seller/orders/<int:order_id>/relance-paiement/", SellerPaymentRelaunchView.as_view(), name="seller-payment-relaunch"),
    path("seller/orders/<int:order_id>/confirmer-paiement/", SellerConfirmPaymentView.as_view(), name="seller-confirm-payment"),
    path("public/shops/<slug:slug>/", PublicShopView.as_view(), name="public-shop-detail"),
]
