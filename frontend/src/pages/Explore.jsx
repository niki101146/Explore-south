import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import DestinationCard from "../components/DestinationCard.jsx";
import Icon from "../components/Icon.jsx";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const SEASONS = [
  ["summer", "Summer (Mar-Jun)"],
  ["monsoon", "Monsoon (Jul-Sep)"],
  ["winter", "Winter (Oct-Feb)"],
];
const BUDGETS = [[1500, "Up to ₹1,500"], [2500, "Up to ₹2,500"], [3500, "Up to ₹3,500"], [5000, "Up to ₹5,000"]];

export default function Explore() {
  const bannerImg = useBanner("explore");
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const get = (k) => params.get(k) || "";
  const page = Number(get("page") || 1);

  useEffect(() => {
    api.get("/states/").then((r) => setStates(r.data)).catch(() => {});
    api.get("/categories/").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/destinations/", { params: Object.fromEntries(params) })
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load destinations."))
      .finally(() => setLoading(false));
  }, [params]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const [showFilters, setShowFilters] = useState(false);
  const activeCount = [...params.keys()].filter((k) => k !== "page").length;

  return (
    <>
      <section className="hero-bg text-white" style={bannerStyle(bannerImg)}>
        <div className="page pb-12 pt-6 sm:py-12">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Explore destinations</h1>
          <p className="mt-1 text-sm text-white/75 sm:mt-2 sm:text-base">Search and filter by state, type, season and budget.</p>
        </div>
      </section>

      <div className="page -mt-7 relative z-10">
        <div className="rise rounded-2xl border border-line bg-white p-2.5 shadow-[0_10px_30px_rgba(59,36,23,0.14)] sm:flex sm:items-start sm:gap-3 sm:p-3">
          <div className="flex items-center gap-2 sm:w-80 sm:shrink-0">
            <label className="relative block min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark"><Icon name="search" size={18} /></span>
              <input
                key={get("search")}
                defaultValue={get("search")}
                onKeyDown={(e) => e.key === "Enter" && setFilter("search", e.target.value)}
                onBlur={(e) => e.target.value !== get("search") && setFilter("search", e.target.value)}
                placeholder="Search places, cities…"
                aria-label="Search destinations"
                className="input !rounded-full !bg-surface !py-2.5 !pl-10 !pr-3"
              />
            </label>
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-label="Filters"
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 sm:hidden ${showFilters ? "bg-accent text-navy" : "bg-navy text-white"}`}>
              <Icon name="sliders" size={19} />
              {activeCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.1rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white">{activeCount}</span>
              )}
            </button>
          </div>

          <div className={`grid transition-[grid-template-rows] duration-300 sm:flex-1 sm:grid-rows-[1fr] ${showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2 pt-2.5 sm:grid-cols-4 sm:pt-0">
                <select value={get("state")} onChange={(e) => setFilter("state", e.target.value)} className="input !rounded-xl !py-2.5" aria-label="State">
                  <option value="">All states</option>
                  {states.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
                </select>
                <select value={get("category")} onChange={(e) => setFilter("category", e.target.value)} className="input !rounded-xl !py-2.5" aria-label="Category">
                  <option value="">All types</option>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
                <select value={get("season")} onChange={(e) => setFilter("season", e.target.value)} className="input !rounded-xl !py-2.5" aria-label="Season">
                  <option value="">Any season</option>
                  {SEASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={get("max_budget")} onChange={(e) => setFilter("max_budget", e.target.value)} className="input !rounded-xl !py-2.5" aria-label="Daily budget">
                  <option value="">Any budget</option>
                  {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {loading ? "Loading..." : `${data.count} destination${data.count === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button onClick={() => setParams({})} className="text-sm font-semibold text-brand-dark hover:underline">
                Clear filters
              </button>
            )}
            <select value={get("ordering")} onChange={(e) => setFilter("ordering", e.target.value)}
              className="input !w-auto !rounded-full !py-1.5 text-sm" aria-label="Sort">
              <option value="">A to Z</option>
              <option value="-avg_rating">Top rated</option>
              <option value="avg_daily_budget">Budget: low to high</option>
              <option value="-avg_daily_budget">Budget: high to low</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!loading && !error && data.results.length === 0 && (
          <div className="card mt-6 p-10 text-center text-muted">No destinations match these filters.</div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-sand sm:h-64" />
              ))
            : data.results.map((d, i) => <DestinationCard key={d.id} d={d} i={i} />)}
        </div>

        {(data.previous || data.next) && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button disabled={!data.previous} onClick={() => setFilter("page", String(page - 1))}
              className="btn-outline">← Previous</button>
            <span className="text-sm text-muted">Page {page}</span>
            <button disabled={!data.next} onClick={() => setFilter("page", String(page + 1))}
              className="btn-outline">Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
