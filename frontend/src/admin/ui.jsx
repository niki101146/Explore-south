import Icon from "../components/Icon.jsx";

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted sm:text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// Search field with an icon.
export function SearchBox({ value, onChange, placeholder, className = "" }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
      <input className="input !rounded-xl !py-2.5 !pl-9" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </label>
  );
}

// Segmented tabs that always fit on screen (no sideways scrolling).
export function Segmented({ options, value, onChange }) {
  return (
    <div className="mb-4 grid gap-1 rounded-xl bg-white p-1 ring-1 ring-line"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="tablist">
      {options.map(([v, l]) => (
        <button key={l} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`rounded-lg px-2 py-2 text-xs font-semibold transition active:scale-95 sm:text-sm ${
            value === v ? "bg-navy text-white shadow" : "text-muted hover:bg-sand hover:text-navy"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="card p-8 text-center text-sm text-muted">{children}</div>;
}

export function Loading() {
  return (
    <div className="space-y-2" aria-busy="true">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-sand" />)}
    </div>
  );
}

export function ErrorNote({ children }) {
  return children ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p> : null;
}

export function Avatar({ name = "" }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-sm font-bold uppercase text-brand-dark">
      {name?.[0] || "?"}
    </span>
  );
}

export function Pager({ data, page, onPage }) {
  if (!data || (!data.next && !data.previous)) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button className="btn-outline !px-4 !py-2 !text-xs sm:!text-sm" disabled={!data.previous} onClick={() => onPage(page - 1)}>← Previous</button>
      <span className="text-xs text-muted sm:text-sm">Page {page}</span>
      <button className="btn-outline !px-4 !py-2 !text-xs sm:!text-sm" disabled={!data.next} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

export const th = "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted";
export const td = "px-4 py-3 align-middle";

export function Pill({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    teal: "bg-brand/10 text-brand-dark",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}
