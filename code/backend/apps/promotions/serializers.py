from rest_framework import serializers


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField()
