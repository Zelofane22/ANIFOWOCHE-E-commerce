from django.urls import path

from .views import PageViewCreateView

urlpatterns = [
    path("pageview/", PageViewCreateView.as_view(), name="pageview_create"),
]
