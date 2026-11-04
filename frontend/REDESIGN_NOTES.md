# ExploreSouth UI/UX refresh

## Visual direction
- Forest green navigation and brand surfaces, warm ivory page background, and sunset-orange action accents.
- Plus Jakarta Sans for interface readability and Fraunces for editorial public-page headings.
- Softer card radii, subtle borders/shadows, stronger hierarchy, and consistent button/input sizing.

## User experience updates
- Reworked the budget planner into a responsive expense-entry and live-summary workspace.
- Added live total preview before calculation, clearer group-expense labels, input icons, and a more descriptive calculate action.
- Made the budget summary easier to scan with per-person and per-person/day amounts plus expense progress bars.
- Improved recommendation cards with clearer budget-match labels, ranking, location, cost, and destination detail links.
- Added small-screen spacing and touch-friendly input/button refinements, reduced-motion handling, and fixed the mobile menu panel offset.

## Existing functionality preserved
- Existing React routes, Django API endpoints, authentication, favourites, trips, destination detail links, and chat assistant are retained.
- Budget calculation still posts to `/budget/calculate/` and recommendations still use published destinations' `avg_daily_budget` values.

## Run
From `frontend/`:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```
