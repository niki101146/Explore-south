from django.contrib import admin

from .models import Banner, Category, City, Destination, DestinationImage, State


class DestinationImageInline(admin.TabularInline):
    model = DestinationImage
    extra = 1


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "state")
    list_filter = ("state",)
    search_fields = ("name",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "best_season", "avg_daily_budget",
                    "is_featured", "is_published", "last_verified")
    list_filter = ("city__state", "categories", "best_season", "is_featured", "is_published")
    search_fields = ("name", "city__name", "description")
    filter_horizontal = ("categories",)
    inlines = [DestinationImageInline]


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("page", "caption", "order")
    list_filter = ("page",)
