from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from config.permissions import EditorWriteAdminDelete, IsEditorOrReadOnly

from .models import Attraction, AttractionImage
from .serializers import AttractionImageSerializer, AttractionSerializer


class AttractionViewSet(viewsets.ModelViewSet):
    queryset = Attraction.objects.select_related("destination").prefetch_related("images")
    serializer_class = AttractionSerializer
    permission_classes = [EditorWriteAdminDelete]
    filterset_fields = ["destination"]
    search_fields = ["name", "description", "destination__name"]


class AttractionImageViewSet(viewsets.ModelViewSet):
    queryset = AttractionImage.objects.all()
    serializer_class = AttractionImageSerializer
    permission_classes = [IsEditorOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None
    filterset_fields = ["attraction"]
