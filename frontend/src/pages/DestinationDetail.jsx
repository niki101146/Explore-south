import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import Stars from "../components/Stars.jsx";
import SeasonStrip from "../components/SeasonStrip.jsx";

export default function DestinationDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [fav, setFav] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get(`/destinations/${slug}/`)
      .then((r) => { setD(r.data); setFav(r.data.is_favorite); })
      .catch(() => setError("Destination not found."));
    api.get(`/destinations/${slug}/reviews/`).then((r) => setReviews(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => { load(); }, [load, user?.id]);

  const toggleFavorite = async () => {
    try {
      if (fav) {
        const { data } = await api.get("/favorites/");
        const item = data.find((f) => f.destination === d.id);
        if (item) await api.delete(`/favorites/${item.id}/`);
        setFav(false);
      } else {
        await api.post("/favorites/", { destination: d.id });
        setFav(true);
      }
    } catch (e) {
      setMsg(errorMessage(e));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post(`/destinations/${slug}/reviews/`, form);
      setForm({ rating: 5, comment: "" });
      setMsg("Thanks! Your review will appear after approval.");
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  if (error) return <p className="p-16 text-center text-red-600">{error}</p>;
  if (!d) return <p className="p-16 text-center text-muted">Loading...</p>;

  const images = d.images || [];

  return (
    <>
      <section className="relative text-white">
        {d.cover_image ? (
          <img src={d.cover_image} alt={d.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="hero-bg absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="page relative flex min-h-[320px] flex-col justify-end pb-8 pt-24">
          <Link to="/explore" className="mb-3 text-sm text-white/70 hover:text-white">← All destinations</Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {d.categories.map((c) => (
                  <span key={c.id} className="badge bg-white/15 text-white backdrop-blur">{c.name}</span>
                ))}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{d.name}</h1>
              <p className="mt-1 text-white/80">
                {d.city_name}, {d.state_name}
                {d.review_count > 0 && <span className="ml-3">★ {d.avg_rating.toFixed(1)} ({d.review_count})</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user ? (
                <>
                  <button onClick={toggleFavorite} className="btn-accent">
                    {fav ? "♥ Saved" : "♡ Save"}
                  </button>
                  <Link to={`/trips/new?destination=${d.id}`} className="btn-outline">Plan a trip here</Link>
                </>
              ) : (
                <Link to="/login" state={{ from: `/destinations/${d.slug}` }} className="btn-accent">
                  Log in to save and plan
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="page grid gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="h-section mb-3">About</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{d.description}</p>
          </section>

          {images.length > 0 && (
            <section>
              <h2 className="h-section mb-3">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((im) => (
                  <img key={im.id} src={im.image} alt={im.caption || d.name}
                    className="h-40 w-full rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="h-section mb-3">Best time to visit</h2>
            <SeasonStrip slug={d.slug} />
          </section>

          <section>
            <h2 className="h-section mb-3">Attractions</h2>
            {d.attractions.length === 0 && <p className="text-muted">No attractions listed yet.</p>}
            <div className="space-y-3">
              {d.attractions.map((a) => (
                <div key={a.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-navy">{a.name}</h3>
                    <span className={`badge ${Number(a.entry_fee) > 0 ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {Number(a.entry_fee) > 0 ? `₹${Number(a.entry_fee)}` : "Free"}
                    </span>
                  </div>
                  {a.timings && <p className="mt-1 text-sm text-muted">🕒 {a.timings}</p>}
                  {a.description && <p className="mt-2 text-sm text-slate-600">{a.description}</p>}
                  <p className="mt-2 text-xs text-slate-400">
                    {a.last_verified ? `Fee and timings verified ${a.last_verified}` : "Fee and timings not yet verified"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="h-section mb-3">Reviews</h2>
            {reviews.length === 0 && <p className="text-muted">No reviews yet. Be the first!</p>}
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-navy">{r.user_name}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>

            {user ? (
              <form onSubmit={submitReview} className="card mt-5 space-y-3 p-5">
                <h3 className="font-bold text-navy">Write a review</h3>
                <select value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="input !w-auto">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && "s"}</option>)}
                </select>
                <textarea value={form.comment} rows={3} placeholder="Share your experience"
                  onChange={(e) => setForm({ ...form, comment: e.target.value })} className="input" />
                <button className="btn-primary">Submit review</button>
              </form>
            ) : (
              <p className="mt-4 text-sm">
                <Link to="/login" state={{ from: `/destinations/${d.slug}` }}
                  className="font-semibold text-brand-dark">Log in</Link> to write a review.
              </p>
            )}
            {msg && <p className="mt-3 text-sm font-medium text-brand-dark">{msg}</p>}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <MapView destination={d} />
          <div className="card space-y-4 p-6 text-sm">
            <h2 className="text-lg font-bold text-navy">Plan your visit</h2>
            {d.best_time_to_visit && (
              <div><p className="label">Best time</p><p>{d.best_time_to_visit}</p></div>
            )}
            {d.avg_daily_budget > 0 && (
              <div>
                <p className="label">Daily budget</p>
                <p>About ₹{d.avg_daily_budget.toLocaleString("en-IN")} per person</p>
              </div>
            )}
            {d.how_to_reach && <div><p className="label">How to reach</p><p>{d.how_to_reach}</p></div>}
            {d.travel_tips && <div><p className="label">Tips</p><p>{d.travel_tips}</p></div>}
            <p className="border-t border-line pt-3 text-xs text-slate-400">
              {d.last_verified ? `Details verified ${d.last_verified}` : "Details not yet verified by an admin"}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
