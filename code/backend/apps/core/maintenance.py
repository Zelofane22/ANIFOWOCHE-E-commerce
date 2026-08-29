from rest_framework import status
from rest_framework.response import Response

from .models import StoreSettings

MAINTENANCE_MESSAGE = "La boutique est temporairement en maintenance. Les actions vendeur sont suspendues."

def is_maintenance_mode() -> bool:
    return StoreSettings.get_solo().maintenance_mode

def maintenance_response():
    return Response(
        {"detail": MAINTENANCE_MESSAGE},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )

def block_if_maintenance():
    """Retourne une Response 503 si maintenance active, sinon None. Usage: blocked = block_if_maintenance(); if blocked: return blocked"""
    if is_maintenance_mode():
        return maintenance_response()
    return None
