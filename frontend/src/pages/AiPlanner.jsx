import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import Cover from "../components/Cover.jsx";
import Icon from "../components/Icon.jsx";
import { canSpeak, useSpeaker, useVoiceInput } from "../hooks/useVoice.js";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const inr = (n) => (n || n === 0 ? `\u20b9${Number(n).toLocaleString("en-IN")}` : "n/a");
// What "Listen" reads out for one prediction.
const spoken = (r) => [
  `${r.destination.name}, ${r.destination.city_name}, ${r.destination.state_name}.`,
  `Match score ${r.match} out of 100, ${r.confidence} confidence.`,
  `In ${r.month_name}: ${r.season_label}, about ${r.temp_c} degrees, crowds ${String(r.crowd_label).toLowerCase()}.`,
  r.daily_budget ? `Daily cost about ${r.daily_budget} rupees.` : "",
  r.total_low ? `Trip total ${r.total_low} to ${r.total_high} rupees.` : "",
  ...r.reasons.map((x) => `${x}.`),
  r.tip ? `Tip: ${r.tip}` : "",
].filter(Boolean).join(" ");
const TONE = { High: "bg-emerald-50 text-emerald-700", Medium: "bg-amber-50 text-amber-700", Low: "bg-slate-100 text-slate-600" };

export default function AiPlanner() {
  const bannerImg = useBanner("ai_planner");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const voice = useVoiceInput({ onText: (t) => setQuery(t.slice(0, 500)), onDone: (t) => run(t) });
  const { speakingId, speak, stop } = useSpeaker();

  const run = async (text) => {
    const q = (text ?? query).trim();
    if (q.length < 3) return;
    stop(); voice.clearNote();
    setQuery(q); setBusy(true); setError("");
    try { setData((await api.post("/ai/trip-match/", { query: q })).data); }
    catch (err) { setData(null); setError(errorMessage(err, "Could not get predictions. Please try again.")); }
    finally { setBusy(false); }
  };

  const u = data?.understood;
  const chips = u && [
    ["calendar", u.month_names.length > 2 ? "Whole season" : u.month_names.join(", ")],
    ["trip", `${u.days} days`], ["users", `${u.travelers} traveler${u.travelers > 1 ? "s" : ""}`],
    u.budget_per_day && ["wallet", `Up to ${inr(u.budget_per_day)}/day`],
    u.category && ["compass", u.category], u.state && ["pin", u.state],
  ].filter(Boolean);

  return (
    <>
      <section className="hero-bg text-white" style={bannerStyle(bannerImg)}>
        <div className="page py-4 sm:py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Icon name="sparkles" size={14} /> AI Trip Matcher
          </span>
          <h1 className="mt-2 max-w-3xl text-xl font-bold leading-tight sm:mt-3 sm:text-4xl">Describe your trip. We predict the best place, month and cost.</h1>
          <p className="mt-1 max-w-2xl text-xs text-white/75 sm:mt-2 sm:text-base">Type or speak it, like telling a friend. We read your dates, group size and budget.</p>
          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-3 flex max-w-3xl flex-col gap-1.5 rounded-2xl bg-white p-1.5 shadow-xl sm:mt-5 sm:flex-row sm:items-center sm:gap-2 sm:p-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={500}
                placeholder={voice.listening ? "Listening..." : "e.g. 4 days in December, family of 4"}
                className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2 text-sm text-ink outline-none sm:py-3 sm:text-base placeholder:text-slate-400 sm:px-4" aria-label="Describe your trip" />
              <button type="button" onClick={voice.toggle} disabled={busy} aria-pressed={voice.listening}
                aria-label={voice.listening ? "Stop voice input" : "Speak your trip"} title={voice.listening ? "Stop" : "Speak"}
                className={`relative flex h-9 w-9 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-full transition disabled:opacity-50 ${
                  voice.listening ? "bg-red-500 text-white" : "bg-brand/10 text-brand-dark hover:bg-brand/20"}`}>
                {voice.listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/60" aria-hidden="true" />}
                <span className="relative"><Icon name="mic" size={20} /></span>
              </button>
            </div>
            <button className="btn-accent !px-6 !py-2 sm:!py-2.5" disabled={busy || query.trim().length < 3}>{busy ? "Analyzing..." : "Predict my trip"}</button>
          </form>
          {(voice.listening || voice.note) && (
            <p role="status" className={`mt-2 flex items-center gap-2 text-sm ${voice.note ? "text-amber-200" : "text-white/90"}`}>
              {voice.listening && <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden="true" />}
              {voice.note || "Listening... describe your trip, then pause"}
            </p>
          )}
        </div>
      </section>

      <section className="page py-4 sm:py-8" aria-live="polite">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!data && !error && (
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
            {[["search", "Understands your request", "Month, days, group size, budget, trip type and state are picked out of your sentence."],
              ["chart", "Predicts conditions", "Weather, crowd level and price for your month, from typical yearly patterns."],
              ["check", "Explains every match", "Each result shows why it fits, the estimated total cost and a smarter month if one exists."]].map(([i, t, d]) => (
              <div key={t} className="card rise flex items-start gap-3 p-3.5 sm:block sm:p-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-brand-dark sm:mb-3 sm:h-10 sm:w-10"><Icon name={i} size={19} /></span>
                <div><h3 className="text-sm font-semibold text-navy sm:text-base">{t}</h3><p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">{d}</p></div></div>
            ))}
          </div>
        )}
        {data && (
          <>
            <div className="no-scrollbar -mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:mb-5 sm:flex-wrap sm:px-0">
              <span className="shrink-0 text-xs font-semibold text-navy sm:text-sm">We understood:</span>
              {chips.map(([icon, label]) => (
                <span key={label} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink"><Icon name={icon} size={13} /> {label}</span>
              ))}
            </div>
            {data.results.length === 0 && <p className="card p-6 text-muted">No destinations matched. Try removing the state or trip type.</p>}
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0">
              {data.results.map((r, i) => (
                <article key={r.slug} className="card grid w-[84vw] max-w-[21rem] shrink-0 snap-start grid-rows-[auto_1fr] overflow-hidden md:w-auto md:max-w-none md:shrink md:grid-cols-[260px_1fr] md:grid-rows-none">
                  <Link to={`/destinations/${r.slug}`} className="relative block h-28 sm:h-36 md:h-full">
                    <Cover name={r.destination.name} src={r.destination.cover_image} />
                    <span className="absolute left-3 top-3 rounded-md bg-navy px-2 py-1 text-xs font-bold text-white">#{i + 1}</span>
                  </Link>
                  <div className="p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="!font-sans text-lg font-semibold text-navy sm:text-xl"><Link to={`/destinations/${r.slug}`}>{r.destination.name}</Link></h2>
                        <p className="text-sm text-muted">{r.destination.city_name}, {r.destination.state_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold leading-none text-brand-dark sm:text-3xl">{r.match}<span className="text-sm font-medium text-muted">/100</span></p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[r.confidence]}`}>{r.confidence} match</span>
                      </div>
                    </div>
                    <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-line py-2.5 text-[13px] sm:mt-4 sm:grid-cols-4 sm:gap-4 sm:py-3 sm:text-sm">
                      <div><dt className="text-xs text-muted">Weather in {r.month_name}</dt><dd className="font-semibold">{r.season_label} · {r.temp_c}°C</dd></div>
                      <div><dt className="text-xs text-muted">Crowds</dt><dd className="font-semibold">{r.crowd_label}</dd></div>
                      <div><dt className="text-xs text-muted">Daily cost</dt><dd className="font-semibold">{inr(r.daily_budget)}</dd></div>
                      <div><dt className="text-xs text-muted">Trip total</dt><dd className="font-semibold">{r.total_low ? `${inr(r.total_low)} – ${inr(r.total_high)}` : "n/a"}</dd></div>
                    </dl>
                    <ul className="mt-2.5 space-y-1 text-xs text-ink sm:mt-3 sm:space-y-1.5 sm:text-sm">
                      {r.reasons.map((x) => <li key={x} className="flex gap-2"><span className="mt-0.5 text-brand"><Icon name="check" size={15} /></span>{x}</li>)}
                    </ul>
                    {r.tip && <p className="mt-2.5 rounded-lg bg-accent-soft/60 px-2.5 py-1.5 text-xs text-navy sm:mt-3 sm:px-3 sm:py-2 sm:text-sm"><b>Smart tip:</b> {r.tip}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                      <Link to={`/destinations/${r.slug}`} className="btn-outline !px-3.5 !py-1.5 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm">View details</Link>
                      <Link to="/trips/new" className="btn-primary !px-3.5 !py-1.5 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm">Plan this trip</Link>
                      {canSpeak && (
                        <button type="button" onClick={() => speak(r.slug, spoken(r))} aria-pressed={speakingId === r.slug}
                          aria-label={speakingId === r.slug ? `Stop reading ${r.destination.name}` : `Listen to the ${r.destination.name} prediction`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:py-2 sm:text-sm ${
                            speakingId === r.slug ? "bg-brand-dark text-white" : "bg-brand/10 text-brand-dark hover:bg-brand/20"}`}>
                          <Icon name={speakingId === r.slug ? "stop" : "speaker"} size={16} />
                          {speakingId === r.slug ? "Stop" : "Listen"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted sm:mt-6">{data.disclaimer} Always confirm fees, timings and the weather forecast before you travel.</p>
          </>
        )}
      </section>
    </>
  );
}
