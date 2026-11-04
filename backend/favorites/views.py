from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            "destination__city__state"
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user, destination=serializer.validated_data["destination"]
        )
        data = self.get_serializer(favorite).data
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
