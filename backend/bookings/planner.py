"""Builds a ready-made trip plan with costs for a destination.

All amounts are estimates in whole rupees:
  * Accommodation, food and local travel come from the destination's average daily
    budget per person. The default "budget" style assumes a simple room (shared by two),
    local meals and shared transport; "standard" and "comfort" scale those amounts up.
  * Entry fees are the real fees of the attractions that are scheduled.
"""
from datetime import timedelta
from math import ceil

from assistant import season as season_model

MAX_DAYS = 14
MAX_TRAVELERS = 20
MAX_STOPS_PER_DAY = 3
DEFAULT_DAILY_BUDGET = 2000
# Share of the daily budget: stay is per double room per night; food and travel are per person per day.
SHARE_STAY, SHARE_FOOD, SHARE_TRAVEL = 0.40, 0.20, 0.12

STYLES = {
    "budget": {"label": "Budget", "mult": 1.0, "desc": "Simple rooms, local food, shared transport"},
    "standard": {"label": "Standard", "mult": 1.5, "desc": "Comfortable hotels and restaurants"},
    "comfort": {"label": "Comfort", "mult": 2.3, "desc": "Better hotels, private cab"},
}
DEFAULT_STYLE = "budget"


def _round10(x):
    return int(round(x / 10.0)) * 10


def build_plan(destination, start_date, end_date, travelers, style=DEFAULT_STYLE):
    style = style if style in STYLES else DEFAULT_STYLE
    mult = STYLES[style]["mult"]
    days = (end_date - start_date).days + 1
    budget = destination.avg_daily_budget or DEFAULT_DAILY_BUDGET
    rooms = ceil(travelers / 2)  # two people share one room
    stay_per_night = _round10(rooms * budget * SHARE_STAY * mult)
    food_per_day = _round10(travelers * budget * SHARE_FOOD * mult)
    travel_per_day = _round10(travelers * budget * SHARE_TRAVEL * mult)

    attractions = list(destination.attractions.order_by("id"))
    per_day = min(MAX_STOPS_PER_DAY, ceil(len(attractions) / days)) if attractions else 0
    chosen = attractions[: per_day * days]

    plan_days = []
    totals = {"stay": 0, "food": 0, "travel": 0, "entry_fees": 0}
    for n in range(1, days + 1):
        date = start_date + timedelta(days=n - 1)
        items = []

        stops = chosen[(n - 1) * per_day: n * per_day] if per_day else []
        for a in stops:
            fee = int(a.entry_fee or 0)
            items.append({
                "type": "sightseeing", "title": a.name, "detail": a.timings or "",
                "per_person": fee, "amount": fee * travelers,
            })
            totals["entry_fees"] += fee * travelers
        if not stops:
            items.append({
                "type": "leisure", "title": "Free time",
                "detail": "Relax, shop at local markets and try the local food.", "amount": 0,
            })

        items.append({"type": "food", "title": "Meals", "detail": "Breakfast, lunch and dinner", "amount": food_per_day})
        items.append({"type": "travel", "title": "Local travel", "detail": f"Taxi or auto around {destination.name}", "amount": travel_per_day})
        totals["food"] += food_per_day
        totals["travel"] += travel_per_day

        if n < days:  # a night's stay for every day except the last
            items.append({
                "type": "stay", "title": f"Hotel stay (night {n})",
                "detail": f"{rooms} room{'s' if rooms > 1 else ''} for {travelers} traveler{'s' if travelers > 1 else ''}",
                "amount": stay_per_night,
            })
            totals["stay"] += stay_per_night

        if days == 1:
            label = f"Day trip to {destination.name}"
        elif n == 1:
            label = f"Arrive in {destination.name}"
        elif n == days:
            label = "Check out and head home"
        else:
            label = "Explore"
        plan_days.append({
            "day": n, "date": date.isoformat(), "label": label, "items": items,
            "day_total": sum(i["amount"] for i in items),
        })

    total = sum(totals.values())
    season_check = season_model.trip_check(season_model.facts_from(destination), start_date, end_date)
    return {
        "destination": {"id": destination.id, "name": destination.name, "slug": destination.slug},
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "num_days": days,
        "travelers": travelers,
        "style": style,
        "style_label": STYLES[style]["label"],
        "days": plan_days,
        "season": season_check,
        "summary": {
            "accommodation": totals["stay"], "food": totals["food"],
            "local_travel": totals["travel"], "entry_fees": totals["entry_fees"],
            "total": total, "per_person": round(total / travelers),
            "per_person_per_day": round(total / travelers / days),
        },
        "note": f"Estimates for a {STYLES[style]['label'].lower()} trip, based on typical costs for this destination. Real prices vary by season.",
    }
