import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import Cover from "../components/Cover.jsx";
import Icon from "../components/Icon.jsx";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const FIELDS = [
  ["travel", "Travel", "car"], ["accommodation", "Stay & accommodation", "bed"],
  ["food", "Food & drinks", "coffee"], ["entry_fees", "Entry fees", "ticket"],
  ["other", "Other expenses", "wallet"],
];

export default function Budget() {
  const bannerImg = useBanner("budget");
  const [form, setForm] = useState({ travelers: 2, days: 3, travel: 2000, accommodation: 3000, food: 1500, entry_fees: 0, other: 1000 });
  const [result, setResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationMode, setRecommendationMode] = useState("match");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState("");
  const [recommendationError, setRecommendationError] = useState("");

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const liveTotal = useMemo(() => FIELDS.reduce((sum, [key]) => sum + Math.max(0, Number(form[key]) || 0), 0), [form]);
  const perPersonDay = result ? Number(result.total) / (Number(result.travelers) * Number(result.days)) : 0;

  const calculate = async (event) => {
    event.preventDefault();
    setError(""); setRecommendationError(""); setRecommendations([]); setLoadingRecommendations(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
      const { data } = await api.post("/budget/calculate/", payload);
      setResult(data);
      const dailyLimit = Number(data.total) / (Number(data.travelers) * Number(data.days));
      try {
        const response = await api.get("/destinations/", { params: { page_size: 100 } });
        const destinations = Array.isArray(response.data) ? response.data : (response.data.results || []);
        const priced = destinations.filter((item) => Number(item.avg_daily_budget) > 0).map((item) => ({
          ...item, budgetDifference: Number(item.avg_daily_budget) - dailyLimit,
        }));
        const affordable = priced.filter((item) => item.budgetDifference <= 0).sort((a, b) => Number(b.avg_daily_budget) - Number(a.avg_daily_budget));
        if (affordable.length) { setRecommendations(affordable.slice(0, 6)); setRecommendationMode("match"); }
        else { priced.sort((a, b) => Math.abs(a.budgetDifference) - Math.abs(b.budgetDifference)); setRecommendations(priced.slice(0, 3)); setRecommendationMode("stretch"); }
      } catch { setRecommendationError("Your budget is ready, but destination suggestions could not be loaded. Please try again."); }
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoadingRecommendations(false); }
  };

  return (
    <>
      <section className="budget-hero hero-bg text-white" style={bannerStyle(bannerImg)}>
        <div className="page relative py-6 sm:py-14">
          <span className="eyebrow !text-amber-200">Travel smarter</span>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">A memorable trip starts with a smart budget.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">Plan your group expenses, understand the cost per traveller, and discover South Indian destinations that fit your budget.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-white/75 sm:text-sm">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">01 · Add your expenses</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">02 · Get your estimate</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">03 · Find your destination</span>
          </div>
        </div>
      </section>

      <section className="page budget-workspace py-4 sm:py-10">
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
          <div className="min-w-0"><p className="eyebrow !text-[11px]">Your trip planner</p><h2 className="mt-1 text-xl font-semibold leading-tight text-navy sm:mt-2 sm:text-3xl">Build your budget</h2><p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">Amounts are for your entire group.</p></div>
          <div className="shrink-0 rounded-xl border border-line bg-white px-3 py-2 text-right shadow-sm sm:rounded-2xl sm:px-4 sm:py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs">Live estimate</p><p className="text-lg font-bold leading-tight text-brand-dark sm:text-xl">{rupee(liveTotal)}</p></div>
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={calculate} className="budget-panel card flex flex-col p-3 sm:p-6 lg:p-7">
            <div className="mb-3 flex items-center gap-2.5 sm:mb-6 sm:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand-dark sm:h-11 sm:w-11 sm:rounded-2xl"><Icon name="wallet" size={19}/></span><div><h3 className="font-semibold text-navy">Trip details & expenses</h3><p className="text-xs text-muted">Adjust the values to match your plan</p></div></div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <label className="budget-field"><span className="label">Travellers</span><span className="field-icon"><Icon name="users" size={17}/></span><input type="number" min="1" max="100" required className="input !py-2 pl-10 sm:!py-2.5" value={form.travelers} onChange={set("travelers")}/></label>
              <label className="budget-field"><span className="label">Trip duration (days)</span><span className="field-icon"><Icon name="calendar" size={17}/></span><input type="number" min="1" max="365" required className="input !py-2 pl-10 sm:!py-2.5" value={form.days} onChange={set("days")}/></label>
            </div>
            <div className="my-3 border-t border-line sm:my-6"/><div className="mb-2 sm:mb-3"><h4 className="text-sm font-semibold text-navy">Estimated group expenses</h4><p className="text-xs text-muted">Enter ₹0 if an expense does not apply.</p></div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 [&>label:last-child:nth-child(odd)]:col-span-2">
              {FIELDS.map(([key, label, icon]) => <label key={key} className="budget-field"><span className="label">{label} <span className="font-normal text-muted">(₹)</span></span><span className="field-icon"><Icon name={icon} size={17}/></span><input type="number" min="0" step="1" required className="input !py-2 pl-10 sm:!py-2.5" value={form[key]} onChange={set(key)}/></label>)}
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="mt-auto" />
            <button className="btn-primary mt-4 min-h-11 w-full !rounded-xl !text-sm sm:mt-6 sm:min-h-12 sm:!text-base" disabled={loadingRecommendations}><Icon name="sparkles" size={18}/>{loadingRecommendations ? "Calculating your trip…" : "Calculate & find destinations"}</button>
            <p className="mt-2 text-center text-[11px] text-muted sm:mt-3 sm:text-xs">You can change these values and calculate again anytime.</p>
          </form>

          <aside className="budget-panel card flex flex-col overflow-hidden">
            <div className="bg-surface p-3.5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Your budget summary</p><h3 className="mt-1 text-lg font-semibold text-navy">Estimated trip cost</h3></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-dark"><Icon name="chart" size={20}/></span></div>
              {result ? <><p className="mt-2 text-3xl font-bold tracking-tight text-navy sm:mt-4 sm:text-5xl">{rupee(result.total)}</p><p className="mt-1 text-sm text-muted">For {result.travelers} travellers · {result.days} days</p></> : <><p className="mt-2 text-2xl font-bold text-navy sm:mt-5 sm:text-3xl">{rupee(liveTotal)}</p><p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">Live estimate · calculate for details</p></>}
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-5">
              <div className="rounded-xl border border-line p-2.5 sm:rounded-2xl sm:p-4"><p className="text-xs text-muted">Per person</p><p className="mt-0.5 text-lg font-bold text-navy sm:mt-1 sm:text-xl">{result ? rupee(result.per_person) : rupee(liveTotal / Math.max(1, Number(form.travelers)))}</p></div>
              <div className="rounded-xl border border-line p-2.5 sm:rounded-2xl sm:p-4"><p className="text-xs text-muted">Per person / day</p><p className="mt-0.5 text-lg font-bold text-brand-dark sm:mt-1 sm:text-xl">{result ? rupee(perPersonDay) : rupee(liveTotal / (Math.max(1, Number(form.travelers)) * Math.max(1, Number(form.days))))}</p></div>
            </div>
            <div className="flex-1 px-3 pb-3.5 sm:px-5 sm:pb-5"><div className="mb-2 flex items-center justify-between sm:mb-3"><h4 className="text-sm font-semibold text-navy">Expense breakdown</h4><span className="text-xs text-muted">Group total</span></div><div className="space-y-2.5 sm:space-y-4">{FIELDS.map(([key, label]) => { const value = result ? Number(result.breakdown[key]) : Number(form[key] || 0); const total = result ? Number(result.total) : liveTotal; const percent = total > 0 ? value / total * 100 : 0; return <div key={key}><div className="mb-1 flex justify-between gap-3 text-[13px] sm:mb-1.5 sm:text-sm"><span className="text-muted">{label}</span><span className="font-semibold tabular-nums text-ink">{rupee(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }}/></div></div>; })}</div></div>
            {result && <div className="border-t border-line bg-brand/5 px-4 py-4 text-sm sm:px-5"><div className="flex items-center justify-between gap-3"><span className="text-muted">Recommended daily budget</span><strong className="text-brand-dark">{rupee(perPersonDay)} / person</strong></div></div>}
          </aside>
        </div>
      </section>

      {result && <section id="budget-recommendations" className="page pb-14 sm:pb-20">
        <div className="mb-6 rounded-3xl bg-navy px-5 py-6 text-white sm:px-7 sm:py-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow !text-orange-200">Made around your budget</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Places you might love</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/70">We compare your per-person daily budget with destination estimates to find suitable places across South India.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-xs text-white/65">Your daily allowance</p><p className="text-2xl font-bold">{rupee(perPersonDay)}<span className="text-xs font-medium text-white/70"> / person</span></p></div></div></div>
        {loadingRecommendations ? <div className="card p-8 text-center text-muted">Finding destinations that fit your budget…</div> : recommendationError ? <div role="alert" className="card p-6 text-sm text-red-600">{recommendationError}</div> : recommendations.length === 0 ? <div className="card p-8 text-center"><h3 className="font-semibold text-navy">Recommendations are coming soon</h3><p className="mt-2 text-sm text-muted">Our destination catalogue needs daily budget estimates to suggest places.</p></div> : <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-muted">{recommendationMode === "match" ? `${recommendations.length} destinations match your estimated budget` : "These are the closest budget alternatives"}</p><span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark">{recommendationMode === "match" ? "Within budget" : "Consider stretching your budget"}</span></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recommendations.map((destination, index) => <Link key={destination.id} to={`/destinations/${destination.slug}`} className="destination-recommendation group overflow-hidden rounded-3xl border border-line bg-white shadow-sm"><div className="relative aspect-[16/10] overflow-hidden bg-sand"><div className="h-full transition duration-700 group-hover:scale-105"><Cover name={destination.name} src={destination.cover_image}/></div><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-dark shadow-sm">{recommendationMode === "match" ? "Good budget match" : "Closest match"}</span><span className="absolute right-3 top-3 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-semibold text-white">#{index + 1} pick</span></div><div className="p-5"><h3 className="text-xl font-semibold text-navy">{destination.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Icon name="pin" size={14}/>{[destination.city_name, destination.state_name].filter(Boolean).join(", ")}</p>{destination.short_description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{destination.short_description}</p>}<div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4"><div><p className="text-xs text-muted">Estimated / person / day</p><p className="mt-0.5 text-xl font-bold text-brand-dark">{rupee(destination.avg_daily_budget)}</p></div><span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark">Explore <Icon name="arrow" size={16}/></span></div></div></Link>)}</div>
        </>}
      </section>}
    </>
  );
}
