from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Delivery, DeliverySlot, DeliveryZone


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(ModelAdmin):
    list_display = ["name", "fee_xof", "is_active"]
    list_filter = ["is_active"]


@admin.register(DeliverySlot)
class DeliverySlotAdmin(ModelAdmin):
    list_display = ["label", "start_time", "end_time", "is_active"]


@admin.register(Delivery)
class DeliveryAdmin(ModelAdmin):
    list_display = ["id", "order", "zone", "slot", "courier_name", "status", "scheduled_date"]
    list_filter = ["status", "zone"]
    search_fields = ["order__full_name", "courier_name"]
