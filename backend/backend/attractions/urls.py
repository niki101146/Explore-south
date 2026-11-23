from rest_framework.routers import SimpleRouter

from .views import AttractionImageViewSet, AttractionViewSet

router = SimpleRouter()
router.register("attractions", AttractionViewSet, basename="attraction")
router.register("attraction-images", AttractionImageViewSet, basename="attraction-image")

urlpatterns = router.urls
