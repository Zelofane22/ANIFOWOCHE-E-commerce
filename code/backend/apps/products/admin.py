from unfold.admin import ModelAdmin, TabularInline

from django.contrib import admin

from .models import Category, Option, OptionGroup, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ["name", "seller", "shop", "category", "price_xof", "unit", "stock", "is_active"]
    list_filter = ["category", "seller", "shop", "is_active", "unit", "size"]
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
