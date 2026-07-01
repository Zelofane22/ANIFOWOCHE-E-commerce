from django.urls import path

from .views import reports_view

urlpatterns = [
    path("rapports/", reports_view, name="admin_reports"),
]
