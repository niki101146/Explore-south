from django.contrib import admin

from .models import TravelExpense


@admin.register(TravelExpense)
class TravelExpenseAdmin(admin.ModelAdmin):
    list_display = ("itinerary", "expense_type", "amount")
    list_filter = ("expense_type",)
