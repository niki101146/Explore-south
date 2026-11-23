from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AdminStatsView, AdminUserViewSet

router = SimpleRouter()
router.register("admin-dashboard/users", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("admin-dashboard/stats/", AdminStatsView.as_view(), name="admin-stats"),
] + router.urls
