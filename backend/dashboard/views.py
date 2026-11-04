from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Q
from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from attractions.models import Attraction
from bookings.models import Booking
from destinations.models import Destination
from favorites.models import Favorite
from itineraries.models import Itinerary
from reviews.models import Review

from config.permissions import IsAdminRole
from config.roles import get_role

from .serializers import AdminUserSerializer

User = get_user_model()


class AdminStatsView(APIView):
    """Numbers for the custom React admin dashboard (staff only)."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        approved = Q(reviews__status=Review.Status.APPROVED)

        top_favorited = (
            Destination.objects.annotate(favorite_count=Count("favorites", distinct=True))
            .filter(favorite_count__gt=0)
            .order_by("-favorite_count")[:5]
            .values("id", "name", "slug", "favorite_count")
        )
        top_rated = (
            Destination.objects.annotate(
                avg_rating=Avg("reviews__rating", filter=approved),
                review_count=Count("reviews", filter=approved, distinct=True),
            )
            .filter(review_count__gt=0)
            .order_by("-avg_rating", "-review_count")[:5]
            .values("id", "name", "slug", "avg_rating", "review_count")
        )
        by_state = (
            Destination.objects.values(state=F("city__state__name"))
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        by_status = {
            row["status"]: row["count"]
            for row in Review.objects.values("status").annotate(count=Count("id"))
        }
        recent_favorites = [
            {"id": f.id, "user": f.user.username, "destination": f.destination.name,
             "slug": f.destination.slug, "created_at": f.created_at}
            for f in Favorite.objects.select_related("user", "destination")[:10]
        ]
        recent_reviews = [
            {"id": r.id, "user": r.user.username, "destination": r.destination.name,
             "slug": r.destination.slug, "rating": r.rating, "comment": (r.comment or "")[:140],
             "status": r.status, "created_at": r.created_at}
            for r in Review.objects.select_related("user", "destination")[:10]
        ]
        return Response(
            {
                "recent_favorites": recent_favorites,
                "recent_reviews": recent_reviews,
                "totals": {
                    "users": User.objects.count(),
                    "destinations": Destination.objects.count(),
                    "attractions": Attraction.objects.count(),
                    "reviews": Review.objects.count(),
                    "pending_reviews": by_status.get(Review.Status.PENDING, 0),
                    "favorites": Favorite.objects.count(),
                    "itineraries": Itinerary.objects.count(),
                    "bookings": Booking.objects.count(),
                },
                "reviews_by_status": by_status,
                "destinations_by_state": list(by_state),
                "top_favorited": list(top_favorited),
                "top_rated": list(top_rated),
            }
        )


class AdminUserViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Staff-only user list; the only editable field is is_active."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "patch", "head", "options"]
    search_fields = ["username", "email"]
    queryset = User.objects.annotate(
        favorites_count=Count("favorites", distinct=True),
        reviews_count=Count("reviews", distinct=True),
    ).order_by("-date_joined")

    def perform_update(self, serializer):
        target = serializer.instance
        data = serializer.validated_data
        is_self = target.pk == self.request.user.pk
        if is_self and not data.get("is_active", True):
            raise serializers.ValidationError("You cannot deactivate your own account.")
        if "role" in data and data["role"] != get_role(target):
            if is_self:
                raise serializers.ValidationError("You cannot change your own role.")
            if target.is_superuser:
                raise serializers.ValidationError("A superuser's role can only be changed in Django admin.")
        serializer.save()
