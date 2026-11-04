import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import Cover from "../components/Cover.jsx";
import Icon from "../components/Icon.jsx";
import SeasonStrip, { ScoreRing } from "../components/SeasonStrip.jsx";
import MonthFilter from "../components/MonthFilter.jsx";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BUDGETS = [[0, "Any budget"], [1500, "Up to ₹1,500"], [2500, "Up to ₹2,500"], [3500, "Up to ₹3,500"], [5000, "Up to ₹5,000"]];
const NOW = new Date().getMonth() + 1;

// Cookie scale: the deeper the caramel, the better the month.
const cellTone = (s) => (s >= 75 ? "bg-[#7a4313] text-white" : s >= 60 ? "bg-[#c2762b] text-white"
  : s >= 40 ? "bg-[#f2b84b] text-[#3b2417]" : "bg-[#efe0c8] text-[#7a6554]");

/* ------------------------------------------------------------ auto slider */
// A row of cards that glides sideways by itself. It pauses while a finger or the mouse is on it
// and can still be swiped or scrolled by hand. When it reaches the end it returns to the start.
function AutoSlider({ children, resetKey }) {
  const ref = useRef(null);
  const paused = useRef(false);
  const resumeTimer = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (paused.current) return;
      const card = el.firstElementChild;
      if (!card || el.scrollWidth <= el.clientWidth + 8) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: card.offsetWidth + 12, behavior: "smooth" });
    }, 3200);
    return () => clearInterval(id);
  }, [resetKey]);

  const hold = () => { clearTimeout(resumeTimer.current); paused.current = true; };
  const release = () => { clearTimeout(resumeTimer.current); resumeTimer.current = setTimeout(() => { paused.current = false; }, 2500); };

  return (
    <div ref={ref} onMouseEnter={hold} onMouseLeave={release} onTouchStart={hold} onTouchEnd={release} onFocus={hold} onBlur={release}
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 sm:mx-0 sm:px-0">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ result card */
function ResultCard({ r, rank }) {
  const d = r.destination;
  const first = rank === 1;
  return (
    <article className="group relative isolate flex h-[21rem] w-[72vw] max-w-[17rem] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-3xl bg-navy text-white shadow-[0_8px_26px_rgba(59,36,23,0.18)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(59,36,23,0.3)] sm:h-[22rem] sm:w-[18rem] sm:max-w-none"
      style={{ "--i": rank - 1 }}>
      <div className="absolute inset-0 -z-10 transition duration-[900ms] group-hover:scale-[1.06]"><Cover name={d.name} src={d.cover_image} /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${first ? "bg-accent text-navy" : "bg-white/90 text-navy"}`}>
          {first ? "★ Top pick" : `#${rank}`}
        </span>
        <ScoreRing score={r.score} label={r.label} size={first ? 72 : 60} dark />
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-accent sm:text-sm">{r.label} in this month</p>
        <h3 className="font-display text-2xl font-semibold leading-tight">{d.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-white/75"><Icon name="pin" size={14} /> {d.city_name}, {d.state_name}</p>

        <p className="mt-2 line-clamp-2 text-xs text-white/80 sm:text-sm">{r.note}.</p>
        <ul className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
          <li className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{r.temp_c}°C</li>
          <li className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{r.rain_mm} mm rain</li>
          <li className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">Crowds: {r.crowd_label.toLowerCase()}</li>
          {r.est_daily_budget ? <li className="rounded-full bg-accent/90 px-2.5 py-1 text-navy">₹{r.est_daily_budget.toLocaleString("en-IN")} / day</li> : null}
        </ul>

        <div className="mt-3 flex gap-2">
          <Link to={`/trips/new?destination=${d.id}`} className="btn-accent !px-4 !py-1.5 !text-sm">Plan a trip</Link>
          <Link to={`/destinations/${d.slug}`} className="btn-ghost !px-4 !py-1.5 !text-sm">Details</Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ year at a glance */
function Heatmap({ month, onMonth }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/season/overview/").then((r) => setData(r.data)).catch(() => {}); }, []);
  if (!data || data.destinations.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="glance-title">
      <p className="eyebrow">Year at a glance</p>
      <h2 id="glance-title" className="h-section mt-2">Every destination, every month</h2>
      <p className="mt-1 max-w-2xl text-muted">Deeper caramel means a better month to visit. Tap a month heading to see its best places above.</p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-separate border-spacing-x-1 border-spacing-y-1 p-2 text-center text-xs sm:p-3">
          <caption className="sr-only">Suitability score out of 100 for each destination by month</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-28 min-w-[7rem] bg-white pl-2 pr-2 text-left text-xs font-semibold text-muted shadow-[6px_0_8px_-6px_rgba(59,36,23,0.18)] sm:w-36">Destination</th>
              {data.months.map((m, i) => (
                <th key={m} scope="col">
                  <button type="button" onClick={() => onMonth(i + 1)} aria-pressed={month === i + 1}
                    className={`w-full rounded-lg px-1 py-1.5 font-semibold transition ${month === i + 1 ? "bg-navy text-white" : "text-slate-600 hover:bg-sand"}`}>
                    {m}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.destinations.map((d) => (
              <tr key={d.id}>
                <th scope="row" className="sticky left-0 z-10 w-28 min-w-[7rem] whitespace-nowrap bg-white pl-2 pr-2 text-left shadow-[6px_0_8px_-6px_rgba(59,36,23,0.18)] sm:w-36">
                  <Link to={`/destinations/${d.slug}`} className="text-sm font-semibold text-navy hover:underline">{d.name}</Link>
                  <span className="block text-[11px] font-normal text-muted">{d.state}</span>
                </th>
                {d.scores.map((s, i) => (
                  <td key={i}>
                    <span title={`${d.name}, ${MONTHS[i]}: ${s}/100`}
                      className={`block rounded-lg py-2 text-[11px] font-bold transition hover:scale-105 ${cellTone(s)} ${month === i + 1 ? "ring-2 ring-navy ring-offset-1" : ""}`}>
                      {s}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {[["Excellent (75+)", "bg-[#7a4313]"], ["Good (60-74)", "bg-[#c2762b]"], ["Fair (40-59)", "bg-[#f2b84b]"], ["Poor (under 40)", "bg-[#efe0c8] ring-1 ring-line"]].map(([l, c]) => (
          <li key={l} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${c}`} />{l}</li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ where should I go */
function WhereToGo({ month, setMonth }) {
  const [category, setCategory] = useState("");
  const [maxBudget, setMaxBudget] = useState(0);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/categories/").then((r) => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/season/recommend/", { params: { month, category: category || undefined, max_budget: maxBudget || undefined } })
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load recommendations."))
      .finally(() => setLoading(false));
  }, [month, category, maxBudget]);

  const sel = "input !w-full sm:!w-auto sm:min-w-[10rem] !rounded-full !py-2";
  return (
    <>
      {/* Sticky filter bar */}
      <div className="z-30 border-b border-line bg-surface/90 backdrop-blur-md lg:sticky lg:top-[58px] xl:top-[60px]" data-no-reveal>
        <div className="page flex flex-col gap-2 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <MonthFilter value={month} onChange={setMonth} className="min-w-0 lg:w-[34rem]" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <label className="sr-only" htmlFor="sp-cat">Type of place</label>
            <select id="sp-cat" className={sel} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All types</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="sp-bud">Daily budget per person</label>
            <select id="sp-bud" className={sel} value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}>
              {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="page pt-5 sm:pt-8">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p>}
        {loading && !data && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-no-reveal>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[27rem] animate-pulse rounded-[1.75rem] bg-sand" />)}
          </div>
        )}

        {data && (
          <div data-no-reveal aria-live="polite" className={loading ? "opacity-60 transition" : "transition"}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow !text-[11px]">Ranked for {data.month_name}</p>
                <h2 className="h-section mt-1 !text-2xl sm:!text-4xl">Best places to visit in {data.month_name}</h2>
              </div>
              <p className="text-sm text-muted">{data.results.length} destination{data.results.length === 1 ? "" : "s"}</p>
            </div>

            {data.results.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="font-display text-2xl text-navy">No match for these filters</p>
                <p className="mt-1 text-muted">Try another type of place or a higher daily budget.</p>
                <button type="button" className="btn-primary mt-4" onClick={() => { setCategory(""); setMaxBudget(0); }}>Clear filters</button>
              </div>
            ) : (
              <AutoSlider resetKey={`${month}-${category}-${maxBudget}`}>
                {data.results.map((r, i) => <ResultCard key={r.destination.id} r={r} rank={i + 1} />)}
              </AutoSlider>
            )}
          </div>
        )}

        <Heatmap month={month} onMonth={(m) => { setMonth(m); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------ when should I go */
function WhenToGo({ initialSlug }) {
  const [slug, setSlug] = useState(initialSlug || "");
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.get("/destinations/", { params: { page_size: 100 } })
      .then((r) => { setDestinations(r.data.results); setSlug((s) => s || r.data.results[0]?.slug || ""); })
      .catch(() => {});
  }, []);

  const current = destinations.find((d) => d.slug === slug);
  return (
    <div className="page pt-8">
      <p className="eyebrow">Choose a destination</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Destination">
        {destinations.map((d) => (
          <button key={d.id} type="button" onClick={() => setSlug(d.slug)} aria-pressed={slug === d.slug}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold transition active:scale-95 ${
              slug === d.slug ? "bg-navy text-white shadow-md" : "bg-white text-slate-700 ring-1 ring-line hover:ring-brand"}`}>
            <span className="block h-7 w-7 overflow-hidden rounded-full"><Cover name={d.name} src={d.cover_image} /></span>
            {d.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_22rem]" data-no-reveal>
        <div className="card p-5 sm:p-8">
          {current && <h2 className="font-display text-3xl font-semibold text-navy">When to visit {current.name}</h2>}
          <div className="mt-4">{slug ? <SeasonStrip slug={slug} /> : <p className="text-muted">Loading destinations...</p>}</div>
        </div>
        {current && (
          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <Link to={`/destinations/${current.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-navy xl:aspect-[4/5]">
              <div className="absolute inset-0 transition duration-700 group-hover:scale-105"><Cover name={current.name} src={current.cover_image} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-display text-2xl font-semibold">{current.name}</p>
                <p className="text-sm text-white/75">{current.city_name}, {current.state_name}</p>
              </div>
            </Link>
            <Link to={`/trips/new?destination=${current.id}`} className="btn-accent w-full !py-3">Plan a trip to {current.name}</Link>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ page */
export default function SeasonPlanner() {
  const bannerImg = useBanner("season");
  const [params, setParams] = useSearchParams();
  const initialSlug = params.get("destination") || "";
  const [tab, setTab] = useState(initialSlug ? "when" : "where");
  const [month, setMonth] = useState(NOW);

  const tabs = [["where", "Where should I go?", "map"], ["when", "When should I go?", "calendar"]];
  return (
    <>
      <section className="hero-bg relative overflow-hidden text-white" data-no-reveal style={bannerStyle(bannerImg)}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-brand/40 blur-3xl" aria-hidden="true" />
        <div className="page relative grid items-end gap-6 pb-5 pt-6 sm:pb-6 sm:pt-10 lg:grid-cols-[1.4fr_1fr] lg:pb-8 lg:pt-12">
          <div className="rise">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur sm:mb-3 sm:text-xs">
              <Icon name="sparkle" size={14} /> Season prediction
            </p>
            <h1 className="max-w-3xl text-2xl leading-[1.12] sm:text-4xl xl:text-5xl">Travel when the weather is on your side</h1>
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/75 sm:mt-3 sm:line-clamp-none sm:text-base">
              Every destination is scored for each month using typical temperature, rainfall, crowds and prices.
              Pick a month to see the best places, or pick a place to see its best months.
            </p>
          </div>
          <div className="rise hidden grid-cols-3 gap-3 text-center lg:grid" style={{ "--i": 2 }}>
            {[["12", "months scored"], ["4", "factors weighed"], ["100", "point score"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                <p className="font-display text-3xl font-semibold text-accent">{n}</p>
                <p className="mt-1 text-xs text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="page relative pb-0">
          <div className="flex w-full rounded-t-2xl bg-surface p-1 sm:inline-flex sm:w-auto sm:p-1.5" role="tablist" aria-label="Season planner mode">
            {tabs.map(([key, label, icon]) => (
              <button key={key} role="tab" aria-selected={tab === key}
                onClick={() => { setTab(key); if (key === "where") setParams({}); }}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition sm:flex-none sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${tab === key ? "bg-navy text-white shadow" : "text-slate-600 hover:text-navy"}`}>
                <Icon name={icon} size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {tab === "where" ? <WhereToGo month={month} setMonth={setMonth} /> : <WhenToGo initialSlug={initialSlug} />}

      <p className="page mt-14 text-xs text-muted">
        Predictions use typical yearly weather patterns, not a live forecast. Check the forecast and any local advisories
        a few days before you travel.
      </p>
    </>
  );
}
