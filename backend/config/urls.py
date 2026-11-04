from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/", include("destinations.urls")),
    path("api/", include("attractions.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("favorites.urls")),
    path("api/", include("itineraries.urls")),
    path("api/", include("expenses.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("contact.urls")),
    path("api/", include("bookings.urls")),
    path("api/", include("assistant.urls")),
]

# Photos are served from disk in development, and in production only when Cloudinary is not
# configured (local disk is wiped on every Render deploy, so use Cloudinary for real uploads).
if settings.DEBUG or not settings.USE_CLOUDINARY:
    urlpatterns += [re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT})]
