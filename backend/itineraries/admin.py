from django.contrib import admin

from .models import Itinerary, ItineraryItem


class ItineraryItemInline(admin.TabularInline):
    model = ItineraryItem
    extra = 0


@admin.register(Itinerary)
class ItineraryAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "destination", "start_date", "end_date", "num_travelers")
    search_fields = ("title", "user__username")
    inlines = [ItineraryItemInline]
