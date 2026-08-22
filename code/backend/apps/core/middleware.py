import threading
from django.shortcuts import redirect
from django.urls import reverse

FORCE_PASSWORD_CHANGE_SESSION_KEY = "force_password_change"

_thread_locals = threading.local()


def get_current_user():
    return getattr(_thread_locals, "user", None)


class CurrentUserMiddleware:
    """Stocke l'utilisateur courant dans un thread-local pour permettre
    aux signaux (pre_delete, pre_save) de remonter l'acteur."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, "user", None)
        try:
            return self.get_response(request)
        finally:
            _thread_locals.user = None


class ForceDefaultPasswordChangeMiddleware:
    """Redirige vers le changement de mot de passe tant que le superadmin
    utilise encore le mot de passe par défaut (voir apps.core.signals)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Traitement uniquement sur les pages admin d'un utilisateur connecté.
        if request.path.startswith("/admin/") and request.user.is_authenticated:
            change_url = reverse("admin:password_change")
            done_url = reverse("admin:password_change_done")
            logout_url = reverse("admin:logout")

            # Une fois le mot de passe changé, le drapeau de session est retiré.
            if request.path == done_url:
                request.session.pop(FORCE_PASSWORD_CHANGE_SESSION_KEY, None)
            # Sinon, tant que le drapeau est actif, tout accès admin est redirigé
            # vers le changement de mot de passe (hors cette page et la déconnexion).
            elif (
                request.session.get(FORCE_PASSWORD_CHANGE_SESSION_KEY)
                and request.path not in (change_url, logout_url)
            ):
                return redirect(change_url)

        return self.get_response(request)
