from rest_framework.routers import SimpleRouter

from .views import BookingAdminViewSet, BookingViewSet

router = SimpleRouter()
router.register("bookings", BookingViewSet, basename="booking")
router.register("admin-dashboard/bookings", BookingAdminViewSet, basename="admin-booking")

urlpatterns = router.urls
