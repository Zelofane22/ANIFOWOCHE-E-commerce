from unfold.admin import ModelAdmin, TabularInline

from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["unit_price_xof"]


class ToProcessListFilter(admin.SimpleListFilter):
    """Filtre « À traiter » : commandes reçues ou préparées, pas encore livrées."""

    title = "à traiter"
    parameter_name = "to_process"

    def lookups(self, request, model_admin):
        return (("1", "Reçues / préparées"),)

    def queryset(self, request, queryset):
        if self.value() == "1":
            return queryset.filter(
                status__in=[Order.Status.RECEIVED, Order.Status.PREPARED]
            )
        return queryset


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ["reference", "full_name", "phone", "city", "delivery_zone", "status", "total_xof", "created_at"]
    list_filter = ["status", "city", ToProcessListFilter]
    search_fields = ["full_name", "phone", "email"]
    readonly_fields = ["reference"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    inlines = [OrderItemInline]
