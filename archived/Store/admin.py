from django.contrib import admin
from .models import Product, Brand


class StoreAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}


admin.site.register(Product, StoreAdmin)
admin.site.register(Brand)