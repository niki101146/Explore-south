from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from config.permissions import IsAdminRole

from .emails import send_booking_emails
from .models import Booking
from .planner import build_plan
from .serializers import BookingAdminSerializer, BookingInputSerializer, BookingSerializer


class BookingViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """A traveller's own bookings: preview a plan, confirm it, list, view, cancel."""

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "booking"

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related("destination")

    def get_throttles(self):
        # Only confirming (which sends email) is rate limited.
        return [ScopedRateThrottle()] if self.action == "create" else []

    def _plan_from(self, request):
        ser = BookingInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        plan = build_plan(d["destination"], d["start_date"], d["end_date"], d["num_travelers"], d["style"])
        return d, plan

    @action(detail=False, methods=["post"])
    def preview(self, request):
        """Return the full plan and its cost, without saving anything."""
        _, plan = self._plan_from(request)
        return Response(plan)

    def create(self, request):
        """Confirm the booking: save it and email the confirmation."""
        d, plan = self._plan_from(request)
        email = d.get("email") or request.user.email
        if not email:
            raise serializers.ValidationError({"email": "Please enter an email address for the confirmation."})
        booking = Booking.objects.create(
            user=request.user, destination=d["destination"], destination_name=d["destination"].name,
            start_date=d["start_date"], end_date=d["end_date"], num_travelers=d["num_travelers"],
            total_amount=plan["summary"]["total"], plan=plan, email=email,
        )
        email_sent = send_booking_emails(booking)
        data = BookingSerializer(booking).data
        data["email_sent"] = email_sent
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)


class BookingAdminViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Admin-only list of every booking."""

    queryset = Booking.objects.select_related("user", "destination")
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ["status"]
    search_fields = ["reference", "email", "destination_name", "user__username"]
