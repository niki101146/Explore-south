from django.contrib.auth import get_user_model
from rest_framework import serializers

from config.roles import ROLE_CHOICES, get_role, set_role

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    favorites_count = serializers.IntegerField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff", "is_active", "role", "date_joined",
                  "favorites_count", "reviews_count")
        read_only_fields = ("id", "username", "email", "is_staff", "date_joined")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["role"] = get_role(instance)
        return data

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        instance = super().update(instance, validated_data)
        if role:
            set_role(instance, role)
        return instance
