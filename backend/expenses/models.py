from django.db import models

from itineraries.models import Itinerary


class TravelExpense(models.Model):
    class ExpenseType(models.TextChoices):
        TRAVEL = "travel", "Travel"
        ACCOMMODATION = "accommodation", "Accommodation"
        FOOD = "food", "Food"
        ENTRY_FEES = "entry_fees", "Entry fees"
        OTHER = "other", "Other"

    itinerary = models.ForeignKey(
        Itinerary, on_delete=models.CASCADE, related_name="expenses"
    )
    expense_type = models.CharField(max_length=20, choices=ExpenseType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.get_expense_type_display()}: {self.amount}"
