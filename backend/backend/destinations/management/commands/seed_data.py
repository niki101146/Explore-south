"""Load sample South India data.  Usage: python manage.py seed_data

Fees, timings and budgets below are SAMPLE values for development. Leave
last_verified empty until an admin has checked them against official sources.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from attractions.models import Attraction
from destinations.models import Category, City, Destination, State

STATES = {
    "Tamil Nadu": "Temples, hill stations and a long Coromandel coastline.",
    "Kerala": "Backwaters, beaches, tea hills and wildlife.",
    "Karnataka": "Royal palaces, ancient ruins, coffee country and coast.",
    "Andhra Pradesh": "Pilgrimage towns, beaches and hill ranges.",
    "Telangana": "Historic Deccan architecture and heritage cuisine.",
}

CATEGORIES = ["Hill Station", "Temple", "Beach", "Heritage", "Wildlife", "Backwaters"]

# name, state, city, categories, season, best_time, budget, lat, lng, short, featured, attractions
DESTINATIONS = [
    ("Ooty", "Tamil Nadu", "Udhagamandalam", ["Hill Station"], "summer",
     "March to June, and September to November", 2500, "11.4102", "76.6950",
     "Nilgiri hill station with tea gardens, lakes and a toy train.", True,
     [("Botanical Garden", "50", "8:30 AM - 6:30 PM", "11.4180", "76.7110"),
      ("Ooty Lake", "30", "9:00 AM - 6:00 PM", "11.4040", "76.6870"),
      ("Doddabetta Peak", "10", "9:00 AM - 6:00 PM", "11.4000", "76.7340")]),
    ("Kodaikanal", "Tamil Nadu", "Kodaikanal", ["Hill Station"], "summer",
     "April to June, and September to October", 2300, "10.2381", "77.4892",
     "Misty lake town in the Palani hills.", False,
     [("Kodaikanal Lake", "0", "Open all day", "10.2350", "77.4890"),
      ("Coaker's Walk", "30", "7:00 AM - 7:00 PM", "10.2330", "77.4940"),
      ("Pillar Rocks", "10", "9:00 AM - 5:30 PM", "10.2060", "77.4630")]),
    ("Madurai", "Tamil Nadu", "Madurai", ["Temple", "Heritage"], "winter",
     "October to March", 1800, "9.9195", "78.1193",
     "Temple city built around the Meenakshi Amman Temple.", True,
     [("Meenakshi Amman Temple", "0", "5:00 AM - 12:30 PM, 4:00 PM - 9:30 PM", "9.9195", "78.1193"),
      ("Thirumalai Nayakkar Mahal", "50", "9:00 AM - 5:00 PM", "9.9150", "78.1260")]),
    ("Munnar", "Kerala", "Munnar", ["Hill Station", "Wildlife"], "winter",
     "September to March", 2800, "10.0889", "77.0595",
     "Tea estates, misty valleys and Eravikulam National Park.", True,
     [("Eravikulam National Park", "200", "7:30 AM - 4:00 PM", "10.1990", "77.0590"),
      ("Mattupetty Dam", "20", "9:00 AM - 5:00 PM", "10.1060", "77.1230"),
      ("Tea Museum", "125", "9:00 AM - 4:00 PM", "10.0900", "77.0600")]),
    ("Alleppey", "Kerala", "Alappuzha", ["Backwaters", "Beach"], "winter",
     "November to February", 3000, "9.4981", "76.3388",
     "Houseboat cruises through Kerala's backwater canals.", True,
     [("Backwater Houseboat Cruise", "0", "Daily, varies by operator", "9.4981", "76.3388"),
      ("Alappuzha Beach", "0", "Open all day", "9.4900", "76.3200")]),
    ("Mysuru", "Karnataka", "Mysuru", ["Heritage", "Temple"], "winter",
     "October to March", 2200, "12.3052", "76.6552",
     "City of palaces; the Dasara festival is its biggest event.", True,
     [("Mysore Palace", "100", "10:00 AM - 5:30 PM", "12.3052", "76.6552"),
      ("Chamundi Hill", "0", "7:30 AM - 2:00 PM, 3:30 PM - 6:00 PM", "12.2724", "76.6700"),
      ("Brindavan Gardens", "50", "6:30 PM - 8:30 PM", "12.4258", "76.5719")]),
    ("Hampi", "Karnataka", "Hampi", ["Heritage"], "winter",
     "October to February", 1800, "15.3350", "76.4600",
     "Boulder-strewn ruins of the Vijayanagara empire.", False,
     [("Virupaksha Temple", "0", "9:00 AM - 6:00 PM", "15.3350", "76.4600"),
      ("Vittala Temple", "40", "8:30 AM - 5:30 PM", "15.3410", "76.4760")]),
    ("Tirupati", "Andhra Pradesh", "Tirupati", ["Temple"], "winter",
     "September to February", 2000, "13.6288", "79.4192",
     "Home of the Sri Venkateswara temple on the Tirumala hills.", False,
     [("Sri Venkateswara Temple, Tirumala", "0", "Open most of the day; queues vary", "13.6833", "79.3474")]),
    ("Hyderabad", "Telangana", "Hyderabad", ["Heritage"], "winter",
     "October to March", 2600, "17.3616", "78.4747",
     "Charminar, Golconda Fort and Hyderabadi biryani.", False,
     [("Charminar", "25", "9:30 AM - 5:30 PM", "17.3616", "78.4747"),
      ("Golconda Fort", "25", "9:00 AM - 5:30 PM", "17.3833", "78.4011")]),
]


class Command(BaseCommand):
    help = "Seed the database with sample South India destinations."

    @transaction.atomic
    def handle(self, *args, **options):
        states = {}
        for name, desc in STATES.items():
            states[name], _ = State.objects.get_or_create(
                name=name, defaults={"description": desc}
            )
        cats = {n: Category.objects.get_or_create(name=n)[0] for n in CATEGORIES}

        for (name, state, city, cat_names, season, best, budget, lat, lng,
             short, featured, attractions) in DESTINATIONS:
            city_obj, _ = City.objects.get_or_create(state=states[state], name=city)
            dest, created = Destination.objects.get_or_create(
                name=name,
                defaults=dict(
                    city=city_obj, best_season=season, best_time_to_visit=best,
                    avg_daily_budget=budget, latitude=Decimal(lat), longitude=Decimal(lng),
                    short_description=short, is_featured=featured,
                    description=f"{short} (Sample description - replace with verified content.)",
                    how_to_reach="Sample text - add nearest airport, railway station and road access.",
                    travel_tips="Sample text - add seasonal and local tips.",
                ),
            )
            dest.categories.set([cats[c] for c in cat_names])
            if created:
                for a_name, fee, timings, a_lat, a_lng in attractions:
                    Attraction.objects.create(
                        destination=dest, name=a_name, entry_fee=Decimal(fee),
                        timings=timings, latitude=Decimal(a_lat), longitude=Decimal(a_lng),
                    )
        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(STATES)} states, {len(DESTINATIONS)} destinations."
        ))
