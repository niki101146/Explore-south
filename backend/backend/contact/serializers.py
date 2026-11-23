from rest_framework import serializers

from .models import ContactMessage


class ContactSerializer(serializers.ModelSerializer):
    # Honeypot: real visitors never see or fill this field, bots often do.
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ContactMessage
        fields = ("name", "email", "message", "website")

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Please enter your name.")
        return value

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Please write a little more (at least 10 characters).")
        return value


class ContactAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("id", "name", "email", "message", "is_read", "created_at")
        read_only_fields = ("id", "name", "email", "message", "created_at")
