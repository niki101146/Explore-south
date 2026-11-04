"""AI Trip Matcher: turns a plain-English request into ranked, explained trip predictions.

Example: "4 days in December for a family of 4, hill station, under 3000 a day"

Pipeline (rule-based, no external API or key needed, never invents a place):
  1. Understand: pull month, days, travelers, daily budget, trip type and state out of the text.
  2. Predict: for every published destination, use the season model for that month (weather score,
     crowd level, price multiplier) and estimate the total trip cost.
  3. Rank: match = 55% season fit + 25% budget fit + 20% interest fit (type / state).
  4. Explain: every result carries plain-language reasons and a cheaper-or-better month tip.
"""
from datetime import date

from . import chatbot as cb
from . import season as sx

W_SEASON, W_BUDGET, W_INTEREST = 0.55, 0.25, 0.20


def understand(text, catalog):
    text = " ".join(text.lower().split())[: cb.MAX_MESSAGE]
    months = sorted(cb.find_months(text))
    days = cb.find_days(text)
    travelers = cb.find_travelers(text)
    budget = cb.find_budget(text)
    per_day = None
    if budget:
        # A large figure is read as the whole trip budget, a small one as "per day".
        per_day = budget if budget < 8000 else round(budget / max(1, (days or 3)) / max(1, (travelers or 1)))
    return {
        "months": months or [date.today().month], "month_given": bool(months),
        "days": days or 3, "travelers": travelers or 2, "budget_per_day": per_day,
        "category": cb.find_category(text), "state": cb.find_state(text, catalog),
    }


def _budget_fit(daily, limit):
    if not limit or not daily:
        return 70
    if daily <= limit:
        return 100 - round(25 * (1 - daily / limit))  # well under budget scores a bit lower (maybe too basic)
    return max(0, round(100 - (daily - limit) / limit * 220))


def rank(intent, rows, limit=5):
    """rows: [{'dest': <obj>, 'facts': dict, 'slug': str}] -> list of result dicts (no serializer data)."""
    out = []
    for r in rows:
        facts = r["facts"]
        kinds = " ".join(facts["categories"])
        if intent["state"] and facts["state"] != intent["state"]:
            continue
        month = intent["months"][0]
        forecast = sx.month_forecast(facts)
        # With several months (e.g. "winter") use the average and report the best of them.
        picked = [forecast[m - 1] for m in intent["months"]]
        row = max(picked, key=lambda x: x["score"])
        season_score = round(sum(p["score"] for p in picked) / len(picked))
        daily = row["est_daily_budget"] or facts["budget"]
        budget_score = _budget_fit(daily, intent["budget_per_day"])
        interest = 60
        reasons = []
        if intent["category"]:
            hit = intent["category"].lower().split()[0] in kinds
            interest = 100 if hit else 25
            if hit:
                reasons.append(f"Matches your interest in {intent['category'].lower()}")
        if intent["state"]:
            reasons.append(f"Located in {facts['state']}")
        match = round(W_SEASON * season_score + W_BUDGET * budget_score + W_INTEREST * interest)

        mname = row["full_name"]
        reasons.insert(0, f"{mname} scores {row['score']}/100 for weather: about {row['temp_c']}\u00b0C, {row['rain_mm']} mm rain")
        reasons.append(f"Expected crowds: {row['crowd_label'].lower()}")
        if intent["budget_per_day"] and daily:
            reasons.append("Fits your daily budget" if daily <= intent["budget_per_day"]
                           else f"About \u20b9{daily - intent['budget_per_day']:,} per day over your budget")

        best_good = [m for m in forecast if m["score"] >= 70]
        tip = None
        cheaper = min(best_good, key=lambda m: m["price_factor"], default=None)
        if cheaper and cheaper["month"] not in intent["months"] and cheaper["price_factor"] < row["price_factor"]:
            saving = round((1 - cheaper["price_factor"] / row["price_factor"]) * 100)
            if saving >= 8:
                tip = f"Going in {cheaper['full_name']} could cost about {saving}% less with good weather."
        elif not best_good:
            tip = f"No month is ideal here; {max(forecast, key=lambda m: m['score'])['full_name']} is the best of the year."

        cost = cb.estimate_cost(daily, intent["days"], intent["travelers"]) if daily else {}
        out.append({
            "slug": r["slug"], "match": match, "season_score": row["score"], "season_label": row["label"],
            "month_name": mname, "temp_c": row["temp_c"], "rain_mm": row["rain_mm"], "crowd_label": row["crowd_label"],
            "daily_budget": daily, "total_low": min(cost.values()) if cost else None,
            "total_high": max(cost.values()) if cost else None, "reasons": reasons[:4], "tip": tip,
            "confidence": "High" if match >= 80 else "Medium" if match >= 60 else "Low",
        })
    out.sort(key=lambda x: (-x["match"], x["slug"]))
    return out[:limit]
