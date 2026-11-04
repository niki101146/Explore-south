import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import { PageHead, Loading, ErrorNote } from "./ui.jsx";
import Icon from "../components/Icon.jsx";

const CARDS = [
  ["users", "Users", "users"], ["destinations", "Destinations", "map"], ["attractions", "Attractions", "landmark"],
  ["reviews", "Reviews", "star"], ["favorites", "Favorites", "heart"], ["bookings", "Bookings", "ticket"],
];

export default function AdminOverview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin-dashboard/stats/").then((r) => setS(r.data)).catch((e) => setError(`Could not load stats (${e.response?.status || "no response"}). ${errorMessage(e, "")}`));
  }, []);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!s) return <Loading />;

  const maxState = Math.max(1, ...s.destinations_by_state.map((x) => x.count));

  return (
    <>
      <PageHead title="Overview" subtitle="A snapshot of what is happening on ExploreSouth." />

      {s.totals.pending_reviews > 0 && (
        <Link to="/admin/reviews"
          className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 sm:mb-4">
          <span><b>{s.totals.pending_reviews}</b> review(s) waiting for approval</span>
          <span className="font-semibold">Review now →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {CARDS.map(([k, label, icon], i) => (
          <div key={k} className="card rise flex items-center gap-3 p-3 sm:p-5" style={{ "--i": i }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-brand-dark sm:h-12 sm:w-12">
              <Icon name={icon} size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">{label}</p>
              <p className="text-2xl font-extrabold leading-tight text-navy sm:text-3xl">{s.totals[k]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 font-bold text-navy">Destinations by state</h2>
          {s.destinations_by_state.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
          <div className="space-y-3">
            {s.destinations_by_state.map((x) => (
              <div key={x.state}>
                <div className="mb-1 flex justify-between text-sm"><span>{x.state}</span><b>{x.count}</b></div>
                <div className="h-2 rounded-full bg-sand">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${(x.count / maxState) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 font-bold text-navy">Reviews by status</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {["pending", "approved", "rejected"].map((k) => (
              <div key={k} className="rounded-xl bg-surface p-3">
                <p className="text-2xl font-bold text-navy">{s.reviews_by_status[k] || 0}</p>
                <p className="text-xs capitalize text-muted">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 font-bold text-navy">Most favorited</h2>
          {s.top_favorited.length === 0 && <p className="text-sm text-muted">No favorites yet.</p>}
          <ol className="space-y-2 text-sm">
            {s.top_favorited.map((x, i) => (
              <li key={x.id} className="flex justify-between">
                <span>{i + 1}. {x.name}</span><b>♥ {x.favorite_count}</b>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 font-bold text-navy">Highest rated</h2>
          {s.top_rated.length === 0 && <p className="text-sm text-muted">No approved reviews yet.</p>}
          <ol className="space-y-2 text-sm">
            {s.top_rated.map((x, i) => (
              <li key={x.id} className="flex justify-between">
                <span>{i + 1}. {x.name}</span>
                <b>★ {x.avg_rating.toFixed(1)} <span className="font-normal text-muted">({x.review_count})</span></b>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-navy">Who saved which place</h2>
          {(s.recent_favorites || []).length === 0 && <p className="text-sm text-muted">No favorites yet.</p>}
          <ul className="divide-y divide-line text-sm">
            {(s.recent_favorites || []).map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate"><b>{x.user}</b> saved <Link to={`/destinations/${x.slug}`} className="font-medium text-brand-dark hover:underline">{x.destination}</Link></span>
                <span className="shrink-0 text-xs text-muted">{new Date(x.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-navy">Who reviewed which place</h2>
          {(s.recent_reviews || []).length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
          <ul className="divide-y divide-line text-sm">
            {(s.recent_reviews || []).map((x) => (
              <li key={x.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate"><b>{x.user}</b> on <Link to={`/destinations/${x.slug}`} className="font-medium text-brand-dark hover:underline">{x.destination}</Link></span>
                  <span className="shrink-0 font-semibold">★ {x.rating} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-600">{x.status}</span></span>
                </div>
                {x.comment && <p className="mt-0.5 truncate text-xs text-muted">{x.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
