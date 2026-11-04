import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import DestinationCard from "../components/DestinationCard.jsx";
import Cover from "../components/Cover.jsx";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider.jsx";
import { useBanners } from "../components/useBanner.js";
import SeasonPicks from "../components/SeasonPicks.jsx";
import Icon, { categoryIcon } from "../components/Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const BUDGETS = [
  [1500, "Up to ₹1,500"],
  [2500, "Up to ₹2,500"],
  [3500, "Up to ₹3,500"],
  [5000, "Up to ₹5,000"],
];

const TRUST = [
  { icon: "shield", t: "Fees you can trust", d: "Entry fees show when last verified." },
  { icon: "compass", t: "Real attractions", d: "Timings, fees and maps for each stop." },
  { icon: "calendar", t: "Day-wise planner", d: "Day-by-day plans with stay and food." },
  { icon: "wallet", t: "Budget in view", d: "Estimate group costs and track spend." },
];

const PLAN_STEPS = [
  { icon: "compass", t: "Discover", d: "Browse hill stations, temples, beaches and backwaters with fees, timings and the best time to visit.", to: "/explore", cta: "Browse destinations" },
  { icon: "calendar", t: "Plan day by day", d: "Pick dates and travelers to see a full plan with costs, then confirm it by email.", to: "/trips/new", cta: "Plan a trip" },
  { icon: "wallet", t: "Know your budget", d: "Estimate group costs up front and track what you spend on each trip.", to: "/budget", cta: "Try the calculator" },
];

// Tile layout for the "by state" grid when there are exactly five states (the seeded data).
const BENTO = [
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
];
const TILE_TONES = [
  "from-[#c2762b] to-[#3b2417]",
  "from-[#f2b84b] to-[#7a4a12]",
  "from-[#9a5b2a] to-[#2b1a10]",
  "from-[#d89a4f] to-[#4a2c18]",
  "from-[#6b4a35] to-[#3b2417]",
];

const FAN_POS = [
  { t: "translate(-6%, 26px) rotate(-9deg)", d: "0.25s", z: "z-0", size: "h-72 w-52" },
  { t: "translate(0, 0) rotate(0deg)", d: "0s", z: "z-10", size: "h-[22rem] w-64" },
  { t: "translate(6%, 34px) rotate(8deg)", d: "0.4s", z: "z-0", size: "h-72 w-52" },
];

const FIELD = "flex min-w-0 flex-col gap-0 rounded-xl px-3 py-1.5 sm:gap-0.5 sm:rounded-2xl sm:px-4 sm:py-2.5 transition focus-within:bg-surface hover:bg-surface";
const CONTROL = "w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400";
const FIELD_LABEL = "flex items-center gap-1 text-[11px] font-semibold text-navy sm:gap-1.5 sm:text-xs";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(null);
  const [heroPicks, setHeroPicks] = useState([]);
  const [banner, setBanner] = useState([]);
  // Photos uploaded in Admin > Banners win over the destination covers.
  const adminBanners = useBanners("home");

  const [tab, setTab] = useState("all"); // "all" | "featured" | a category slug
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");

  const [f, setF] = useState({ q: "", state: "", category: "", max_budget: "" });

  useEffect(() => {
    api.get("/destinations/", { params: { page_size: 1 } })
      .then((r) => setTotal(r.data.count)).catch(() => {});
    api.get("/states/").then((r) => setStates(r.data)).catch(() => {});
    api.get("/categories/").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingList(true);
    setError("");
    const params = { page_size: 8, ordering: "-avg_rating" };
    if (tab === "featured") params.featured = true;
    else if (tab !== "all") params.category = tab;
    api.get("/destinations/", { params })
      .then((r) => setList(r.data.results))
      .catch(() => setError("Could not load destinations. Is the backend running?"))
      .finally(() => setLoadingList(false));
  }, [tab]);

  // Hero cards always come from featured places, whichever tab is open below.
  useEffect(() => {
    api.get("/destinations/", { params: { featured: true, page_size: 8 } })
      .then((r) => {
        // Prefer destinations that have a photo for the hero cards.
        const covered = [...r.data.results].sort((a, b) => Number(!!b.cover_image) - Number(!!a.cover_image));
        setHeroPicks(covered.slice(0, 3));
        setBanner(
          covered.filter((d) => d.cover_image).slice(0, 6)
            .map((d) => ({ id: d.id, src: d.cover_image, name: d.name, place: d.state_name, to: `/destinations/${d.slug}` })),
        );
      })
      .catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (f.q.trim()) p.set("search", f.q.trim());
    if (f.state) p.set("state", f.state);
    if (f.category) p.set("category", f.category);
    if (f.max_budget) p.set("max_budget", f.max_budget);
    const qs = p.toString();
    navigate(`/explore${qs ? `?${qs}` : ""}`);
  };

  // Strongest card in the middle of the fan.
  const fan = heroPicks.length === 3 ? [heroPicks[1], heroPicks[0], heroPicks[2]] : [];

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden bg-slate-800 text-white">
        <HeroSlider slides={adminBanners.length
          ? adminBanners.map((b) => ({ id: `b${b.id}`, src: b.src, name: b.caption || "", place: "", to: "/explore" }))
          : banner} />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" aria-hidden="true" />

        <div className="page relative z-10 grid items-center gap-10 pb-14 pt-5 sm:pb-28 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-36">
          <div>
            <h1 className="max-w-xl text-2xl leading-[1.12] sm:text-5xl lg:text-[3.25rem]">
              Discover South India, one destination at a time.
            </h1>
            <p className="mt-3 line-clamp-3 max-w-lg text-[15px] leading-relaxed text-white/80 sm:mt-5 sm:line-clamp-none sm:text-lg">
              Check entry fees and timings, build day-wise itineraries and estimate your budget for
              Tamil Nadu, Kerala, Karnataka, Andhra Pradesh and Telangana.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              <Link to="/explore" className="btn-accent !px-4 !py-2.5 !text-sm sm:!px-6 sm:!py-3 sm:!text-base">
                Explore destinations <Icon name="arrow" size={18} />
              </Link>
              <Link to="/budget" className="btn-ghost !px-4 !py-2.5 !text-sm sm:!px-6 sm:!py-3 sm:!text-base">Budget calculator</Link>
            </div>
          </div>

          {fan.length === 3 && (
            <div className="relative hidden h-[27rem] items-center justify-center lg:ml-8 lg:flex" aria-label="Featured destinations">
              {fan.map((d, i) => (
                <Link
                  key={d.id} to={`/destinations/${d.slug}`}
                  style={{ "--t": FAN_POS[i].t, "--d": FAN_POS[i].d }}
                  className={`fan-card relative -mx-4 shrink-0 overflow-hidden rounded-3xl border-4 border-white/90 shadow-2xl ${FAN_POS[i].z} ${FAN_POS[i].size}`}
                >
                  <Cover name={d.name} src={d.cover_image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-xl font-semibold">{d.name}</p>
                    <p className="text-xs text-white/80">{d.city_name}, {d.state_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Search card ---------------- */}
      <section className="page relative z-10 -mt-10 lg:-mt-20">
        <form
          onSubmit={submit}
          className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-[0_14px_40px_rgba(59,36,23,0.18)] sm:rounded-3xl sm:p-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-center"
        >
          <label className={`${FIELD} col-span-2 sm:col-span-1`}>
            <span className={FIELD_LABEL}><Icon name="pin" size={13} /> Where to?</span>
            <input className={CONTROL} placeholder="A place, city or state" value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })} />
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}><Icon name="map" size={14} /> State</span>
            <select className={CONTROL} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>
              <option value="">Any state</option>
              {states.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </select>
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}><Icon name="compass" size={14} /> Type of trip</span>
            <select className={CONTROL} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">Anything</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className={`${FIELD} col-span-2 sm:col-span-1`}>
            <span className={FIELD_LABEL}><Icon name="wallet" size={14} /> Daily budget</span>
            <select className={CONTROL} value={f.max_budget} onChange={(e) => setF({ ...f, max_budget: e.target.value })}>
              <option value="">Any budget</option>
              {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <button className="btn-primary col-span-2 !rounded-xl !px-6 !py-2.5 sm:!rounded-2xl sm:!px-7 sm:!py-4 lg:col-span-1">
            <Icon name="search" size={18} /> Search
          </button>
        </form>
      </section>

      {/* ---------------- Trust strip ---------------- */}
      <section className="page pt-5 sm:pt-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {TRUST.map((t, i) => (
            <div key={t.t} className="rise flex items-start gap-2.5 bg-white p-3 sm:p-4" style={{ "--i": i }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-brand-dark">
                <Icon name={t.icon} size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight text-navy sm:text-sm">{t.t}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted sm:text-xs">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Best time to travel ---------------- */}
      <SeasonPicks />

      {/* ---------------- Popular destinations ---------------- */}
      <section className="page pt-6 sm:pt-12">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-6">
          <div>
            <h2 className="h-section">Popular destinations</h2>
            <p className="mt-1 text-muted">Hand-picked places to start with.</p>
          </div>
          <Link to={tab !== "all" && tab !== "featured" ? `/explore?category=${tab}` : "/explore"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
            View all <Icon name="arrow" size={16} />
          </Link>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1 sm:mb-5 sm:flex sm:flex-wrap sm:gap-2" role="tablist" aria-label="Destination type">
          {[{ id: "all", slug: "all", name: "All", icon: "compass" },
            { id: "featured", slug: "featured", name: "Featured", icon: "star" }, ...categories].map((c) => {
            const active = tab === c.slug;
            return (
              <button
                key={c.id} role="tab" aria-selected={active} onClick={() => setTab(c.slug)}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1.5 text-[10px] font-semibold leading-tight transition duration-200 active:scale-95 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? "border-navy bg-navy text-white shadow-md"
                    : "border-line bg-white text-muted hover:border-brand hover:text-brand-dark"
                }`}
              >
                <Icon name={c.icon || categoryIcon(c.name)} size={14} />
                <span className="max-w-full truncate">{c.name}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
          {loadingList
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 w-[62vw] max-w-[15rem] shrink-0 animate-pulse rounded-2xl bg-sand sm:w-auto sm:max-w-none" />
              ))
            : list.map((d, idx) => (
                <div key={d.id} className="w-[62vw] max-w-[15rem] shrink-0 snap-start sm:w-auto sm:max-w-none ">
                  <DestinationCard d={d} i={idx} />
                </div>
              ))}
        </div>
        {!loadingList && !error && list.length === 0 && (
          <div className="card p-10 text-center text-muted">
            Nothing here yet. <Link to="/explore" className="font-semibold text-brand-dark">Browse all destinations</Link>
          </div>
        )}
      </section>

      {/* ---------------- By state: auto-scrolling row ---------------- */}
      {states.length > 0 && (
        <section className="pt-6 sm:pt-12">
          <div className="page mb-4">
            <h2 className="h-section">Explore by state</h2>
            <p className="mt-1 text-sm text-muted sm:text-base">Each state has its own food, festivals and landscapes.</p>
          </div>
          <div className="marquee">
            <div className="marquee-track" style={{ animationDuration: `${Math.max(states.length, 3) * 7}s` }}>
              {[...states, ...states].map((s, i) => (
                <Link
                  key={`${s.id}-${i}`} to={`/explore?state=${s.slug}`} aria-hidden={i >= states.length ? "true" : undefined}
                  tabIndex={i >= states.length ? -1 : undefined}
                  className={`state-card group relative isolate flex h-40 w-64 shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-md sm:h-44 sm:w-72 ${TILE_TONES[(i % states.length) % TILE_TONES.length]}`}
                >
                  {s.image ? (
                    <>
                      <img src={s.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <span className="pointer-events-none absolute -right-3 -top-6 -z-10 select-none text-[8rem] font-black leading-none text-white/10 transition duration-500 group-hover:scale-110 group-hover:text-white/20" aria-hidden="true">
                        {s.name?.[0]}
                      </span>
                      <span className="state-glow absolute inset-0 -z-10" aria-hidden="true" />
                    </>
                  )}
                  <h3 className="text-xl font-bold leading-tight">{s.name}</h3>
                  {s.description && <p className="mt-1 line-clamp-2 text-xs text-white/80">{s.description}</p>}
                  <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                    Explore
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-navy transition duration-300 group-hover:translate-x-1">
                      <Icon name="arrow" size={12} />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Plan your trip (compact) ---------------- */}
      <section className="page pt-6 sm:pt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="h-section">Plan the whole trip in one place</h2>
            <p className="mt-1 text-sm text-muted sm:text-base">From the first idea to the last rupee spent.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLAN_STEPS.map((s, i) => (
            <Link key={s.t} to={s.to} className="rise group flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md" style={{ "--i": i }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-brand-dark">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-navy">{s.t}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{s.d}</span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">
                  {s.cta} <Icon name="arrow" size={13} className="transition group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Closing banner ---------------- */}
      <section className="page pt-6 sm:pt-12">
        <div className="relative isolate grid overflow-hidden rounded-3xl bg-navy text-white md:grid-cols-5">
          <CtaPicture className="relative min-h-[150px] md:col-span-2 md:min-h-0" />
          <div className="p-6 sm:p-9 md:col-span-3">
            <h2 className="text-2xl leading-tight sm:text-3xl">
              {user ? "Pick up where you left off" : "Save places and plan trips for free"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/75 sm:text-base">
              {user
                ? "Your saved places and itineraries are waiting in your trip planner."
                : "Create an account to get a full trip plan with costs, save favourites and receive booking confirmations by email."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {user ? (
                <Link to="/trips" className="btn-accent !px-5 !py-2.5">Open my trips</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-accent !px-5 !py-2.5">Create free account</Link>
                  <Link to="/login" className="btn-ghost !px-5 !py-2.5">Log in</Link>
                </>
              )}
            </div>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-4 border-t border-white/15 pt-4">
              {[["Destinations", total], ["States", states.length || null], ["Trip types", categories.length || null]].map(([l, v]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-accent">{v ?? "-"}</p>
                  <p className="text-xs text-white/70">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// Closing-banner picture. Put your photo at frontend/public/cta.webp (or .jpg/.png named cta.webp);
// until it exists a warm cookie-coloured illustration is shown instead.
function CtaPicture({ className = "" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`overflow-hidden bg-gradient-to-br from-[#c2762b] via-[#8a4f1a] to-[#3b2417] ${className}`}>
      {!failed ? (
        <img src="/cta.webp" alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="290" cy="80" r="34" fill="#f2b84b" opacity="0.95" />
          <circle cx="290" cy="80" r="58" fill="#f2b84b" opacity="0.18" />
          <path d="M0 240V150q70-60 140-20t110-25q70-35 150 25V240z" fill="#fff" opacity="0.12" />
          <path d="M0 240V185q90-45 170-5t120-15q60-15 110 20V240z" fill="#2b1a10" opacity="0.45" />
        </svg>
      )}
    </div>
  );
}
