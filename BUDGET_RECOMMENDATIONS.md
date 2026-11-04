# ExploreSouth budget recommendations

The Budget page now recommends destinations after a successful calculation. It compares the calculated total budget per person per day (`total / travelers / days`) with each published destination's `avg_daily_budget` value. Affordable destinations are sorted from the closest-to-budget option downwards. If none fit, the page displays the three closest priced alternatives.

## Admin data required

For each destination in Django admin, set **Average daily budget** (`avg_daily_budget`) to an estimated INR amount **per person per day**. The recommendation system ignores destinations where this value is 0, because no estimate has been entered. Ensure the destination is published and has a cover image for the best display.

## Files changed

- `frontend/src/pages/Budget.jsx`

No database migration or new backend endpoint is required; the feature uses the existing `/api/budget/calculate/` and `/api/destinations/` endpoints.
