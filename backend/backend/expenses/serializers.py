from rest_framework import serializers

from .models import TravelExpense


class TravelExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelExpense
        fields = ("id", "itinerary", "expense_type", "amount", "note")

    def validate_itinerary(self, value):
        if value.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("This itinerary does not belong to you.")
        return value

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value


class BudgetInputSerializer(serializers.Serializer):
    """Amounts are totals for the whole group (not per person), in INR."""

    travelers = serializers.IntegerField(min_value=1, default=1)
    days = serializers.IntegerField(min_value=1, default=1)
    travel = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    accommodation = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    food = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    entry_fees = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    other = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
