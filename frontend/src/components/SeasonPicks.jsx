import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import DestinationCard from "./DestinationCard.jsx";
import Icon from "./Icon.jsx";
import { ScoreBadge } from "./SeasonStrip.jsx";
import MonthFilter from "./MonthFilter.jsx";

// Home page block: pick a month, see the destinations that are best for it.
export default function SeasonPicks() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/season/recommend/", { params: { month } })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month]);

  const top = data?.results.slice(0, 4) || [];

  return (
    <section className="page pt-10 sm:pt-20" aria-labelledby="season-title">
      <div className="rounded-3xl bg-sand/70 p-4 sm:rounded-[2rem] sm:p-8 xl:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-dark">
              <Icon name="sparkle" size={14} /> Season prediction
            </p>
            <h2 id="season-title" className="h-section !text-[1.6rem] sm:!text-4xl">Where to go in {data?.month_name || "this month"}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
              Every destination is scored by weather, rain, crowds and prices for the month you pick.
            </p>
          </div>
          <Link to="/season" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
            Open the season planner <Icon name="arrow" size={16} />
          </Link>
        </div>

        <MonthFilter value={month} onChange={setMonth} className="mt-4 sm:mt-5 sm:max-w-2xl" />

        <div className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-6 sm:mx-0 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-3 lg:grid-cols-4" aria-live="polite">
          {loading && !data
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] w-[64vw] max-w-[16rem] shrink-0 animate-pulse rounded-2xl bg-white/60 sm:w-auto sm:max-w-none sm:rounded-3xl" />)
            : top.map((r) => (
                <div key={r.destination.id} className="relative w-[64vw] max-w-[16rem] shrink-0 snap-start sm:w-auto sm:max-w-none max-sm:[&>a]:aspect-[4/5]">
                  <DestinationCard d={r.destination} />
                  <div className="pointer-events-none absolute inset-x-0 -bottom-3 flex justify-center">
                    <span className="pointer-events-auto rounded-full bg-white px-1 py-1 shadow-md"><ScoreBadge label={r.label} score={r.score} /></span>
                  </div>
                </div>
              ))}
        </div>
        {!loading && top.length === 0 && <p className="mt-4 text-muted">No destinations to show yet.</p>}
      </div>
    </section>
  );
}
