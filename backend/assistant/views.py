from datetime import date

from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from destinations.models import Category, Destination
from destinations.serializers import DestinationListSerializer
from reviews.models import Review

from . import chatbot, season, trip_ai


class ScopedAPIView(APIView):
    """Public endpoint rate-limited by `throttle_scope` (rates are in settings.py)."""

    throttle_classes = [ScopedRateThrottle]


def published_destinations():
    """Published destinations with the same rating annotations the destination list uses."""
    approved = Q(reviews__status=Review.Status.APPROVED)
    return (
        Destination.objects.filter(is_published=True)
        .select_related("city__state")
        .prefetch_related("categories", "attractions")
        .annotate(avg_rating=Avg("reviews__rating", filter=approved),
                  review_count=Count("reviews", filter=approved, distinct=True))
    )


def _month_param(request, default=None):
    raw = request.query_params.get("month")
    if not raw:
        return default or date.today().month
    try:
        m = int(raw)
    except ValueError:
        m = {n.lower(): i for i, n in enumerate(season.SHORT, start=1)}.get(raw[:3].lower())
    if not m or not 1 <= m <= 12:
        raise ValueError("month must be 1-12 or a month name")
    return m


class SeasonPredictView(ScopedAPIView):
    """GET /api/season/predict/?destination=<slug>  ->  month-by-month prediction."""

    throttle_scope = "season"

    def get(self, request):
        slug = request.query_params.get("destination")
        if not slug:
            return Response({"detail": "destination (slug) is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            dest = published_destinations().get(slug=slug)
        except Destination.DoesNotExist:
            return Response({"detail": "Destination not found."}, status=status.HTTP_404_NOT_FOUND)
        data = season.predict(season.facts_from(dest))
        data["destination"] = {"id": dest.id, "name": dest.name, "slug": dest.slug}
        data["current_month"] = date.today().month
        return Response(data)


class SeasonRecommendView(ScopedAPIView):
    """GET /api/season/recommend/?month=&category=&state=&max_budget=  ->  ranked destinations."""

    throttle_scope = "season"

    def get(self, request):
        try:
            month = _month_param(request)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        category = request.query_params.get("category", "").strip()
        state = request.query_params.get("state", "").strip()
        try:
            max_budget = int(request.query_params.get("max_budget") or 0)
        except ValueError:
            return Response({"detail": "max_budget must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        qs = published_destinations()
        if category:
            qs = qs.filter(categories__slug=category)
        if state:
            qs = qs.filter(city__state__slug=state)
        results = []
        for dest in qs.distinct():
            if max_budget and dest.avg_daily_budget and dest.avg_daily_budget > max_budget:
                continue
            row = season.month_detail(season.facts_from(dest), month)
            results.append({
                "score": row["score"], "label": row["label"], "temp_c": row["temp_c"], "rain_mm": row["rain_mm"],
                "crowd_label": row["crowd_label"], "est_daily_budget": row["est_daily_budget"],
                "note": row["notes"][0], "destination": DestinationListSerializer(dest, context={"request": request}).data,
            })
        results.sort(key=lambda r: (-r["score"], r["destination"]["name"]))
        return Response({"month": month, "month_name": season.FULL[month - 1], "results": results})


class SeasonOverviewView(ScopedAPIView):
    """GET /api/season/overview/  ->  every destination's 12 monthly scores (for the year-at-a-glance map)."""

    throttle_scope = "season"

    def get(self, request):
        rows = []
        for dest in published_destinations():
            months = season.month_forecast(season.facts_from(dest))
            rows.append({"id": dest.id, "name": dest.name, "slug": dest.slug, "state": dest.city.state.name,
                         "scores": [m["score"] for m in months]})
        rows.sort(key=lambda r: r["name"])
        return Response({"months": season.SHORT, "destinations": rows})


class SeasonTripCheckView(ScopedAPIView):
    """GET /api/season/trip-check/?destination=<slug>&start=YYYY-MM-DD&end=YYYY-MM-DD"""

    throttle_scope = "season"

    def get(self, request):
        try:
            start = date.fromisoformat(request.query_params.get("start", ""))
            end = date.fromisoformat(request.query_params.get("end", ""))
        except ValueError:
            return Response({"detail": "start and end must be dates like 2026-12-20."}, status=status.HTTP_400_BAD_REQUEST)
        if end < start or (end - start).days > 60:
            return Response({"detail": "end must be on or after start, within 60 days."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            dest = published_destinations().get(slug=request.query_params.get("destination", ""))
        except Destination.DoesNotExist:
            return Response({"detail": "Destination not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(season.trip_check(season.facts_from(dest), start, end))


def build_catalog(request):
    """Snapshot of the published destinations as plain dicts for the chatbot."""
    catalog = []
    for d in published_destinations():
        cover = request.build_absolute_uri(d.cover_image.url) if d.cover_image else None
        facts = season.facts_from(d)
        catalog.append({
            "id": d.id, "slug": d.slug, "name": d.name, "city": d.city.name, "state": d.city.state.name,
            "categories": facts["categories"], "cover": cover, "budget": d.avg_daily_budget or 0,
            "short": d.short_description, "featured": d.is_featured, "best_season": d.best_season,
            "best_time": d.best_time_to_visit or "", "how_to_reach": d.how_to_reach, "tips": d.travel_tips,
            "attractions": [{"name": a.name, "fee": int(a.entry_fee or 0), "timings": a.timings or ""}
                            for a in d.attractions.all()],
        })
    return catalog


class ChatView(ScopedAPIView):
    """POST /api/chat/  {"message": "...", "context": {"destination": "ooty"}}"""

    throttle_scope = "chat"

    def post(self, request):
        message = request.data.get("message", "")
        if not isinstance(message, str) or not message.strip():
            return Response({"detail": "Please type a message."}, status=status.HTTP_400_BAD_REQUEST)
        context = request.data.get("context")
        if not isinstance(context, dict):
            context = {}
        context = {"destination": str(context.get("destination", ""))[:170]} if context.get("destination") else {}
        return Response(chatbot.reply(message, context, build_catalog(request)))


class TripMatchView(ScopedAPIView):
    """POST /api/ai/trip-match/  {"query": "4 days in December, family of 4, hill station, under 3000"}"""

    throttle_scope = "chat"

    def post(self, request):
        query = request.data.get("query", "")
        if not isinstance(query, str) or len(query.strip()) < 3:
            return Response({"detail": "Tell us a little about your trip."}, status=status.HTTP_400_BAD_REQUEST)
        dests = {d.slug: d for d in published_destinations()}
        catalog = [{"state": d.city.state.name} for d in dests.values()]
        intent = trip_ai.understand(query, catalog)
        rows = [{"slug": s, "facts": season.facts_from(d)} for s, d in dests.items()]
        results = trip_ai.rank(intent, rows)
        for r in results:
            r["destination"] = DestinationListSerializer(dests[r["slug"]], context={"request": request}).data
        intent["month_names"] = [season.FULL[m - 1] for m in intent["months"]]
        return Response({"understood": intent, "results": results,
                         "disclaimer": "Predictions use typical yearly weather, crowd and price patterns, not live data."})
