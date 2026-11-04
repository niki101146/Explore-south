import { Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import Icon, { categoryIcon } from "./Icon.jsx";

// Compact card: photo on top (zooms and sweeps a light shine on hover), details underneath.
// Cards rise in one after another; pass the list index as `i` to stagger them.
export default function DestinationCard({ d, i = 0 }) {
  const cat = d.categories?.[0];
  const price = d.avg_daily_budget > 0 ? `₹${d.avg_daily_budget.toLocaleString("en-IN")}` : null;
  return (
    <Link
      to={`/destinations/${d.slug}`}
      style={{ "--i": Math.min(i, 8) }}
      className="dest-card rise group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_14px_30px_rgba(59,36,23,0.16)]"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-sand">
        <div className="absolute inset-0 transition duration-700 ease-out group-hover:scale-110">
          <Cover name={d.name} src={d.cover_image} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <span className="dest-shine" aria-hidden="true" />

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {d.review_count > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <Icon name="star" size={11} className="text-accent" /> {d.avg_rating.toFixed(1)}
            </span>
          ) : <span />}
          {cat && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
              <Icon name={categoryIcon(cat.name)} size={11} /> {cat.name}
            </span>
          )}
        </div>
        {price && (
          <span className="absolute bottom-2 left-2 inline-flex items-baseline gap-0.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-navy shadow">
            {price}<span className="text-[10px] font-semibold opacity-80">/day</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-[15px] font-semibold leading-tight text-navy">{d.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <Icon name="pin" size={12} /> <span className="truncate">{d.city_name}, {d.state_name}</span>
        </p>
        {d.short_description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted max-sm:hidden">{d.short_description}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-2.5 text-xs font-semibold text-brand-dark">
          View details <Icon name="arrow" size={14} className="transition duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </Link>
  );
}
