import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from rest_framework import mixins, status, viewsets
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from config.permissions import IsAdminRole

from .models import ContactMessage
from .serializers import ContactAdminSerializer, ContactSerializer

logger = logging.getLogger(__name__)


def notify_owner(msg):
    """Email the site owner. Never raises: the message is already saved in the database."""
    receiver = settings.CONTACT_RECEIVER_EMAIL
    if not receiver:
        return False
    try:
        from bookings.emails import contact_html

        mail = EmailMultiAlternatives(
            subject=f"New message from {msg.name} via ExploreSouth",
            body=f"From: {msg.name} <{msg.email}>\n\n{msg.message}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[receiver],
            reply_to=[msg.email],
        )
        mail.attach_alternative(contact_html(msg), "text/html")
        mail.send(fail_silently=False)
        return True
    except Exception:
        logger.exception("Could not email contact message %s", msg.pk)
        return False


class ContactCreateView(CreateAPIView):
    """Public endpoint used by the Contact us page."""

    serializer_class = ContactSerializer
    permission_classes = []
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data.get("website"):  # honeypot filled in: pretend success, store nothing
            return Response({"detail": "Thanks! Your message has been sent."}, status=status.HTTP_201_CREATED)
        msg = ContactMessage.objects.create(
            name=data["name"], email=data["email"], message=data["message"]
        )
        notify_owner(msg)
        return Response({"detail": "Thanks! Your message has been sent."}, status=status.HTTP_201_CREATED)


class ContactAdminViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Admin-only inbox: list messages, mark read/unread, delete."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactAdminSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ["is_read"]
    search_fields = ["name", "email", "message"]
