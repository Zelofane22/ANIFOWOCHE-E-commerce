from rest_framework import serializers


class ValidateCouponSerializer(serializers.Serializer):
    """Validation d'entrée pour la requête de vérification d'un code coupon."""
    code = serializers.CharField()
