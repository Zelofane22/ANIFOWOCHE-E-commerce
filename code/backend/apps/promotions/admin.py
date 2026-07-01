from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Coupon, Promotion


@admin.register(Promotion)
class PromotionAdmin(ModelAdmin):
    list_display = ["name", "discount_percent", "starts_at", "ends_at", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    filter_horizontal = ["products", "categories"]


@admin.register(Coupon)
class CouponAdmin(ModelAdmin):
    list_display = ["code", "discount_percent", "used_count", "max_uses", "expires_at", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["code"]
