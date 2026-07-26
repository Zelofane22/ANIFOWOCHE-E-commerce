from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.products.views import (OptionGroupViewSet, OptionViewSet,
                                 ProductImageDetailView,
                                 ProductImageListCreateView,
                                 SellerProductViewSet)
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

option_group_list = OptionGroupViewSet.as_view({"get": "list", "post": "create"})
option_group_detail = OptionGroupViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})
option_list = OptionViewSet.as_view({"get": "list", "post": "create"})
option_detail = OptionViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})

urlpatterns = [
    path("", include(router.urls)),
    path("seller/products/<slug:slug>/images/", ProductImageListCreateView.as_view(), name="seller-product-images"),
    path("seller/products/<slug:slug>/images/<int:image_id>/", ProductImageDetailView.as_view(), name="seller-product-image-detail"),
    path("seller/products/<slug:product_slug>/option-groups/", option_group_list, name="seller-option-group-list"),
    path("seller/products/<slug:product_slug>/option-groups/<int:pk>/", option_group_detail, name="seller-option-group-detail"),
    path("seller/products/<slug:product_slug>/option-groups/<int:group_pk>/options/", option_list, name="seller-option-list"),
    path("seller/products/<slug:product_slug>/option-groups/<int:group_pk>/options/<int:pk>/", option_detail, name="seller-option-detail"),
    path("seller/register/", SellerRegisterView.as_view(), name="seller-register"),
    path("seller/profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("seller/dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("seller/orders/<int:order_id>/relance-paiement/", SellerPaymentRelaunchView.as_view(), name="seller-payment-relaunch"),
    path("seller/orders/<int:order_id>/confirmer-paiement/", SellerConfirmPaymentView.as_view(), name="seller-confirm-payment"),
    path("public/shops/<slug:slug>/", PublicShopView.as_view(), name="public-shop-detail"),
]
