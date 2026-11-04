# ExploreSouth - Backend (Django + DRF + PostgreSQL)

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit the DB credentials
```

Create the database in PostgreSQL:

```sql
CREATE DATABASE exploresouth;
```

Then:

```bash
python manage.py makemigrations users destinations attractions reviews favorites itineraries expenses
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data
python manage.py runserver
```

- Django admin: http://localhost:8000/admin/
- API root prefix: http://localhost:8000/api/

## API summary

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register/` | public |
| POST | `/api/auth/login/` | public (returns access + refresh) |
| POST | `/api/auth/refresh/` | public |
| GET/PATCH | `/api/auth/me/` | logged in |
| GET | `/api/destinations/` | public. Params: `search`, `state` (slug), `city` (id), `category` (slug), `season`, `min_budget`, `max_budget`, `featured`, `ordering` |
| GET | `/api/destinations/<slug>/` | public |
| POST/PUT/PATCH/DELETE | `/api/destinations/...` | staff |
| GET/POST | `/api/destinations/<slug>/reviews/` | GET public (approved only), POST logged in (starts as pending) |
| GET | `/api/states/`, `/api/cities/`, `/api/categories/` | public (write: staff) |
| CRUD | `/api/attractions/`, `/api/destination-images/`, `/api/attraction-images/` | read public, write staff |
| GET/POST/DELETE | `/api/favorites/` | logged in |
| CRUD | `/api/itineraries/`, `/api/itinerary-items/`, `/api/expenses/` | logged in, own data only |
| POST | `/api/budget/calculate/` | public |
| GET/PATCH/DELETE | `/api/reviews/` (moderation, `?status=pending`) | staff |
| GET | `/api/admin-dashboard/stats/` | staff |

Budget calculator example: `POST /api/budget/calculate/` with
`{"travelers":2,"days":3,"travel":2000,"accommodation":3000,"food":1500,"other":1000}`
returns `total: 7500`.

## Notes

- Seed data is sample content. Entry fees, timings and budgets are placeholders;
  verify them and set `last_verified` in the admin before publishing.
- Tokens: access lasts 30 min, refresh 7 days (see `SIMPLE_JWT` in settings).
- Make a user a dashboard admin by ticking "Staff status" in Django admin.

## Roles (admin / editor / user)
| Role | How it is assigned | Can do |
|---|---|---|
| Admin | `is_staff` or superuser | Everything: users, reviews, delete content |
| Editor | member of the `Editor` group | Add/edit destinations and attractions, upload/delete pictures. Cannot delete destinations/attractions, moderate reviews or manage users |
| User | default | Favorites, trips, reviews |

Change roles from the React admin (Admin > Users > Role dropdown) or the command line:

    python manage.py set_role someusername editor

Images are limited to JPG/PNG/WebP, max 5 MB (checked in the browser and on the server).
After changing a role, the person should log out and back in.

## Contact us emails
Messages from the Contact us page are saved (see Admin > Messages) and emailed to
`CONTACT_RECEIVER_EMAIL`. Add `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (a Gmail App Password)
to `backend/.env` to enable real email; without them the email is printed in the server console.
Run `python manage.py migrate` after updating (adds the `contact` app).

## Images are stored as WebP
Every uploaded picture (cover images, galleries, attraction photos, profile pictures) is converted
to WebP and limited to 2000 px on its longest side, whether it is uploaded from the React admin,
the API or Django admin (see `config/webp.py`). Existing images are not changed.

## Trip plans and bookings
My Trips works like this: the traveler picks a destination, dates and number of people; the server builds a
full day-by-day plan (sightseeing, meals, local travel, hotel) with costs (`bookings/planner.py`); when the
traveler presses **Confirm booking** the booking is saved and a confirmation email is sent to them (plus a copy
to `CONTACT_RECEIVER_EMAIL`). Costs come from each destination's average daily budget and the real attraction
entry fees. Admins see all bookings under Admin > Bookings.

After updating run:

    python manage.py makemigrations bookings
    python manage.py migrate

Nothing is reserved with hotels or transport providers and no payment is taken.

## Chatbot and season prediction
New app: `assistant`. It adds **no database tables, so no migration is needed**. Just restart the server.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/chat/` | Chatbot. Body: `{"message": "best time to visit Munnar", "context": {"destination": "munnar"}}` |
| GET | `/api/season/predict/?destination=<slug>` | 12-month prediction (score, temperature, rain, crowds, price, packing list) |
| GET | `/api/season/recommend/?month=12&category=<slug>&state=<slug>&max_budget=3000` | Destinations ranked for a month |
| GET | `/api/season/overview/` | Every destination's 12 monthly scores (year-at-a-glance heat map) |
| GET | `/api/season/trip-check/?destination=<slug>&start=2026-12-20&end=2026-12-24` | Score for specific travel dates |

All are public and rate limited (`chat` 60/min, `season` 120/min in `settings.py`).
The trip planner (`/api/bookings/preview/`) now also returns a `season` block that the plan page shows as a banner.

**How the prediction works** (`assistant/season.py`): each destination is mapped to a climate profile
(Kerala coast, ghat hills, Tamil Nadu plains, Deccan) holding typical monthly temperature and rainfall.
A month starts at 100 and loses points for heat/cold and rain (weighted by destination type: beaches and hills
suffer more, temples and backwaters less). The admin's "best time to visit" text and best season add or remove
points, so local knowledge you enter in the admin always counts. Crowd level and a price factor come from the
month, destination type and known festivals. It is a rule-based estimate from typical weather, not a live forecast.
To tune it, edit `PROFILES`, `RAIN_WEIGHT`, `BASE_CROWD` and `FESTIVALS` in `season.py`.

**How the chatbot works** (`assistant/chatbot.py`): it understands destination names (with typos and aliases),
months, seasons, categories, states, budgets, days and group size, then answers from your database and the
season model. It never invents places, fees or timings. It needs no API key. Anything it cannot answer gets a
polite fallback with suggestions.

Run the tests (no database needed): `python manage.py test assistant`

Frontend: floating chat button on every public page, a **Best time** page (`/season`), a "Best time to visit"
chart on each destination page, and a season banner on the trip plan.
