from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.products.views import SellerProductViewSet
from .views import PublicShopView, SellerDashboardView, SellerProfileView, SellerRegisterView

router = DefaultRouter()
router.register("seller/products", SellerProductViewSet, basename="seller-product")

urlpatterns = [
    path("", include(router.urls)),
    path("seller/register/", SellerRegisterView.as_view(), name="seller-register"),
    path("seller/profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("seller/dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("public/shops/<slug:slug>/", PublicShopView.as_view(), name="public-shop-detail"),
]
