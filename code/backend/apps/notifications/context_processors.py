from django.db import DatabaseError, ProgrammingError
from django.urls import reverse

from .models import BackofficeNotification


def backoffice_notifications(request):
    if not request.path.startswith("/admin/") or not getattr(request, "user", None) or not request.user.is_staff:
        return {}

    try:
        count = BackofficeNotification.objects.count()
    except (DatabaseError, ProgrammingError):
        count = 0

    return {
        "backoffice_notifications_count": count,
        "backoffice_notifications_url": reverse("admin_backoffice_notifications"),
    }
