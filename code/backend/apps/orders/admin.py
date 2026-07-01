from unfold.admin import ModelAdmin, TabularInline

from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["unit_price_xof"]


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ["id", "full_name", "phone", "city", "status", "total_xof", "created_at"]
    list_filter = ["status", "city"]
    search_fields = ["full_name", "phone", "email"]
    inlines = [OrderItemInline]
