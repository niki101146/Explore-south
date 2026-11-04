from django.utils import timezone
from rest_framework import serializers

from destinations.models import Destination

from .models import Booking
from .planner import DEFAULT_STYLE, MAX_DAYS, MAX_TRAVELERS, STYLES


class BookingInputSerializer(serializers.Serializer):
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.filter(is_published=True))
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    num_travelers = serializers.IntegerField(min_value=1, max_value=MAX_TRAVELERS)
    email = serializers.EmailField(required=False, allow_blank=True)
    style = serializers.ChoiceField(choices=list(STYLES), required=False, default=DEFAULT_STYLE)

    def validate(self, attrs):
        if attrs["start_date"] < timezone.localdate():
            raise serializers.ValidationError({"start_date": "The start date cannot be in the past."})
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date": "The end date must be on or after the start date."})
        if (attrs["end_date"] - attrs["start_date"]).days + 1 > MAX_DAYS:
            raise serializers.ValidationError({"end_date": f"Trips can be up to {MAX_DAYS} days long."})
        return attrs


class BookingSerializer(serializers.ModelSerializer):
    destination_slug = serializers.CharField(source="destination.slug", read_only=True, default=None)

    class Meta:
        model = Booking
        fields = ("id", "reference", "status", "destination", "destination_name", "destination_slug",
                  "start_date", "end_date", "num_travelers", "total_amount", "email", "plan", "created_at")
        read_only_fields = fields


class BookingAdminSerializer(BookingSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ("username",)
        read_only_fields = fields
