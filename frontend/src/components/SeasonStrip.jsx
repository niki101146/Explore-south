import { useEffect, useState } from "react";
import api from "../services/api.js";
import { rupee } from "./PlanView.jsx";
import Icon from "./Icon.jsx";

// Colour per score label. Colour is never the only signal: every month also shows its label and score.
export const TONE = {
  Excellent: { bar: "bg-[#7a4313]", chip: "bg-[#f1dfc2] text-[#5c320d]" },
  Good: { bar: "bg-[#c2762b]", chip: "bg-[#f8e8d0] text-[#8a4f14]" },
  Fair: { bar: "bg-[#f2b84b]", chip: "bg-[#fdf0d2] text-[#8a6410]" },
  Poor: { bar: "bg-[#e6d3b3]", chip: "bg-[#f3ece2] text-[#7a6554]" },
};

const RING = { Excellent: "#ffd166", Good: "#f4a340", Fair: "#d98a3d", Poor: "#b89a7e" };

// Circular score gauge that fills in when it appears.
export function ScoreRing({ score, label, size = 64, dark = false }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${label}, ${score} out of 100`}>
      <circle cx="32" cy="32" r={r} fill={dark ? "rgba(0,0,0,0.45)" : "#fff"} stroke={dark ? "rgba(255,255,255,0.22)" : "#e5e7eb"} strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={RING[label] || RING.Fair} strokeWidth="6" strokeLinecap="round"
        className="ring-fill" strokeDasharray={c} strokeDashoffset={on ? c * (1 - score / 100) : c} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="17" fontWeight="700" fill={dark ? "#fff" : "#3b2417"}>{score}</text>
    </svg>
  );
}

export function ScoreBadge({ label, score }) {
  const tone = TONE[label] || TONE.Fair;
  return <span className={`badge ${tone.chip}`}>{label} · {score}/100</span>;
}

// Twelve-month suitability chart for one destination, with a detail panel for the chosen month.
export default function SeasonStrip({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState(null);

  useEffect(() => {
    setData(null);
    setError("");
    api.get("/season/predict/", { params: { destination: slug } })
      .then((r) => { setData(r.data); setSel(r.data.current_month); })
      .catch(() => setError("The season guide is not available right now."));
  }, [slug]);

  if (error) return <p className="text-sm text-muted">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading the season guide...</p>;

  const row = data.months[(sel || data.current_month) - 1];
  const best = new Set(data.best_months);

  return (
    <div>
      <p className="text-slate-700">{data.summary}</p>

      <div className="mt-5 grid grid-cols-12 items-end gap-1 sm:gap-1.5" role="group" aria-label="Suitability by month">
        {data.months.map((m) => {
          const tone = TONE[m.label];
          const active = m.month === row.month;
          return (
            <button key={m.month} type="button" onClick={() => setSel(m.month)} aria-pressed={active}
              aria-label={`${m.full_name}: ${m.label}, ${m.score} out of 100`}
              className={`group flex flex-col items-center gap-1 rounded-lg p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-sand" : "hover:bg-sand/60"}`}>
              <span className="text-[10px] font-semibold text-muted sm:text-xs">{best.has(m.month) ? "★" : "\u00a0"}</span>
              <span className="flex h-28 w-full items-end sm:h-32">
                <span className={`grow-y w-full rounded-t-md ${tone.bar} ${active ? "" : "opacity-80"}`}
                  style={{ height: `${Math.max(6, m.score)}%`, "--i": m.month }} />
              </span>
              <span className={`text-[10px] sm:text-xs ${active ? "font-bold text-navy" : "text-muted"}`}>{m.name}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
        {Object.entries(TONE).map(([label, t]) => (
          <li key={label} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${t.bar}`} />{label}</li>
        ))}
        <li>★ one of the 3 best months</li>
      </ul>

      <div className="card mt-5 p-5" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-semibold text-navy">{row.full_name}</h3>
          <ScoreBadge label={row.label} score={row.score} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Daytime</dt><dd className="font-semibold text-navy">{row.temp_c}°C</dd></div>
          <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Rainfall</dt><dd className="font-semibold text-navy">{row.rain_mm} mm</dd></div>
          <div className="rounded-xl bg-surface p-3"><dt className="text-xs text-muted">Crowds</dt><dd className="font-semibold text-navy">{row.crowd_label}</dd></div>
          <div className="rounded-xl bg-surface p-3">
            <dt className="text-xs text-muted">Per person / day</dt>
            <dd className="font-semibold text-navy">{row.est_daily_budget ? rupee(row.est_daily_budget) : "n/a"}</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          {row.notes.map((n) => <li key={n} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />{n}</li>)}
        </ul>
        <p className="mt-3 text-sm"><b className="text-navy">Pack:</b> {row.pack.join(", ").toLowerCase()}.</p>
      </div>

      <p className="mt-3 text-xs text-muted">
        Confidence: {data.confidence.toLowerCase()} · Climate: {data.climate.toLowerCase()}. {data.disclaimer}
      </p>
    </div>
  );
}
