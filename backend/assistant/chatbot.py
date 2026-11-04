"""ExploreSouth travel assistant.

A rule-based chatbot that answers from the website's OWN data (destinations, attractions, budgets)
and the season predictor. It needs no API key and never invents places: every destination, fee and
timing it mentions comes from the database. Questions it cannot answer get an honest "I don't know"
with suggestions instead of a guess.

reply(message, context, catalog) -> dict(reply, destinations, suggestions, links, context, intent)

`catalog` is a list of plain dicts (see views.build_catalog) so this module has no Django imports.
"""
import re
from datetime import date
from difflib import get_close_matches
from math import ceil

from bookings.planner import DEFAULT_DAILY_BUDGET, SHARE_FOOD, SHARE_STAY, SHARE_TRAVEL, STYLES

from . import season as sx

MAX_MESSAGE = 500
ALIASES = {
    "udhagamandalam": "ooty", "ootacamund": "ooty", "mysore": "mysuru", "alappuzha": "alleppey",
    "alleppy": "alleppey", "kodai": "kodaikanal", "kodaikkanal": "kodaikanal", "madurei": "madurai",
    "hyd": "hyderabad", "tirumala": "tirupati", "munar": "munnar",
}
CATEGORY_WORDS = {
    "hill station": ["hill", "hills", "mountain", "cool place", "cold place", "misty"],
    "beach": ["beach", "beaches", "sea", "coast", "coastal"],
    "temple": ["temple", "temples", "pilgrimage", "spiritual", "religious"],
    "heritage": ["heritage", "history", "historic", "historical", "palace", "fort", "ruins", "culture"],
    "wildlife": ["wildlife", "safari", "forest", "jungle", "national park", "animals", "nature"],
    "backwaters": ["backwater", "backwaters", "houseboat", "boat"],
}
CATEGORY_PLURAL = {"hill station": "hill stations", "beach": "beaches", "temple": "temples",
                   "heritage": "heritage places", "wildlife": "wildlife spots", "backwaters": "backwater spots"}
WORD_RE = re.compile(r"[a-z]+")
# Words that must never be "corrected" into a destination name.
COMMON_WORDS = set(sx._MONTH_WORDS) | {
    "places", "place", "under", "below", "about", "again", "weather", "season", "summer", "winter",
    "monsoon", "budget", "temple", "temples", "beach", "beaches", "heritage", "wildlife", "family",
    "holiday", "holidays", "weekend", "cheap", "cheapest", "things", "where", "which", "should",
    "recommend", "suggest", "travel", "travelling", "traveling", "people", "persons", "hills",
    "station", "stations", "backwater", "backwaters", "raining", "rains", "crowd", "crowded",
}


# ---------------------------------------------------------------- understanding the message
def _has(text, *words):
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)


def find_destination(text, catalog):
    """Best matching destination in the text (handles typos, city names and a few aliases)."""
    names = {}
    for d in catalog:
        names[d["name"].lower()] = d
        names.setdefault(d["city"].lower(), d)
    for alias, target in ALIASES.items():
        if target in names:
            names.setdefault(alias, names[target])
    hits = [n for n in names if re.search(rf"\b{re.escape(n)}\b", text)]
    if hits:
        return names[max(hits, key=len)]
    words = WORD_RE.findall(text)
    for w in sorted(words, key=len, reverse=True):
        if len(w) < 5 or w in COMMON_WORDS:
            continue
        close = get_close_matches(w, list(names), n=1, cutoff=0.85)
        if close:
            return names[close[0]]
    return None


def find_months(text):
    """Set of month numbers mentioned (names, 'next month', or a season word)."""
    months = set()
    for m in re.finditer(r"\b(" + sx._MONTH_RE + r")\b", text):
        word = m.group(1)
        if word == "may" and not re.search(r"\b(in|during|for|of|this|next|by)\s+may\b|\bmay\s+(month|holidays?)\b", text):
            continue  # "may" the verb
        months.add(sx._MONTH_WORDS[word])
    today = date.today()
    if "next month" in text:
        months.add(today.month % 12 + 1)
    if "this month" in text or "right now" in text:
        months.add(today.month)
    for name, nums in sx.SEASON_MONTHS.items():
        if re.search(rf"\b{name}\b", text) or (name == "winter" and "cold season" in text):
            months.update(nums)
    if re.search(r"\bsummer holidays?\b|\bsummer vacation\b", text):
        months = {4, 5}
    if re.search(r"\bchristmas\b|\bnew year\b|\bdecember holidays?\b", text):
        months = {12}
    if "pongal" in text:
        months = {1}
    if "diwali" in text or "dussehra" in text or "dasara" in text:
        months = {10, 11}
    return months


def find_category(text):
    for cat, words in CATEGORY_WORDS.items():
        if _has(text, *words):
            return cat
    return None


def find_state(text, catalog):
    for s in {d["state"] for d in catalog}:
        if re.search(rf"\b{re.escape(s.lower())}\b", text):
            return s
    if re.search(r"\b(tn|tamilnadu)\b", text):
        return "Tamil Nadu"
    return None


def find_budget(text):
    m = re.search(r"(?:under|below|less than|within|upto|up to|max(?:imum)?|budget of)\s*(?:rs\.?|inr|\u20b9)?\s*([\d,]+)\s*(k)?", text)
    if not m:
        m = re.search(r"(?:rs\.?|inr|\u20b9)\s*([\d,]+)\s*(k)?", text)
    if not m:
        return None
    n = int(m.group(1).replace(",", "") or 0)
    return n * 1000 if m.group(2) else n


def find_days(text):
    m = re.search(r"(\d+)\s*(?:-|\s)?\s*(?:days?|nights?|d\b)", text)
    if m:
        return max(1, min(14, int(m.group(1))))
    if "weekend" in text:
        return 2
    if re.search(r"\b(a|one)\s+week\b", text):
        return 7
    return None


def find_travelers(text):
    m = re.search(r"(\d+)\s*(?:people|persons?|travell?ers|adults|members|of us|pax)", text)
    if m:
        return max(1, min(20, int(m.group(1))))
    m = re.search(r"for\s+(\d+)\b(?!\s*(?:days?|nights?))", text)
    if m:
        return max(1, min(20, int(m.group(1))))
    if re.search(r"\b(couple|honeymoon)\b", text):
        return 2
    if re.search(r"\b(solo|alone|myself)\b", text):
        return 1
    if "family" in text:
        return 4
    return None


# ---------------------------------------------------------------- building answers
def _inr(n):
    return "\u20b9" + f"{int(n):,}"


def _card(d, extra=None):
    card = {"name": d["name"], "slug": d["slug"], "city": d["city"], "state": d["state"],
            "cover_image": d["cover"], "categories": d["categories"], "budget": d["budget"]}
    if extra:
        card.update(extra)
    return card


def _facts(d):
    return {"name": d["name"], "state": d["state"], "categories": d["categories"],
            "best_season": d["best_season"], "best_time": d["best_time"], "budget": d["budget"]}


def _out(reply, intent, ctx, cards=None, suggestions=None, links=None):
    return {"reply": reply, "intent": intent, "destinations": cards or [], "suggestions": suggestions or [],
            "links": links or [], "context": ctx}


def _name_list(catalog, n=4):
    featured = [d for d in catalog if d.get("featured")] or catalog
    return [d["name"] for d in featured[:n]]


def _default_suggestions(catalog):
    s = ["Where should I go this month?", "Best beaches", "Budget for 3 days"]
    names = _name_list(catalog, 1)
    if names:
        s.insert(0, f"Best time to visit {names[0]}")
    return s


def recommend(catalog, month, category=None, state=None, max_budget=None, limit=4):
    """Rank destinations for a month. Returns list of (score, forecast_row, destination)."""
    rows = []
    for d in catalog:
        if category and not any(category.split()[0] in c for c in d["categories"]):
            continue
        if state and d["state"].lower() != state.lower():
            continue
        row = sx.month_detail(_facts(d), month)
        est = row["est_daily_budget"] or d["budget"]
        if max_budget and est and est > max_budget:
            continue
        rows.append((row["score"], row, d))
    rows.sort(key=lambda t: (-t[0], t[2]["name"]))
    return rows[:limit]


def _answer_season_destination(d, months, ctx):
    pred = sx.predict(_facts(d))
    if months and len(months) <= 2:
        m = sorted(months)[0]
        row = pred["months"][m - 1]
        lines = [
            f"**{d['name']} in {row['full_name']}: {row['label']} ({row['score']}/100)**",
            f"Around {row['temp_c']} deg C with about {row['rain_mm']} mm of rain. Crowds: {row['crowd_label'].lower()}.",
        ]
        if row["est_daily_budget"]:
            lines.append(f"Expect roughly {_inr(row['est_daily_budget'])} per person per day in this month.")
        lines.append(row["notes"][0] + ".")
        if row["score"] < 60:
            lines.append(f"Better months: {', '.join(sx.SHORT[x - 1] for x in pred['best_months'])}.")
        lines.append("Pack: " + ", ".join(row["pack"][:3]).lower() + ".")
        sug = [f"Best time to visit {d['name']}", f"Budget for {d['name']}", f"Things to do in {d['name']}"]
        return _out("\n".join(lines), "season", ctx, [_card(d, {"score": row["score"], "label": row["label"]})], sug,
                    [{"label": "See the full season chart", "to": f"/destinations/{d['slug']}"}])
    text = (f"**Best time to visit {d['name']}**\n{pred['summary']}\n"
            f"Climate type: {pred['climate'].lower()}. Prediction confidence: {pred['confidence'].lower()}.\n"
            "This is based on typical yearly weather, not a live forecast.")
    sug = [f"{d['name']} in {sx.FULL[pred['top_month'] - 1]}", f"Budget for {d['name']}", f"Plan a trip to {d['name']}"]
    return _out(text, "season", ctx, [_card(d)], sug,
                [{"label": "Open the season planner", "to": f"/season?destination={d['slug']}"}])


def _answer_recommend(catalog, months, category, state, max_budget, text_ctx):
    if not months:
        months = {date.today().month}
    month = sorted(months)[0] if len(months) < 6 else None
    month_set = sorted(months)
    # for a whole season, average the months
    scored = []
    for d in catalog:
        if category and not any(category.split()[0] in c for c in d["categories"]):
            continue
        if state and d["state"].lower() != state.lower():
            continue
        rows = [sx.month_detail(_facts(d), m) for m in month_set]
        avg = round(sum(r["score"] for r in rows) / len(rows))
        if max_budget and d["budget"] and d["budget"] > max_budget:
            continue
        scored.append((avg, rows[0], d))
    scored.sort(key=lambda t: (-t[0], t[2]["name"]))
    top = scored[:4]
    when = sx.FULL[month_set[0] - 1] if len(month_set) == 1 else sx.month_ranges(month_set)
    parts = [CATEGORY_PLURAL.get(category) if category else None,
             f"in {state}" if state else None, f"under {_inr(max_budget)} a day" if max_budget else None]
    desc = (" ".join(x for x in parts if x) + " ") if any(parts) else ""
    if not top:
        return _out(f"I could not find {desc or "places "}that fit for {when}. Try a higher budget or a different month.",
                    "recommend", {}, suggestions=_default_suggestions(catalog))
    lines = [f"Top picks for {desc}in {when}:" if desc else f"Top picks for travel in {when}:"]
    for score, row, d in top:
        est = row["est_daily_budget"]
        if est and d["budget"] and abs(est - d["budget"]) >= 100:
            extra = f", usually {_inr(d['budget'])}/day, about {_inr(est)} in this period"
        elif est:
            extra = f", about {_inr(est)}/day"
        else:
            extra = ""
        lines.append(f"- **{d['name']}** ({d['state']}): {sx.label_for(score)}, {score}/100{extra}")
    if top[0][0] < 60:
        lines.append("Heads up: this is not a great month for this kind of trip, so consider another month.")
    cards = [_card(d, {"score": s, "label": sx.label_for(s)}) for s, _, d in top]
    return _out("\n".join(lines), "recommend", {}, cards,
                [f"Best time to visit {top[0][2]['name']}", f"Budget for {top[0][2]['name']}", "Where should I go in December?"])


def estimate_cost(budget, days, travelers):
    """Same formulas as the trip planner (bookings/planner.py), without entry fees."""
    budget = budget or DEFAULT_DAILY_BUDGET
    rooms = ceil(travelers / 2)
    out = {}
    for key, st in STYLES.items():
        mult = st["mult"]
        stay = sx._round10(rooms * budget * SHARE_STAY * mult) * max(0, days - 1)
        food = sx._round10(travelers * budget * SHARE_FOOD * mult) * days
        trav = sx._round10(travelers * budget * SHARE_TRAVEL * mult) * days
        out[key] = stay + food + trav
    return out


def _answer_cost(d, days, travelers, month, ctx):
    days = days or 3
    travelers = travelers or 2
    est = estimate_cost(d["budget"], days, travelers)
    fees = sum(a["fee"] for a in d["attractions"][: 3 * days])
    lines = [f"**{d['name']}: estimated cost for {travelers} traveler{'s' if travelers > 1 else ''}, {days} day{'s' if days > 1 else ''}**"]
    for key, st in STYLES.items():
        lines.append(f"- {st['label']}: about {_inr(est[key])} ({_inr(round(est[key] / travelers))} per person)")
    if fees:
        lines.append(f"Add about {_inr(fees * travelers)} for attraction entry fees.")
    if month:
        row = sx.month_detail(_facts(d), month)
        diff = round((row["price_factor"] - 1) * 100)
        if diff >= 10:
            lines.append(f"{row['full_name']} is a busy time, so hotels may cost around {diff}% more.")
        elif diff <= -10:
            lines.append(f"{row['full_name']} is a quieter time, so you may find hotel deals around {abs(diff)}% cheaper.")
    lines.append("These are estimates; actual prices vary.")
    return _out("\n".join(lines), "cost", ctx, [_card(d)], [f"Plan a trip to {d['name']}", f"Best time to visit {d['name']}"],
                [{"label": "Build a day-by-day plan", "to": f"/trips/new?destination={d['id']}"}])


def _answer_attractions(d, ctx):
    if not d["attractions"]:
        return _out(f"I don't have attractions listed for {d['name']} yet.", "attractions", ctx, [_card(d)])
    lines = [f"**Things to do in {d['name']}**"]
    for a in d["attractions"][:6]:
        fee = "free" if a["fee"] <= 0 else f"{_inr(a['fee'])} entry"
        t = f", {a['timings']}" if a["timings"] else ""
        lines.append(f"- {a['name']} ({fee}{t})")
    lines.append("Fees and timings can change, so check before you go.")
    return _out("\n".join(lines), "attractions", ctx, [_card(d)], [f"Best time to visit {d['name']}", f"Budget for {d['name']}"])


def _answer_text_field(d, field, title, empty, ctx):
    body = (d.get(field) or "").strip()
    if not body:
        return _out(empty.format(name=d["name"]), field, ctx, [_card(d)])
    return _out(f"**{title} {d['name']}**\n{body}", field, ctx, [_card(d)], [f"Best time to visit {d['name']}", f"Budget for {d['name']}"])


def _overview(d, ctx):
    cats = ", ".join(c.title() for c in d["categories"]) or "destination"
    text = f"**{d['name']}** ({d['city']}, {d['state']}), {cats}.\n{d['short']}".strip()
    if d["budget"]:
        text += f"\nAbout {_inr(d['budget'])} per person per day."
    return _out(text, "overview", ctx, [_card(d)],
                [f"Best time to visit {d['name']}", f"Things to do in {d['name']}", f"Budget for {d['name']}",
                 f"How to reach {d['name']}"])


# ---------------------------------------------------------------- entry point
# ---------------------------------------------------------------- small talk
_GREET = r"(?:(?:hi+|hello|hey|hola|namaste|vanakkam)[ ,!.]*)?"
SMALL_TALK = [
    (rf"{_GREET}(how are (you|u)|how r (you|u)|how do you do|how'?s it going|how is it going|hows it going|how are things|you ok(ay)?)\??[ !.]*",
     "how", "I'm doing great, thanks for asking! Ready to help you plan a South India trip. Where are you dreaming of going?"),
    (rf"{_GREET}(what'?s up|whats up|sup|wassup|what are you doing)\??[ !.]*",
     "how", "Just here helping travelers find the best time, place and budget for their trips. What can I find for you?"),
    (r"(who are you|what are you|what is your name|what'?s your name|whats your name|your name|are you (a )?(bot|ai|robot|human|real)|tell me about yourself|introduce yourself)\??[ !.]*",
     "about", "I'm the ExploreSouth assistant, a travel helper for Tamil Nadu, Kerala, Karnataka, Andhra Pradesh and Telangana. "
              "I answer from this website's own data, so I never make up places, fees or timings."),
    (r"(good night|gn|sweet dreams|see you|see ya|take care|talk to you later|ttyl)[ !.]*",
     "bye", "Good night! Sleep well, and come back whenever you want to plan your next trip."),
    (r"(i'?m|i am|im) (fine|good|great|okay|ok|well|happy|doing well)[ !.]*",
     "mood", "Glad to hear it! Want to find a nice place to visit?"),
    (r"(i'?m|i am|im) (bored|sad|tired|stressed|lonely)[ !.]*",
     "mood", "Sorry you're feeling that way. A little trip planning can help. Want me to suggest a calm hill station or a quiet beach?"),
    (r"(i love you|love you|you are (great|awesome|amazing|nice|smart|good|the best)|you'?re (great|awesome|amazing|nice|smart|good|the best)|well done|good job)[ !.]*",
     "kind", "That's very kind, thank you! Let me know where you'd like to go next."),
    (r"(sorry|my bad|oops|no problem|never ?mind|nvm)[ !.]*",
     "ok", "No problem at all! What would you like to know about your trip?"),
    (r"(lol|haha+|hehe+|lmao|\U0001F602|\U0001F604|\U0001F60A)+[ !.]*",
     "ok", "Glad that made you smile! Want to plan something fun?"),
    (r"(good )?(morning|mrng|gm)[ !.]*",
     "greet", "Good morning! Hope your day is starting well. Planning a trip, or just browsing for ideas?"),
    (r"(good )?(afternoon|ga)[ !.]*",
     "greet", "Good afternoon! What can I help you plan today?"),
    (r"(good )?(evening|ge)[ !.]*",
     "greet", "Good evening! Thinking about a weekend getaway? Tell me where, or I can suggest a few places."),
    (rf"{_GREET}(are you (free|there|awake|online|busy)|you there|anybody there|hello\?+)\??[ !.]*",
     "how", "Always here! Ask me anything about South India trips."),
    (r"(where are you from|where do you live|where do you stay|where are you)\??[ !.]*",
     "about", "I live right here on the ExploreSouth website, and the person who built me is from Kanyakumari. I know South India well, though!"),
    (r"(do you|can you) (speak|know|understand|talk) (in )?(tamil|hindi|malayalam|kannada|telugu|english)\??[ !.]*",
     "lang", "I chat best in English, but I understand place names in every South Indian language. Vanakkam! Namaskara! Namaskaram!"),
    (r"(what is|what'?s|whats) your (age|birthday)|how old are you\??[ !.]*",
     "about", "I'm a young bot, always learning new places. Age is just a number of destinations to me!"),
    (r"(do you|can you) (travel|go on trips|eat|sleep)\??[ !.]*",
     "about", "I wish! I'm just a bot, so I travel through data. You do the real travelling and I'll do the planning."),
    (r"(what is your|what'?s your|whats your|your) (favou?rite|fav) (place|destination|spot)\??[ !.]*",
     "fav", None),
    (r"(i (want|wanna|need) to (relax|chill|rest|unwind|escape|get away)|i need a (break|holiday|vacation|getaway)|need a break)[ !.]*",
     "mood", "A break sounds perfect! Do you feel more like misty hills, a quiet beach, or houseboats on the backwaters? Tell me and I'll find the best spots."),
    (r"(i'?m|i am|im) (hungry|thirsty)[ !.]*",
     "mood", "Food is half the fun of South India! I don't have restaurant data, but I can suggest places with great local trips. Want ideas?"),
    (r"(you are|you'?re|ur) (wrong|useless|bad|stupid|dumb|silly)[ !.]*",
     "kind", "Sorry about that! I'm still learning. Try asking in a simpler way, like \"Best time to visit Munnar\", or use the Contact page to reach the team."),
    (r"(what|which) (can|do) you (do|know)[ ?!.]*|what are your (features|skills|abilities)[ ?!.]*",
     "help", "I can tell you the best time to visit a place, suggest where to go in any month, estimate trip costs and list things to do. Just ask like you'd ask a friend!"),
    (r"(ok+|okay|k|fine|hmm+|hm+|oh|oh ok|i see|alright|sure|yes|yeah|yep|no|nope)[ !.]*",
     "ack", "Cool! Tell me a place, a month or a budget and I'll take it from there."),
    (r"(wow|nice|awesome|amazing|super|superb|excellent|wonderful|great)[ !.]*",
     "kind", "Glad you like it! Want me to find your next trip?"),
    (r"(tell me a )?(joke|something funny|make me laugh)[ !.]*",
     "joke", None),
    (r"(what time is it|what is the time|what'?s the date|what day is it|today'?s date)\??[ !.]*",
     "time", "I can't see a clock, but I can tell you what's best to visit this month. Want ideas?"),
]
DEVELOPER = "Shoba Niki J"
DEVELOPER_REPLY = (f"I was developed by **{DEVELOPER}**, a full-stack developer from Kanyakumari. "
                   "Pretty proud of that, honestly. Now, where shall we travel?")
DEVELOPER_RE = re.compile(
    r"\b(who|whom|whose)\b.*\b(develop\w*|creat\w*|made|make|built|build|program\w*|design\w*|code[ds]?|own\w*|train\w*|behind|invent\w*)\b"
    r"|\b(your|ur)\s+(developer|creator|maker|owner|author|programmer|designer|builder)\b"
    r"|\bwho\s+is\s+(the\s+)?(developer|creator|owner)\b"
    r"|\bdeveloped by\b|\bcreated by\b|\bmade by\b|\bbuilt by\b")
DEVELOPER_FOLLOW = {
    r"(where|which (city|place|town)).*(developer|creator|he|she|niki|shoba).*(from|live|stay)|(developer|creator|niki|shoba).*(from|live|stay)":
        f"{DEVELOPER} is from Kanyakumari, the southern tip of India where three seas meet. Sunrise and sunset there are worth the trip!",
}
JOKES = [
    "Why did the traveler bring a ladder to Munnar? Because the tea hills were looking up!",
    "I told my suitcase we were going to Goa. It said it was already packed with feelings.",
    "Why don't mountains get cold in Ooty? They wear a lot of snow caps... and a lot of mist!",
]


def _small_talk(text, catalog, context):
    if len(text.split()) > 9:
        return None
    for pattern, intent, answer in SMALL_TALK:
        if re.fullmatch(pattern, text):
            if intent == "joke":
                answer = JOKES[sum(map(ord, text)) % len(JOKES)]
            elif intent == "fav":
                names = _name_list(catalog, 1)
                pick = names[0] if names else "Munnar"
                answer = f"I can't choose just one, but {pick} is a popular pick here. Want to see when it's best to go?"
            return _out(answer, "smalltalk", context, suggestions=_default_suggestions(catalog))
    return None


def reply(message, context, catalog):
    raw = (message or "").strip()[:MAX_MESSAGE]
    text = re.sub(r"\s+", " ", raw.lower())
    context = context or {}
    if not text:
        return _out("Ask me anything about South India trips: when to go, where to go, costs and things to do.",
                    "empty", context, suggestions=_default_suggestions(catalog))
    if not catalog:
        return _out("There are no destinations in the system yet, so I can't answer travel questions right now.", "empty", context)

    if DEVELOPER_RE.search(text) and not find_destination(text, catalog):
        return _out(DEVELOPER_REPLY, "developer", context, suggestions=_default_suggestions(catalog))
    for pat, answer in DEVELOPER_FOLLOW.items():
        if re.search(pat, text):
            return _out(answer, "developer", context, suggestions=_default_suggestions(catalog))

    talk = _small_talk(text, catalog, context)
    if talk:
        return talk

    dest = find_destination(text, catalog)
    months = find_months(text)
    category = find_category(text)
    state = find_state(text, catalog)
    if not dest and context.get("destination"):
        # Follow-up such as "what about July?" or "how much for 4 people?": reuse the destination
        # from earlier, unless the person is clearly asking for a new set of recommendations.
        follow_up = months or _has(text, "cost", "budget", "price", "how much", "reach", "tips", "tip", "attractions",
                                   "things to do", "best time", "weather", "crowd", "crowded", "rain", "plan", "book",
                                   "there", "it")
        new_search = re.search(r"\b(where|suggest|recommend|which place|other places|places|somewhere|cheap|cheapest)\b", text)
        if follow_up and not new_search and not category and not state:
            dest = next((d for d in catalog if d["slug"] == context["destination"]), None)
    budget_cap = find_budget(text)
    ctx = {"destination": dest["slug"]} if dest else {}

    if re.fullmatch(r"(hi|hii+|hello|hey|hola|namaste|vanakkam|good (morning|afternoon|evening))[ !.]*", text):
        return _out("Hi! I'm the ExploreSouth assistant. I can tell you the best time to visit a place, "
                    "suggest where to go in any month, and estimate your trip cost. What would you like to know?",
                    "greeting", context, suggestions=_default_suggestions(catalog))
    if re.fullmatch(r"(thanks?|thank you|thx|ok(ay)?|great|cool|nice|bye|goodbye)[ !.]*", text):
        return _out("You're most welcome! Happy travels. I'm right here if you need anything else.", "thanks", context,
                    suggestions=_default_suggestions(catalog))
    if _has(text, "help", "what can you do", "how do you work"):
        return _out("I can help with:\n- **Best time** to visit a place (season prediction)\n- **Where to go** in a given month, season or budget\n"
                    "- **Trip cost** estimates\n- **Things to do**, how to reach and travel tips\n"
                    "Try: \"Best time to visit Munnar\" or \"Beach places in December under 3000\".",
                    "help", context, suggestions=_default_suggestions(catalog))

    # --- season / best time
    if _has(text, "best time", "when", "which month", "what month", "season", "weather", "climate", "rain", "rainy",
            "monsoon", "crowd", "crowded", "peak", "off season", "temperature", "hot", "cold", "raining", "rains",
            "snow", "fog", "foggy", "misty", "humid") and not \
            _has(text, "reach", "how much", "cost"):
        if dest:
            return _answer_season_destination(dest, months, ctx)
        if months or category or state:
            return _answer_recommend(catalog, months, category, state, budget_cap, text)
        names = _name_list(catalog)
        return _out("Which place are you thinking of? Tell me a destination and I'll show the best months to visit.",
                    "ask", context, suggestions=[f"Best time to visit {n}" for n in names[:3]])

    # --- a month mentioned with a destination ("Munnar in June", "what about July?")
    if dest and months and not _has(text, "budget", "cost", "price", "how much", "reach", "tips", "attractions",
                                    "things to do", "plan", "book"):
        return _answer_season_destination(dest, months, ctx)

    # --- cost
    if _has(text, "budget", "cost", "price", "prices", "how much", "expense", "expenses", "afford", "cheap", "cheapest", "money"):
        if dest:
            return _answer_cost(dest, find_days(text), find_travelers(text), next(iter(sorted(months)), None), ctx)
        if budget_cap or category or months or state:
            return _answer_recommend(catalog, months, category, state, budget_cap, text)
        return _out("Which destination should I estimate? For example: \"Budget for Munnar for 4 people, 3 days\".",
                    "ask", context, suggestions=[f"Budget for {n}" for n in _name_list(catalog, 3)])

    # --- info about a destination
    if dest and _has(text, "reach", "get to", "go to", "travel to", "transport", "train", "flight", "bus", "airport", "station", "route"):
        return _answer_text_field(dest, "how_to_reach", "How to reach", "I don't have travel directions for {name} yet.", ctx)
    if dest and _has(text, "tip", "tips", "advice", "safety", "safe", "pack", "carry", "wear", "careful"):
        return _answer_text_field(dest, "tips", "Travel tips for", "I don't have tips for {name} yet.", ctx)
    if dest and _has(text, "attraction", "attractions", "things to do", "see", "sightseeing", "visit", "places", "do", "explore"):
        return _answer_attractions(dest, ctx)
    if dest and _has(text, "plan", "book", "itinerary", "trip", "schedule"):
        return _out(f"Let's plan your trip to **{dest['name']}**. Choose your dates and group size and I'll build a day-by-day plan with costs.",
                    "plan", ctx, [_card(dest)], [f"Best time to visit {dest['name']}", f"Budget for {dest['name']}"],
                    [{"label": f"Plan a trip to {dest['name']}", "to": f"/trips/new?destination={dest['id']}"}])

    # --- recommendations
    if category or state or months or budget_cap or _has(text, "where", "suggest", "recommend", "recommendation", "ideas",
                                                          "places", "destination", "destinations", "honeymoon", "family", "weekend", "trip"):
        if dest and not (category or state):
            return _overview(dest, ctx)
        return _answer_recommend(catalog, months, category, state, budget_cap, text)

    if dest:
        return _overview(dest, ctx)

    return _out("Hmm, I didn't quite catch that. I'm best with travel questions: the best time to visit, where to go "
                "in a given month, trip costs and things to do. Try one of these, or use the Contact page to reach our team.",
                "fallback", context, suggestions=_default_suggestions(catalog),
                links=[{"label": "Contact us", "to": "/contact"}])
