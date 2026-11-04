# ExploreSouth - Frontend (React + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Start the Django backend on port 8000 first. Vite proxies `/api` and `/media`
to it (see `vite.config.js`), so no CORS setup is needed in development.

## Pages
- Public: Home, Explore, Destination detail, Budget calculator, Log in, Sign up
- Logged-in users: Favorites, My Trips (itinerary + expenses)
- Admin (staff only, `/admin`): Overview, Destinations, Attractions, Reviews, Users

To get admin access, log in to Django admin (http://localhost:8000/admin/) and tick
"Staff status" on your user, or use the superuser you created. Then log out and in
again so the app picks up the role. An "Admin" link appears in the navbar.

## Design system (redesign)
Inspired by the green/gold travel templates. Tokens live in `src/index.css` (`@theme`):
deep forest `navy`, emerald `brand`, saffron `accent`, warm `surface`/`sand`.
Token names were kept, so every page (including admin) follows the theme.

- Fonts: Fraunces (headlines) + Plus Jakarta Sans (body), loaded in `index.html`.
- `components/HeroArt.jsx`: built-in SVG sunrise with a gopuram. To use a real photo,
  save it as `public/hero.jpg`; it is picked up automatically on the home hero.
- `components/Cover.jsx`: shows `cover_image`, or a generated tile when none is uploaded.
- `components/DestinationCard.jsx`: poster-style card used on Home, Explore and Favorites.
- Upload a cover image for each destination in Django admin to replace the placeholder tiles.
