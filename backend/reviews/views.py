from rest_framework import mixins, permissions, viewsets

from config.permissions import IsAdminRole

from .models import Review
from .serializers import ReviewModerationSerializer


class ReviewModerationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Staff-only: list reviews (filter by ?status=pending), approve/reject, delete."""

    queryset = Review.objects.select_related("user", "destination")
    serializer_class = ReviewModerationSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ["status", "destination"]
    search_fields = ["comment", "user__username", "destination__name"]
    http_method_names = ["get", "patch", "delete", "head", "options"]
