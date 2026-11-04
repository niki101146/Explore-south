from django.contrib import admin

from .models import Attraction, AttractionImage


class AttractionImageInline(admin.TabularInline):
    model = AttractionImage
    extra = 1


@admin.register(Attraction)
class AttractionAdmin(admin.ModelAdmin):
    list_display = ("name", "destination", "entry_fee", "timings", "last_verified")
    list_filter = ("destination__city__state", "destination")
    search_fields = ("name", "destination__name")
    inlines = [AttractionImageInline]
