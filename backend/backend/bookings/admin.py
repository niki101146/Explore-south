from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("reference", "destination_name", "user", "start_date", "end_date", "num_travelers", "total_amount", "status")
    list_filter = ("status",)
    search_fields = ("reference", "email", "destination_name", "user__username")
    readonly_fields = ("reference", "plan", "created_at")
