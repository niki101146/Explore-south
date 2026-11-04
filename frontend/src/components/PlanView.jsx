import Icon from "./Icon.jsx";

export const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const KIND = {
  sightseeing: ["pin", "bg-brand/10 text-brand-dark"],
  leisure: ["leaf", "bg-sand text-navy"],
  food: ["heart", "bg-accent-soft text-navy"],
  travel: ["compass", "bg-sky-50 text-sky-700"],
  stay: ["home", "bg-navy text-white"],
};

// Shows a full trip plan: every day (collapsible) with food, stay, travel and sightseeing, then the cost summary.
export default function PlanView({ plan }) {
  const s = plan.summary;
  const rows = [
    ["Accommodation", s.accommodation], ["Food", s.food],
    ["Local travel", s.local_travel], ["Entry fees", s.entry_fees],
  ];

  const se = plan.season;
  const seTone = !se ? "" : se.score >= 60 ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : se.score >= 40 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800";

  return (
    <>
    {se && (
      <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${seTone}`} role="note">
        <p className="font-semibold">Season check: {se.label} ({se.score}/100) · crowds {se.crowd_label.toLowerCase()}</p>
        <p className="mt-0.5">{se.message}</p>
        {se.warnings.map((w) => <p key={w} className="mt-0.5">{w}</p>)}
        {se.better_months.length > 0 && <p className="mt-0.5">Better months: {se.better_months.join(", ")}.</p>}
      </div>
    )}
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="space-y-4">
        {plan.days.map((d) => (
          <details key={d.day} open className="card group overflow-hidden">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 bg-navy px-5 py-3 text-white [&::-webkit-details-marker]:hidden">
              <p className="font-semibold">Day {d.day} · {d.label}</p>
              <p className="flex items-center gap-3 text-xs text-white/75">
                {fmtDate(d.date)}
                <span className="font-semibold text-white">{rupee(d.day_total)}</span>
                <span className="transition group-open:rotate-180" aria-hidden="true">▾</span>
              </p>
            </summary>
            <ul className="divide-y divide-line">
              {d.items.map((it, i) => {
                const [icon, tone] = KIND[it.type] || KIND.leisure;
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                      <Icon name={icon} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy">{it.title}</p>
                      <p className="text-xs text-muted">
                        {it.type === "sightseeing"
                          ? `${it.per_person > 0 ? `Entry ${rupee(it.per_person)} per person` : "Free entry"}${it.detail ? ` · ${it.detail}` : ""}`
                          : it.detail}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{it.amount > 0 ? rupee(it.amount) : "Free"}</p>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between bg-surface px-5 py-2 text-sm">
              <span className="text-muted">Day {d.day} total</span>
              <b className="text-navy">{rupee(d.day_total)}</b>
            </div>
          </details>
        ))}
      </div>

      <aside className="card p-6 lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-semibold text-navy">Cost summary</h3>
          {plan.style_label && <span className="badge bg-brand/10 text-brand-dark">{plan.style_label} trip</span>}
        </div>
        <p className="mt-1 text-xs text-muted">
          {plan.num_days} day{plan.num_days > 1 ? "s" : ""} · {plan.travelers} traveler{plan.travelers > 1 ? "s" : ""}
        </p>

        <dl className="mt-4 space-y-3 text-sm">
          {rows.map(([k, v]) => {
            const pct = s.total > 0 ? Math.round((v / s.total) * 100) : 0;
            return (
              <div key={k}>
                <div className="flex justify-between">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{rupee(v)}</dd>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
          <span className="font-semibold text-navy">Total</span>
          <span className="text-3xl font-bold text-navy">{rupee(s.total)}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-xl bg-surface px-2 py-2">
            <p className="font-semibold text-navy">{rupee(s.per_person)}</p>
            <p className="text-xs text-muted">per person</p>
          </div>
          <div className="rounded-xl bg-surface px-2 py-2">
            <p className="font-semibold text-navy">{rupee(s.per_person_per_day ?? Math.round(s.per_person / plan.num_days))}</p>
            <p className="text-xs text-muted">per person / day</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">{plan.note}</p>
        <button type="button" onClick={() => window.print()} className="btn-outline mt-4 w-full !py-2">
          Print or save as PDF
        </button>
      </aside>
    </div>
    </>
  );
}
