from django.conf import settings
from django.db import models

from destinations.models import Destination


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="favorites"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "destination"], name="unique_favorite_per_user"
            )
        ]

    def __str__(self):
        return f"{self.user.username} likes {self.destination.name}"
