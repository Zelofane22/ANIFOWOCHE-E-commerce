from unfold.admin import ModelAdmin

from django.contrib import admin

from apps.core.admin_mixins import ReadOnlyAdminMixin

from .models import Delivery, DeliverySlot, DeliveryZone


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["name", "fee_xof", "latitude", "longitude", "radius_km", "is_active"]
    list_filter = ["is_active"]


@admin.register(DeliverySlot)
class DeliverySlotAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["label", "start_time", "end_time", "is_active"]
    search_fields = ["label"]


@admin.register(Delivery)
class DeliveryAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["id", "order", "zone", "slot", "courier_name", "status", "scheduled_date"]
    list_filter = ["status", "zone"]
    search_fields = ["order__full_name", "courier_name"]
