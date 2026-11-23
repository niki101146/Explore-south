from django.conf import settings
from django.db import models

from destinations.models import Destination


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    destination_name = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField()
    num_travelers = models.PositiveSmallIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    plan = models.JSONField(default=dict)  # snapshot of the plan the traveller confirmed
    email = models.EmailField()
    reference = models.CharField(max_length=20, unique=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.CONFIRMED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f"ES{self.pk:06d}"
            super().save(update_fields=["reference"])

    def __str__(self):
        return f"{self.reference} - {self.destination_name}"
