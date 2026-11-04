from django.db.models import Avg, Count, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from config.permissions import EditorWriteAdminDelete, IsAdminOrReadOnly, IsEditorOrReadOnly
from config.roles import is_editor_or_admin
from reviews.models import Review
from reviews.serializers import ReviewSerializer

from .filters import DestinationFilter
from .models import Banner, Category, City, Destination, DestinationImage, State
from .serializers import (
    BannerSerializer,
    CategorySerializer,
    CitySerializer,
    DestinationDetailSerializer,
    DestinationImageSerializer,
    DestinationListSerializer,
    DestinationWriteSerializer,
    StateSerializer,
)


class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None


class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.select_related("state")
    serializer_class = CitySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filterset_fields = ["state"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class DestinationViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    permission_classes = [EditorWriteAdminDelete]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_class = DestinationFilter
    search_fields = ["name", "short_description", "description",
                     "city__name", "city__state__name"]
    ordering_fields = ["name", "avg_daily_budget", "avg_rating", "created_at"]

    def get_queryset(self):
        approved = Q(reviews__status=Review.Status.APPROVED)
        qs = (
            Destination.objects.select_related("city__state")
            .prefetch_related("categories", "images", "attractions__images")
            .annotate(
                avg_rating=Avg("reviews__rating", filter=approved),
                review_count=Count("reviews", filter=approved, distinct=True),
            )
        )
        user = self.request.user
        if not is_editor_or_admin(user):
            qs = qs.filter(is_published=True)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return DestinationListSerializer
        if self.action == "retrieve":
            return DestinationDetailSerializer
        return DestinationWriteSerializer

    @action(
        detail=True, methods=["get", "post"],
        permission_classes=[permissions.IsAuthenticatedOrReadOnly],
    )
    def reviews(self, request, slug=None):
        destination = self.get_object()
        if request.method == "GET":
            reviews = destination.reviews.filter(
                status=Review.Status.APPROVED
            ).select_related("user")
            return Response(ReviewSerializer(reviews, many=True).data)

        if destination.reviews.filter(user=request.user).exists():
            return Response(
                {"detail": "You have already reviewed this destination."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, destination=destination)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DestinationImageViewSet(viewsets.ModelViewSet):
    queryset = DestinationImage.objects.all()
    serializer_class = DestinationImageSerializer
    permission_classes = [IsEditorOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None
    filterset_fields = ["destination"]


class BannerViewSet(viewsets.ModelViewSet):
    """Page banners. Anyone can read; only admins can upload, reorder or delete."""

    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None
    filterset_fields = ["page"]
