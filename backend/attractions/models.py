from django.db import models

from destinations.models import Destination


class Attraction(models.Model):
    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="attractions"
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    entry_fee = models.DecimalField(
        max_digits=8, decimal_places=2, default=0, help_text="Per person, in INR. 0 = free."
    )
    timings = models.CharField(max_length=150, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_verified = models.DateField(
        null=True, blank=True,
        help_text="Date an admin last checked the fee and timings.",
    )

    class Meta:
        ordering = ["destination", "name"]

    def __str__(self):
        return f"{self.name} ({self.destination.name})"


class AttractionImage(models.Model):
    attraction = models.ForeignKey(
        Attraction, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="attractions/")
    caption = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Image of {self.attraction.name}"
