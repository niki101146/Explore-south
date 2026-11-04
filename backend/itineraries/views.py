from rest_framework import permissions, viewsets

from .models import Itinerary, ItineraryItem
from .serializers import ItineraryItemSerializer, ItinerarySerializer


class ItineraryViewSet(viewsets.ModelViewSet):
    serializer_class = ItinerarySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return (
            Itinerary.objects.filter(user=self.request.user)
            .select_related("destination")
            .prefetch_related("items__attraction", "expenses")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ItineraryItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItineraryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filterset_fields = ["itinerary"]

    def get_queryset(self):
        return ItineraryItem.objects.filter(
            itinerary__user=self.request.user
        ).select_related("attraction")
