from django.db.models import Sum
from rest_framework import serializers

from .models import Itinerary, ItineraryItem


class ItineraryItemSerializer(serializers.ModelSerializer):
    attraction_name = serializers.CharField(source="attraction.name", read_only=True)
    entry_fee = serializers.DecimalField(
        source="attraction.entry_fee", max_digits=8, decimal_places=2, read_only=True
    )

    class Meta:
        model = ItineraryItem
        fields = ("id", "itinerary", "attraction", "attraction_name", "entry_fee",
                  "day_number", "sequence", "notes")

    def validate_itinerary(self, value):
        request = self.context["request"]
        if value.user_id != request.user.id:
            raise serializers.ValidationError("This itinerary does not belong to you.")
        return value


class ItinerarySerializer(serializers.ModelSerializer):
    items = ItineraryItemSerializer(many=True, read_only=True)
    destination_name = serializers.CharField(
        source="destination.name", read_only=True, default=None
    )
    destination_slug = serializers.CharField(
        source="destination.slug", read_only=True, default=None
    )
    expense_total = serializers.SerializerMethodField()

    class Meta:
        model = Itinerary
        fields = ("id", "title", "destination", "destination_name", "destination_slug", "start_date",
                  "end_date", "num_travelers", "items", "expense_total", "created_at")
        read_only_fields = ("created_at",)

    def get_expense_total(self, obj):
        total = obj.expenses.aggregate(total=Sum("amount"))["total"]
        return total or 0

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError("end_date cannot be before start_date.")
        return attrs
