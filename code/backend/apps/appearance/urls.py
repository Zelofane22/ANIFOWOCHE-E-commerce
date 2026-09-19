from django.urls import path

from .views import (
    DraftConfigView,
    HistoryView,
    PreviewVersionView,
    PublishView,
    RestoreView,
    SiteConfigView,
)

urlpatterns = [
    path("", SiteConfigView.as_view(), name="site-config"),
    path("draft/", DraftConfigView.as_view(), name="site-config-draft"),
    path("preview/<int:pk>/", PreviewVersionView.as_view(), name="site-config-preview"),
    path("publish/", PublishView.as_view(), name="site-config-publish"),
    path("history/", HistoryView.as_view(), name="site-config-history"),
    path("restore/<int:pk>/", RestoreView.as_view(), name="site-config-restore"),
]
