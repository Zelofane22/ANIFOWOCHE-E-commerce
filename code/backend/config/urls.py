from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import AuthTokenObtainPairView

urlpatterns = [
    path("admin/", include("apps.core.urls")),
    path("admin/", admin.site.urls),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/delivery/", include("apps.delivery.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/content/", include("apps.content.urls")),
    path("api/promotions/", include("apps.promotions.urls")),
    path("api/returns/", include("apps.returns.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/auth/", include("apps.users.urls")),
    path("api/auth/token/", AuthTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
]
