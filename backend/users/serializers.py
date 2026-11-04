from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from config.roles import get_role

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        candidate = User(
            username=attrs.get("username", ""), email=attrs.get("email", "")
        )
        validate_password(attrs["password"], candidate)
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="profile.phone", required=False, allow_blank=True)
    city = serializers.CharField(source="profile.city", required=False, allow_blank=True)
    profile_image = serializers.ImageField(
        source="profile.profile_image", required=False, allow_null=True
    )
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return get_role(obj)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "is_staff", "role", "phone", "city", "profile_image",
        )
        read_only_fields = ("id", "username", "is_staff", "role")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds username and is_staff to the token so React can show the right menu."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        token["role"] = get_role(user)
        return token
