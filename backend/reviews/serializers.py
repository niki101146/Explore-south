from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Public / user-facing. New reviews always start as pending."""

    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user_name", "rating", "comment", "status", "created_at")
        read_only_fields = ("status", "created_at")


class ReviewModerationSerializer(serializers.ModelSerializer):
    """Admin dashboard: only the status can be changed."""

    user_name = serializers.CharField(source="user.username", read_only=True)
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user_name", "destination", "destination_name",
                  "rating", "comment", "status", "created_at")
        read_only_fields = ("destination", "rating", "comment", "created_at")
