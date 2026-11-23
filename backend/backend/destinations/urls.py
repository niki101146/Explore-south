from rest_framework.routers import SimpleRouter

from .views import (
    BannerViewSet,
    CategoryViewSet,
    CityViewSet,
    DestinationImageViewSet,
    DestinationViewSet,
    StateViewSet,
)

router = SimpleRouter()
router.register("states", StateViewSet, basename="state")
router.register("cities", CityViewSet, basename="city")
router.register("categories", CategoryViewSet, basename="category")
router.register("banners", BannerViewSet, basename="banner")
router.register("destinations", DestinationViewSet, basename="destination")
router.register("destination-images", DestinationImageViewSet, basename="destination-image")

urlpatterns = router.urls
