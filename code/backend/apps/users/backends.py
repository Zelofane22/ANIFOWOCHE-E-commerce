import re

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


def normalize_phone(value):
    """Retire espaces/tirets/parenthèses pour comparer des numéros saisis différemment."""
    return re.sub(r"[\s\-().]", "", value)


class EmailOrPhoneModelBackend(ModelBackend):
    """Authentifie via le nom d'utilisateur, l'email ou le téléphone (Profile.phone)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if username is None or password is None:
            return None

        user = (
            UserModel._default_manager.filter(username__iexact=username).first()
            or UserModel._default_manager.filter(email__iexact=username).first()
            or UserModel._default_manager.filter(profile__phone=normalize_phone(username)).first()
            or UserModel._default_manager.filter(seller_profile__phone=normalize_phone(username)).first()
        )
        if user is None:
            # Calcule quand même un hash pour limiter les attaques par mesure de temps.
            UserModel().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
