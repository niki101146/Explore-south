from django.conf import settings
from django.db import models

from attractions.models import Attraction
from destinations.models import Destination


class Itinerary(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="itineraries"
    )
    title = models.CharField(max_length=150)
    destination = models.ForeignKey(
        Destination, on_delete=models.SET_NULL, null=True, blank=True, related_name="itineraries"
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    num_travelers = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "itineraries"

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class ItineraryItem(models.Model):
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name="items")
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name="+")
    day_number = models.PositiveSmallIntegerField(default=1)
    sequence = models.PositiveSmallIntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["day_number", "sequence"]

    def __str__(self):
        return f"Day {self.day_number}: {self.attraction.name}"
