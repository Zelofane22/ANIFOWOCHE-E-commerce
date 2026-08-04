import re

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError


def normalize_phone(value):
    """
    Normalise un numéro béninois vers le format canonique +22901XXXXXXXX.
    - Retire espaces/tirets/parenthèses.
    - Convertit les anciens mobiles 8 chiffres (97..., 90..., etc.) en 01XXXXXXXX.
    - Retourne le format canonique +22901XXXXXXXX si mobile béninois, sinon les chiffres nettoyés.
    """
    if not value:
        return ""
    digits = re.sub(r"\D", "", value)
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("229") and len(digits) > 3:
        digits = digits[3:]
    # Ancien format mobile 8 chiffres (97..., 90..., 66..., 41..., 54...) → 01XXXXXXXX
    if len(digits) == 8 and digits[0] in "45679":
        digits = "01" + digits
    if re.fullmatch(r"01\d{8}", digits):
        return "+229" + digits
    # Repli : garder les chiffres nettoyés (compat recherche login).
    return f"+229{digits}" if digits else ""


def validate_benin_phone(value):
    """
    Valide et normalise un numéro béninois vers +22901XXXXXXXX.
    Lève ValidationError si le numéro n'est pas un mobile béninois récupérable.
    """
    if not value:
        return value
    digits = re.sub(r"\D", "", value)
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("229") and len(digits) > 3:
        digits = digits[3:]
    # Ancien format mobile 8 chiffres → 01XXXXXXXX
    if len(digits) == 8 and digits[0] in "45679":
        digits = "01" + digits
    if re.fullmatch(r"01\d{8}", digits):
        return "+229" + digits
    raise ValidationError("Le numéro de téléphone doit être un mobile béninois commençant par 01.")


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
