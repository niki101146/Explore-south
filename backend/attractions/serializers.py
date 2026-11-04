from rest_framework import serializers

from config.validators import validate_image_file

from .models import Attraction, AttractionImage


class AttractionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttractionImage
        fields = ("id", "attraction", "image", "caption")

    def validate_image(self, value):
        return validate_image_file(value)


class AttractionSerializer(serializers.ModelSerializer):
    images = AttractionImageSerializer(many=True, read_only=True)
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = Attraction
        fields = (
            "id", "destination", "destination_name", "name", "description", "entry_fee",
            "timings", "latitude", "longitude", "last_verified", "images",
        )
