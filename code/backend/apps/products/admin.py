from unfold.admin import ModelAdmin, TabularInline

from django.contrib import admin

from .models import Category, Option, OptionGroup, Product, ProductImage

LOW_STOCK_THRESHOLD = 10


class LowStockListFilter(admin.SimpleListFilter):
    """Filtre « Stock faible » : produits actifs vendus sur stock sous le seuil."""

    title = "stock faible"
    parameter_name = "low_stock"

    def lookups(self, request, model_admin):
        return (("1", f"Sous le seuil ({LOW_STOCK_THRESHOLD})"),)

    def queryset(self, request, queryset):
        if self.value() == "1":
            return queryset.filter(
                is_active=True, stock__lte=LOW_STOCK_THRESHOLD, made_to_order=False
            )
        return queryset


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["name", "slug", "parent", "level", "order", "is_active"]
    list_filter = ["level", "is_active", "parent"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["level", "order", "name"]


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ["name", "seller", "shop", "category", "price_xof", "unit", "stock", "made_to_order", "is_active"]
    list_filter = ["category", "seller", "shop", "is_active", "unit", "size", "made_to_order", LowStockListFilter]
    search_fields = ["name", "description", "seller__display_name", "shop__name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]


class OptionInline(TabularInline):
    model = Option
    extra = 1


@admin.register(OptionGroup)
class OptionGroupAdmin(ModelAdmin):
    list_display = ["name", "product", "is_required", "min_selections", "max_selections"]
    list_filter = ["is_required", "product__seller"]
    search_fields = ["name", "product__name"]
    inlines = [OptionInline]
