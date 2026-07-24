from unfold.admin import ModelAdmin, TabularInline

from django.contrib import admin

from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ["name", "seller", "category", "price_xof", "unit", "stock", "is_active"]
    list_filter = ["category", "seller", "is_active", "unit", "size"]
    search_fields = ["name", "description", "seller__display_name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]
