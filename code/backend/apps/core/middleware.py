from django.shortcuts import redirect
from django.urls import reverse

FORCE_PASSWORD_CHANGE_SESSION_KEY = "force_password_change"


class ForceDefaultPasswordChangeMiddleware:
    """Redirige vers le changement de mot de passe tant que le superadmin
    utilise encore le mot de passe par défaut (voir apps.core.signals)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/admin/") and request.user.is_authenticated:
            change_url = reverse("admin:password_change")
            done_url = reverse("admin:password_change_done")
            logout_url = reverse("admin:logout")

            if request.path == done_url:
                request.session.pop(FORCE_PASSWORD_CHANGE_SESSION_KEY, None)
            elif (
                request.session.get(FORCE_PASSWORD_CHANGE_SESSION_KEY)
                and request.path not in (change_url, logout_url)
            ):
                return redirect(change_url)

        return self.get_response(request)
