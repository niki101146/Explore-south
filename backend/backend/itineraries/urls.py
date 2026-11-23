from rest_framework.routers import SimpleRouter

from .views import ItineraryItemViewSet, ItineraryViewSet

router = SimpleRouter()
router.register("itineraries", ItineraryViewSet, basename="itinerary")
router.register("itinerary-items", ItineraryItemViewSet, basename="itinerary-item")

urlpatterns = router.urls
