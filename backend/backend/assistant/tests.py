"""Unit tests for the season model and the chatbot. They need no database:
    python manage.py test assistant
"""
import unittest
from datetime import date

from . import chatbot, season

OOTY = {"name": "Ooty", "state": "Tamil Nadu", "categories": ["hill station"], "best_season": "summer",
        "best_time": "March to June, and September to November", "budget": 2500}
ALLEPPEY = {"name": "Alleppey", "state": "Kerala", "categories": ["backwaters", "beach"], "best_season": "winter",
            "best_time": "November to February", "budget": 3000}


def dest(i, f, slug=None, atts=()):
    return {"id": i, "slug": slug or f["name"].lower(), "name": f["name"], "city": f["name"], "state": f["state"],
            "categories": f["categories"], "cover": None, "budget": f["budget"], "short": "", "featured": True,
            "best_season": f["best_season"], "best_time": f["best_time"], "how_to_reach": "", "tips": "",
            "attractions": [{"name": n, "fee": fee, "timings": ""} for n, fee in atts]}


CATALOG = [dest(1, OOTY, atts=[("Botanical Garden", 50)]), dest(2, ALLEPPEY)]


class SeasonTests(unittest.TestCase):
    def test_parse_months(self):
        self.assertEqual(season.parse_months("March to June, and September to November"), {3, 4, 5, 6, 9, 10, 11})
        self.assertEqual(season.parse_months("Nov-Feb"), {11, 12, 1, 2})
        self.assertEqual(season.parse_months(""), set())

    def test_month_ranges_wraps_year_end(self):
        self.assertEqual(season.month_ranges([10, 11, 12, 1, 2, 3]), "Oct-Mar")

    def test_scores_in_range_and_twelve_months(self):
        for facts in (OOTY, ALLEPPEY):
            months = season.predict(facts)["months"]
            self.assertEqual(len(months), 12)
            self.assertTrue(all(0 <= m["score"] <= 100 for m in months))

    def test_monsoon_is_bad_for_hill_station_in_kerala(self):
        munnar = dict(OOTY, name="Munnar", state="Kerala", best_time="September to March")
        months = season.month_forecast(munnar)
        self.assertLess(months[6]["score"], 40)      # July
        self.assertGreater(months[0]["score"], 80)   # January

    def test_trip_check_flags_bad_dates(self):
        bad = season.trip_check(ALLEPPEY, date(2026, 7, 1), date(2026, 7, 5))
        good = season.trip_check(ALLEPPEY, date(2027, 1, 5), date(2027, 1, 9))
        self.assertLess(bad["score"], good["score"])
        self.assertTrue(bad["better_months"])


class ChatbotTests(unittest.TestCase):
    def ask(self, text, ctx=None):
        return chatbot.reply(text, ctx or {}, CATALOG)

    def test_best_time_with_typo(self):
        r = self.ask("best time to visit ootty")
        self.assertEqual(r["intent"], "season")
        self.assertEqual(r["destinations"][0]["slug"], "ooty")

    def test_follow_up_uses_context(self):
        r = self.ask("what about july?", {"destination": "alleppey"})
        self.assertEqual(r["intent"], "season")
        self.assertIn("July", r["reply"])

    def test_recommend_by_month_and_category(self):
        r = self.ask("beach places in december")
        self.assertEqual(r["intent"], "recommend")
        self.assertEqual(r["destinations"][0]["slug"], "alleppey")

    def test_cost(self):
        r = self.ask("budget for ooty for 4 people 3 days")
        self.assertEqual(r["intent"], "cost")
        self.assertIn("4 travelers", r["reply"])

    def test_unknown_input_is_honest(self):
        self.assertEqual(self.ask("blah blah")["intent"], "fallback")

    def test_empty_and_long_input(self):
        self.assertEqual(self.ask("   ")["intent"], "empty")
        self.assertTrue(self.ask("x" * 5000)["reply"])


if __name__ == "__main__":
    unittest.main()

    def test_developer_question(self):
        for q in ("who developed you?", "Who made this website", "who created you", "your developer", "who built this chatbot?"):
            r = self.ask(q)
            self.assertEqual(r["intent"], "developer", q)
            self.assertIn("Shoba Niki J", r["reply"])
            self.assertIn("Kanyakumari", r["reply"])

    def test_casual_small_talk(self):
        for q in ("good morning", "are you free?", "do you speak tamil?", "i need a break", "wow", "what is your favourite place?"):
            self.assertEqual(self.ask(q)["intent"], "smalltalk", q)

    def test_developer_word_does_not_hijack_travel(self):
        self.assertEqual(self.ask("best time to visit ooty")["intent"], "season")

