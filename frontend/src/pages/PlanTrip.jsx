import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PlanView, { fmtDate, rupee } from "../components/PlanView.jsx";
import Icon from "../components/Icon.jsx";
import PageBanner from "../components/PageBanner.jsx";

const iso = (d) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};
const today = () => iso(new Date());
const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

const STYLES = [
  ["budget", "Budget", "Simple rooms, local food, shared transport"],
  ["standard", "Standard", "Comfortable hotels and restaurants"],
  ["comfort", "Comfort", "Better hotels, private cab"],
];
const QUICK = [[2, "Weekend (2 days)"], [3, "3 days"], [5, "5 days"], [7, "1 week"]];

function Steps({ step }) {
  const items = ["Trip details", "Review plan", "Confirm"];
  return (
    <ol className="mt-5 flex items-center gap-2 text-sm" aria-label="Progress">
      {items.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              done ? "bg-brand text-white" : active ? "bg-navy text-white" : "bg-sand text-muted"}`}>
              {done ? <Icon name="check" size={14} /> : n}
            </span>
            <span className={active ? "font-semibold text-navy" : "text-muted"}>{label}</span>
            {n < items.length && <span className="mx-1 h-px w-6 bg-line sm:w-10" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function PlanTrip() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [form, setForm] = useState({
    destination: params.get("destination") || "", start_date: "", end_date: "",
    num_travelers: 1, style: "budget",
  });
  const [plan, setPlan] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const planRef = useRef(null);
  const confirmRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    api.get("/destinations/", { params: { page_size: 100 } })
      .then((r) => setDestinations(r.data.results)).catch(() => {});
  }, []);

  // Lock page scroll and move focus into the confirmation dialog while it is open.
  useEffect(() => {
    if (!booking) return undefined;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, [booking]);

  const payload = (f) => ({ ...f, num_travelers: Number(f.num_travelers) });

  const fetchPlan = async (f, { scroll = true } = {}) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/bookings/preview/", payload(f));
      setPlan(data);
      if (scroll) setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setPlan(null);
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  // Changing a detail makes the shown plan out of date, so hide it.
  const change = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setPlan(null);
    setError("");
    setConfirmError("");
  };

  const setStyle = (style) => {
    const next = { ...form, style };
    setForm(next);
    setConfirmError("");
    if (plan) fetchPlan(next, { scroll: false }); // keep the plan on screen and refresh the prices
  };

  const setTravelers = (n) => change({ num_travelers: Math.min(20, Math.max(1, n)) });
  const quickDays = (n) => {
    if (!form.start_date) return;
    change({ end_date: addDays(form.start_date, n - 1) });
  };
  const onStart = (e) => {
    const start = e.target.value;
    const patch = { start_date: start };
    if (form.end_date && form.end_date < start) patch.end_date = start;
    change(patch);
  };

  const showPlan = (e) => { e.preventDefault(); fetchPlan(form); };

  const confirm = async () => {
    setConfirmError("");
    setBusy(true);
    try {
      const { data } = await api.post("/bookings/", { ...payload(form), email });
      setBooking(data);
    } catch (err) {
      setConfirmError(
        err?.response?.status === 429
          ? "You have confirmed several bookings in a short time. Please wait a little and try again."
          : errorMessage(err, "We could not confirm your booking. Please try again.")
      );
    } finally { setBusy(false); }
  };

  const reset = () => {
    setBooking(null);
    setPlan(null);
    setForm({ destination: "", start_date: "", end_date: "", num_travelers: 1, style: "budget" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const step = booking ? 3 : plan ? 2 : 1;
  const tripDays = form.start_date && form.end_date ? daysBetween(form.start_date, form.end_date) : null;
  const destName = destinations.find((d) => String(d.id) === String(form.destination))?.name;
  const inputCls = "input";

  return (
    <>
    <PageBanner title="Plan your trip" subtitle="Choose where, when and how many people. We show a day-by-day plan with the total cost. Nothing is saved until you confirm, and no payment is taken." />
    <div className={`page py-10 ${plan ? "pb-28 lg:pb-10" : ""}`}>
      <Link to="/trips" className="text-sm text-muted hover:text-brand-dark">← My trips</Link>
      <Steps step={step} />

      <form onSubmit={showPlan} className="card mt-6 space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label" htmlFor="dest">Where to?</label>
            <select id="dest" className={inputCls} required value={form.destination}
              onChange={(e) => change({ destination: e.target.value })}>
              <option value="">Choose a destination</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.state_name})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="from">From</label>
            <input id="from" type="date" className={inputCls} required min={today()}
              value={form.start_date} onChange={onStart} />
          </div>
          <div>
            <label className="label" htmlFor="to">To</label>
            <input id="to" type="date" className={inputCls} required min={form.start_date || today()}
              value={form.end_date} onChange={(e) => change({ end_date: e.target.value })} />
          </div>
          <div>
            <span className="label">Travelers</span>
            <div className="flex items-center rounded-xl border border-line bg-white">
              <button type="button" aria-label="Fewer travelers" className="px-3.5 py-2.5 text-lg text-brand-dark disabled:text-slate-300"
                disabled={form.num_travelers <= 1} onClick={() => setTravelers(Number(form.num_travelers) - 1)}>−</button>
              <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{form.num_travelers}</span>
              <button type="button" aria-label="More travelers" className="px-3.5 py-2.5 text-lg text-brand-dark disabled:text-slate-300"
                disabled={form.num_travelers >= 20} onClick={() => setTravelers(Number(form.num_travelers) + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">
            {form.start_date ? "Trip length:" : "Pick a start date, then choose a length:"}
          </span>
          {QUICK.map(([n, label]) => (
            <button type="button" key={n} disabled={!form.start_date} onClick={() => quickDays(n)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40 ${
                tripDays === n ? "border-brand bg-brand/10 text-brand-dark" : "border-line bg-white text-slate-600 hover:border-brand"}`}>
              {label}
            </button>
          ))}
          {tripDays && <span className="ml-1 text-xs text-muted">{tripDays} day{tripDays > 1 ? "s" : ""} selected</span>}
        </div>

        <fieldset>
          <legend className="label">Travel style</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {STYLES.map(([key, label, desc]) => (
              <button type="button" key={key} onClick={() => setStyle(key)} aria-pressed={form.style === key}
                className={`rounded-xl border p-3 text-left transition ${
                  form.style === key ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-line bg-white hover:border-brand"}`}>
                <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                  {label}
                  {key === "budget" && <span className="badge bg-accent-soft text-navy">Cheapest</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted">{desc}</p>
              </button>
            ))}
          </div>
        </fieldset>

        <button className="btn-primary w-full sm:w-auto sm:px-10" disabled={busy}>
          {busy && !plan ? "Preparing your plan..." : "Show my plan"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p>}

      {plan && (
        <section ref={planRef} className="mt-10 scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy">Your plan for {plan.destination.name}</h2>
              <p className="text-sm text-muted">
                {fmtDate(plan.start_date)} to {fmtDate(plan.end_date)} · {plan.num_days} day{plan.num_days > 1 ? "s" : ""} · {plan.travelers} traveler{plan.travelers > 1 ? "s" : ""}
              </p>
            </div>
            <button type="button" className="btn-outline !py-2"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Change details</button>
          </div>
          <PlanView plan={plan} />

          <div ref={confirmRef} className="card mt-8 scroll-mt-24 p-6">
            <h3 className="font-semibold text-navy">Confirm your booking</h3>
            <p className="mb-4 text-sm text-muted">
              This saves the plan to My Trips and emails you a copy. No payment is taken.
            </p>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="label" htmlFor="email">Send the confirmation to</label>
                <input id="email" type="email" className="input max-w-md" required value={email}
                  onChange={(e) => { setEmail(e.target.value); setConfirmError(""); }} placeholder="you@example.com" />
              </div>
              <button className="btn-accent !px-8 !py-3" onClick={confirm} disabled={busy || !email}>
                {busy ? "Confirming..." : `Confirm booking · ${rupee(plan.summary.total)}`}
              </button>
            </div>
            {confirmError && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{confirmError}</p>
            )}
          </div>

          {/* Mobile: the total and confirm button stay in reach while scrolling the plan. */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
            <div>
              <p className="text-xs text-muted">Estimated total</p>
              <p className="text-lg font-bold text-navy">{rupee(plan.summary.total)}</p>
            </div>
            <button type="button" className="btn-accent"
              onClick={() => confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              Review and confirm
            </button>
          </div>
        </section>
      )}

      {booking && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="done-title"
            className="card w-full max-w-md p-8 text-center shadow-2xl outline-none">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
              <Icon name="check" size={32} />
            </span>
            <h2 id="done-title" className="mt-4 font-display text-3xl font-semibold text-navy">Booking confirmed!</h2>
            <p className="mt-2 text-muted">
              {booking.destination_name} · {fmtDate(booking.start_date)} to {fmtDate(booking.end_date)}
            </p>
            <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm">
              Reference <b className="text-navy">{booking.reference}</b> · Total <b className="text-navy">{rupee(booking.total_amount)}</b>
            </p>
            <p className="mt-4 text-sm text-ink" role="status">
              {booking.email_sent
                ? <>We have sent your confirmation and full plan to <b>{booking.email}</b>.</>
                : <>Your booking is saved, but we could not send the email just now. Please note your reference <b>{booking.reference}</b>. The full plan is always in My Trips.</>}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to={`/trips/${booking.id}`} className="btn-primary">View my plan</Link>
              <Link to="/trips" className="btn-outline">All my trips</Link>
              <button type="button" onClick={reset} className="text-sm font-semibold text-brand-dark hover:underline">
                Plan another trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
