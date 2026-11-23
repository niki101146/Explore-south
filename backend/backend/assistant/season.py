"""Season prediction: how good is each month for visiting a destination?

This is a transparent, rule-based model (no external service, no training data needed):

  1. Every destination is mapped to a climate profile (west coast, hills, Tamil Nadu plains or
     Deccan interior) holding typical monthly maximum temperature and rainfall.
  2. Each month starts at 100 and loses points for heat/cold outside a comfortable range and for
     rain. How much rain matters depends on the destination type (a beach or hill station suffers
     more than a temple town; a backwater trip hardly minds).
  3. The admin's own "best time to visit" text / best season gives a bonus or small penalty, so
     local knowledge entered in the admin always counts.
  4. Crowd level and a price multiplier are estimated from the month, the type of destination and
     known festivals.

The numbers are typical long-run averages, NOT a live weather forecast.
"""
import re
from calendar import monthrange
from datetime import date, timedelta

SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
FULL = ["January", "February", "March", "April", "May", "June", "July", "August",
        "September", "October", "November", "December"]

# Typical monthly max temperature (deg C) and rainfall (mm), January to December.
PROFILES = {
    "west_coast": {  # Kerala lowlands and backwaters: south-west monsoon, June to September
        "label": "Kerala coast and backwaters",
        "temp": [32, 33, 34, 34, 33, 30, 29, 29, 30, 31, 31, 32],
        "rain": [10, 15, 30, 110, 230, 650, 700, 430, 260, 280, 170, 40],
    },
    "hills": {  # Nilgiris, Palani hills, Munnar: cool all year, wet June to November
        "label": "Western Ghats hills",
        "temp": [22, 24, 26, 26, 25, 22, 21, 21, 22, 22, 21, 21],
        "rain": [15, 25, 50, 130, 170, 150, 170, 170, 150, 210, 150, 50],
    },
    "hills_wet": {  # Kerala and Karnataka ghat hills (Munnar, Coorg): very heavy monsoon
        "label": "Kerala and Karnataka ghat hills",
        "temp": [24, 26, 27, 27, 25, 22, 21, 21, 22, 23, 23, 23],
        "rain": [20, 30, 60, 150, 210, 550, 600, 380, 230, 260, 170, 60],
    },
    "tn_plains": {  # Tamil Nadu plains and Coromandel coast: hot summer, north-east monsoon Oct-Dec
        "label": "Tamil Nadu plains and east coast",
        "temp": [31, 33, 36, 37, 38, 37, 36, 35, 35, 33, 30, 30],
        "rain": [20, 10, 15, 35, 50, 35, 50, 100, 120, 200, 280, 150],
    },
    "deccan": {  # Karnataka, Telangana, Andhra interior: very hot Mar-May, monsoon Jun-Sep
        "label": "Deccan plateau",
        "temp": [30, 33, 36, 38, 38, 32, 30, 29, 30, 30, 29, 28],
        "rain": [5, 8, 12, 25, 35, 100, 150, 150, 160, 110, 35, 8],
    },
}

# How much rain spoils the trip, by destination type (first match in PRIORITY wins).
RAIN_WEIGHT = {"backwater": 0.55, "beach": 1.1, "hill": 1.0, "wildlife": 0.9,
               "heritage": 0.7, "temple": 0.6, "default": 0.8}
PRIORITY = ["backwater", "beach", "hill", "wildlife", "heritage", "temple"]

# General tourist demand by month (1-10) before destination-specific adjustments.
BASE_CROWD = [8, 6, 5, 7, 9, 7, 3, 3, 4, 6, 6, 9]
PRICE_MULT = {1: 0.70, 2: 0.70, 3: 0.75, 4: 0.85, 5: 0.95, 6: 1.00, 7: 1.10, 8: 1.20, 9: 1.30, 10: 1.40}

# Well-known annual events (month: text). Exact dates change every year.
FESTIVALS = {
    "mysuru": {10: "Dasara festival (dates change each year, usually Sep-Oct)"},
    "madurai": {4: "Chithirai festival at Meenakshi Temple (usually Apr-May)"},
    "alleppey": {8: "Nehru Trophy Boat Race (usually August)"},
    "tirupati": {9: "Brahmotsavam festival (usually Sep-Oct)"},
    "hampi": {11: "Hampi Utsav (usually early November; dates vary)"},
}

LABELS = [(75, "Excellent"), (60, "Good"), (40, "Fair"), (0, "Poor")]
SEASON_MONTHS = {"summer": [3, 4, 5, 6], "monsoon": [7, 8, 9], "winter": [10, 11, 12, 1, 2]}


# ---------------------------------------------------------------- helpers
def label_for(score):
    for floor, name in LABELS:
        if score >= floor:
            return name
    return "Poor"


def crowd_label(level):
    if level >= 8:
        return "Very busy"
    if level >= 6:
        return "Busy"
    if level >= 4:
        return "Moderate"
    return "Quiet"


def _round10(x):
    return int(round(x / 10.0)) * 10


_MONTH_WORDS = {}
for _i, (_f, _s) in enumerate(zip(FULL, SHORT), start=1):
    _MONTH_WORDS[_f.lower()] = _i
    _MONTH_WORDS[_s.lower()] = _i
_MONTH_WORDS["sept"] = 9
_MONTH_RE = "|".join(sorted(_MONTH_WORDS, key=len, reverse=True))
_RANGE_RE = re.compile(
    rf"\b({_MONTH_RE})\b(?:\s*(?:to|-|\u2013|until|through)\s*\b({_MONTH_RE})\b)?", re.I
)


def parse_months(text):
    """'March to June, and September to November' -> {3,4,5,6,9,10,11}."""
    found = set()
    for m in _RANGE_RE.finditer(text or ""):
        a = _MONTH_WORDS[m.group(1).lower()]
        if m.group(2):
            b = _MONTH_WORDS[m.group(2).lower()]
            n = a
            while True:
                found.add(n)
                if n == b:
                    break
                n = n % 12 + 1
        else:
            found.add(a)
    return found


def month_ranges(months):
    """[10,11,12,1,2,3] -> 'Oct-Mar'; [3,4,5,9] -> 'Mar-May, Sep'. Handles the Dec/Jan wrap."""
    months = sorted(set(months))
    if not months:
        return ""
    if len(months) == 12:
        return "all year"
    groups, cur = [], [months[0]]
    for m in months[1:]:
        if m == cur[-1] + 1:
            cur.append(m)
        else:
            groups.append(cur)
            cur = [m]
    groups.append(cur)
    if len(groups) > 1 and groups[0][0] == 1 and groups[-1][-1] == 12:
        groups[0] = groups.pop() + groups[0]
    return ", ".join(SHORT[g[0] - 1] if len(g) == 1 else f"{SHORT[g[0] - 1]}-{SHORT[g[-1] - 1]}" for g in groups)


# ---------------------------------------------------------------- destination facts
def facts_from(dest):
    """Plain dict of what the model needs, taken from a Destination instance."""
    return {
        "name": dest.name,
        "state": dest.city.state.name,
        "categories": [c.name.lower() for c in dest.categories.all()],
        "best_season": dest.best_season,
        "best_time": dest.best_time_to_visit or "",
        "budget": dest.avg_daily_budget or 0,
    }


def _kind(categories):
    joined = " ".join(categories)
    for key in PRIORITY:
        if key in joined:
            return key
    return "default"


def pick_profile(facts):
    cats = " ".join(facts["categories"])
    state = facts["state"].lower()
    if "hill" in cats:
        return "hills" if state == "tamil nadu" else "hills_wet"
    if state == "kerala":
        return "west_coast"
    if state == "tamil nadu" or ("beach" in cats and state == "andhra pradesh"):
        return "tn_plains"
    return "deccan"


def _temp_penalty(t, hill):
    lo, hi = (16, 26) if hill else (20, 31)
    if t > hi:
        return min(60, (t - hi) * 7)
    if t < lo:
        return min(40, (lo - t) * 5)
    return 0


def _rain_penalty(mm):
    if mm <= 50:
        return mm * 0.2
    if mm <= 150:
        return 10 + (mm - 50) * 0.2
    if mm <= 300:
        return 30 + (mm - 150) * 0.2
    return min(85, 60 + (mm - 300) * 0.07)


def _admin_months(facts):
    """(months the admin recommends, how strongly we trust that info)."""
    listed = parse_months(facts["best_time"])
    if listed:
        return listed, "text"
    season = facts.get("best_season")
    if season in SEASON_MONTHS:
        return set(SEASON_MONTHS[season]), "season"
    return set(), "none"


def _notes_and_pack(temp, rain, hill, month, festival):
    notes, pack = [], []
    if rain >= 300:
        notes.append("Very heavy rain, with a risk of landslides and disrupted travel")
    elif rain >= 150:
        notes.append("Rainy, so carry a raincoat and keep the plans flexible")
    elif rain >= 60:
        notes.append("Some rain showers")
    else:
        notes.append("Mostly dry")
    if temp >= 36:
        notes.append(f"Very hot (around {temp} deg C), so sightsee early morning or evening")
    elif temp >= 32:
        notes.append(f"Warm (around {temp} deg C)")
    elif not hill:
        notes.append(f"Pleasant (around {temp} deg C)")
    if hill:
        notes.append(f"Cool days (around {temp} deg C)" + (" and cold, misty nights" if month in (12, 1, 2) else ""))
    if festival:
        notes.append(festival)
    if rain >= 100:
        pack += ["Umbrella or raincoat", "Quick-dry clothes", "Waterproof bag"]
    if temp >= 33:
        pack += ["Light cotton clothes", "Sunscreen and cap", "Water bottle"]
    if hill:
        pack += ["Light jacket" if month not in (12, 1, 2) else "Warm jacket"]
    if not pack:
        pack = ["Comfortable walking shoes", "Light layers"]
    return notes, pack


# ---------------------------------------------------------------- the prediction
def month_forecast(facts):
    """Twelve month records for a destination."""
    profile = PROFILES[pick_profile(facts)]
    hill = "hill" in " ".join(facts["categories"])
    kind = _kind(facts["categories"])
    weight = RAIN_WEIGHT[kind]
    admin, source = _admin_months(facts)
    festivals = FESTIVALS.get(facts["name"].lower(), {})
    cats = " ".join(facts["categories"])

    out = []
    for i in range(12):
        m = i + 1
        temp, rain = profile["temp"][i], profile["rain"][i]
        score = 100 - _temp_penalty(temp, hill) - _rain_penalty(rain) * weight
        if source == "text":
            score += 8 if m in admin else -12
        elif source == "season":
            score += 6 if m in admin else -8
        score = int(max(0, min(100, round(score))))

        crowd = BASE_CROWD[i]
        if hill and m in (4, 5, 6):
            crowd += 1
        if ("beach" in cats or "backwater" in cats) and m in (12, 1):
            crowd += 1
        if m in festivals:
            crowd += 2
        if rain >= 300:      # heavy monsoon keeps most visitors away
            crowd -= 3
        elif rain >= 150 and crowd > 6:
            crowd -= 1
        crowd = max(1, min(10, crowd))
        notes, pack = _notes_and_pack(temp, rain, hill, m, festivals.get(m))
        budget = facts["budget"]
        out.append({
            "month": m, "name": SHORT[i], "full_name": FULL[i], "score": score, "label": label_for(score),
            "temp_c": temp, "rain_mm": rain, "crowd": crowd, "crowd_label": crowd_label(crowd),
            "price_factor": PRICE_MULT[crowd],
            "est_daily_budget": _round10(budget * PRICE_MULT[crowd]) if budget else None,
            "notes": notes, "pack": pack,
        })
    return out


def predict(facts):
    """Full season report for one destination."""
    months = month_forecast(facts)
    ranked = sorted(months, key=lambda r: (-r["score"], r["month"]))
    best = sorted(r["month"] for r in ranked[:3])
    good = [r["month"] for r in months if r["score"] >= 70]
    avoid = [r["month"] for r in months if r["score"] < 40]
    admin, source = _admin_months(facts)

    top = ranked[0]
    cheapest_good = min((r for r in months if r["score"] >= 70), key=lambda r: r["price_factor"], default=None)
    parts = []
    if len(good) >= 11:
        parts.append(f"{facts['name']} is pleasant almost all year.")
    elif good:
        parts.append(f"{facts['name']} is at its best in {month_ranges(good)}.")
    else:
        parts.append(f"No month is ideal for {facts['name']}; {top['full_name']} is the best of the year.")
    parts.append(f"The single best month is {top['full_name']} (score {top['score']}/100).")
    if avoid:
        parts.append(f"Avoid {month_ranges(avoid)}: heat or heavy rain make travel hard.")
    if cheapest_good and cheapest_good["month"] != top["month"]:
        parts.append(f"For lower prices and fewer people, {cheapest_good['full_name']} is a good month too.")

    agree = bool(admin & set(best)) if admin else False
    confidence = "High" if agree and source == "text" else "Medium" if admin else "Low"
    return {
        "climate": PROFILES[pick_profile(facts)]["label"],
        "months": months, "best_months": best, "best_text": month_ranges(good) if good else "",
        "avoid_text": month_ranges(avoid), "top_month": top["month"],
        "summary": " ".join(parts), "confidence": confidence,
        "disclaimer": "Based on typical yearly weather patterns, not a live forecast. Check the forecast a few days before you travel.",
    }


def month_detail(facts, month):
    return month_forecast(facts)[month - 1]


def trip_check(facts, start, end):
    """Season check for specific travel dates."""
    months = month_forecast(facts)
    counts, d = {}, start
    while d <= end:
        counts[d.month] = counts.get(d.month, 0) + 1
        d += timedelta(days=1)
    total = sum(counts.values()) or 1
    avg = round(sum(months[m - 1]["score"] * n for m, n in counts.items()) / total)
    worst = min((months[m - 1] for m in counts), key=lambda r: r["score"])
    best_months = predict(facts)["best_months"]
    first = months[start.month - 1]
    if avg >= 75:
        msg = f"Great timing. {first['full_name']} is one of the best times to visit."
    elif avg >= 60:
        msg = "Good timing for a trip."
    elif avg >= 40:
        msg = "An acceptable time, but expect some discomfort (heat or rain). Plan indoor options."
    else:
        msg = "Not a good time to visit. Consider moving your dates."
    warnings = []
    if worst["score"] < 40:
        warnings.append(f"{worst['full_name']}: {worst['notes'][0].lower()}.")
    if first["crowd"] >= 8:
        warnings.append("This is a busy period. Book hotels early; prices can be higher.")
    return {
        "score": avg, "label": label_for(avg), "message": msg, "warnings": warnings,
        "crowd_label": first["crowd_label"], "price_factor": first["price_factor"],
        "better_months": [SHORT[m - 1] for m in best_months] if avg < 60 else [],
    }


def month_for(day=None):
    return (day or date.today()).month


def days_in_month(year, month):
    return monthrange(year, month)[1]
