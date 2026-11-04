from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import ContactAdminViewSet, ContactCreateView

router = SimpleRouter()
router.register("admin-dashboard/messages", ContactAdminViewSet, basename="contact-message")

urlpatterns = [path("contact/", ContactCreateView.as_view(), name="contact")] + router.urls
