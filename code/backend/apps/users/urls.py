from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, MeView, PasswordResetConfirmView, PasswordResetRequestView, RegisterView

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
