from rest_framework import serializers

from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)
    destination_slug = serializers.CharField(source="destination.slug", read_only=True)
    cover_image = serializers.ImageField(source="destination.cover_image", read_only=True)
    city_name = serializers.CharField(source="destination.city.name", read_only=True)
    state_name = serializers.CharField(source="destination.city.state.name", read_only=True)

    class Meta:
        model = Favorite
        fields = (
            "id", "destination", "destination_name", "destination_slug",
            "cover_image", "city_name", "state_name", "created_at",
        )
        read_only_fields = ("created_at",)
        validators = []  # duplicates are handled in the view
