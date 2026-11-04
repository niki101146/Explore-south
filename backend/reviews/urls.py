from rest_framework.routers import SimpleRouter

from .views import ReviewModerationViewSet

router = SimpleRouter()
router.register("reviews", ReviewModerationViewSet, basename="review")

urlpatterns = router.urls
