from django.urls import path

from .views import PublicShopView, SellerDashboardView, SellerProfileView, SellerRegisterView

urlpatterns = [
    path("seller/register/", SellerRegisterView.as_view(), name="seller-register"),
    path("seller/profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("seller/dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("public/shops/<slug:slug>/", PublicShopView.as_view(), name="public-shop-detail"),
]
