from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, MeView, RegisterView

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
