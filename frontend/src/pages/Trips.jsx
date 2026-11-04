import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { fmtDate, rupee } from "../components/PlanView.jsx";
import PageBanner from "../components/PageBanner.jsx";

export default function Trips() {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    api.get("/bookings/").then((r) => setBookings(r.data.results ?? r.data)).catch(() => setBookings([]));
  }, []);

  return (
    <>
    <PageBanner title="My trips" subtitle="Your confirmed bookings and their full plans.">
      <Link to="/trips/new" className="btn-accent">+ Plan a new trip</Link>
    </PageBanner>
    <div className="page py-10">

      {bookings === null && <p className="text-muted">Loading...</p>}
      {bookings?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="font-display text-2xl font-semibold text-navy">No trips yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Choose a destination and dates. We will show a ready plan with stay, food, travel and the total cost.
          </p>
          <Link to="/trips/new" className="btn-primary mt-5">Plan my first trip</Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bookings?.map((b) => (
          <Link key={b.id} to={`/trips/${b.id}`} className="card flex flex-col p-5 transition hover:border-brand">
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-bold text-navy">{b.destination_name}</p>
              <span className={`badge ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{fmtDate(b.start_date)} to {fmtDate(b.end_date)}</p>
            <p className="text-sm text-muted">{b.num_travelers} traveler{b.num_travelers > 1 ? "s" : ""} · Ref {b.reference}</p>
            <p className="mt-4 text-2xl font-bold text-navy">{rupee(b.total_amount)}</p>
            <span className="mt-3 text-sm font-semibold text-brand-dark">View plan →</span>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
