from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, ValidateCartView

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("validate-cart/", ValidateCartView.as_view(), name="validate-cart"),
] + router.urls
