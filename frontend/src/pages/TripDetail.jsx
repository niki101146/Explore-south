import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import PlanView, { fmtDate } from "../components/PlanView.jsx";
import PageBanner from "../components/PageBanner.jsx";

export default function TripDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/bookings/${id}/`).then((r) => setB(r.data)).catch(() => setError("Booking not found."));
  }, [id]);

  const cancel = async () => {
    if (!window.confirm("Cancel this booking?")) return;
    try { const { data } = await api.post(`/bookings/${id}/cancel/`); setB(data); }
    catch (e) { setError(errorMessage(e)); }
  };

  if (!b) return <p className="p-16 text-center text-muted">{error || "Loading..."}</p>;
  const confirmed = b.status === "confirmed";

  return (
    <>
    <PageBanner title="Your trip" subtitle="Booking details and the full day-by-day plan." />
    <div className="page py-10">
      <Link to="/trips" className="text-sm text-muted hover:text-brand-dark">← My trips</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h-section">Trip to {b.destination_name}</h1>
            <span className={`badge ${confirmed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {confirmed ? "Confirmed" : "Cancelled"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {fmtDate(b.start_date)} to {fmtDate(b.end_date)} · {b.num_travelers} traveler{b.num_travelers > 1 ? "s" : ""} · Ref <b>{b.reference}</b>
          </p>
          <p className="text-sm text-muted">Confirmation sent to {b.email}</p>
        </div>
        {confirmed && <button onClick={cancel} className="btn-danger">Cancel booking</button>}
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <PlanView plan={b.plan} />
    </div>
    </>
  );
}
