from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price_xof", "stock", "is_active"]
    list_filter = ["category", "is_active", "size"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
