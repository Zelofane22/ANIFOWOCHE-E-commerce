from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from .middleware import FORCE_PASSWORD_CHANGE_SESSION_KEY


@receiver(user_logged_in)
def flag_default_password_on_login(sender, request, user, **kwargs):
    if user.check_password(settings.DEFAULT_SUPERUSER_PASSWORD):
        request.session[FORCE_PASSWORD_CHANGE_SESSION_KEY] = True
