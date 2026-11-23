from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TravelExpense
from .serializers import BudgetInputSerializer, TravelExpenseSerializer


class TravelExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = TravelExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filterset_fields = ["itinerary", "expense_type"]

    def get_queryset(self):
        return TravelExpense.objects.filter(itinerary__user=self.request.user)


class BudgetCalculatorView(APIView):
    """Public: POST amounts, get back a total and per-person / per-day figures."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = BudgetInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        breakdown = {k: d[k] for k in ("travel", "accommodation", "food", "entry_fees", "other")}
        total = sum(breakdown.values())
        return Response(
            {
                "breakdown": breakdown,
                "total": total,
                "travelers": d["travelers"],
                "days": d["days"],
                "per_person": round(total / d["travelers"], 2),
                "per_day": round(total / d["days"], 2),
            }
        )
