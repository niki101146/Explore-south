import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";
import { Empty, ErrorNote, Loading, PageHead, Pager, Pill, SearchBox, td, th } from "./ui.jsx";
import { fmtDate, rupee } from "../components/PlanView.jsx";

const status = (b) => (b.status === "confirmed" ? <Pill tone="green">Confirmed</Pill> : <Pill>Cancelled</Pill>);

export default function AdminBookings() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/admin-dashboard/bookings/", { params: { page, search: search || undefined } })
      .then((r) => setData(r.data)).catch(() => setError("Could not load bookings."));
  }, [page, search]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHead title="Bookings" subtitle="Trips confirmed by travelers." />
      <SearchBox className="mb-4 sm:max-w-sm" placeholder="Search reference, email or destination" value={search}
        onChange={(v) => { setSearch(v); setPage(1); }} />
      <ErrorNote>{error}</ErrorNote>
      {!data && !error && <Loading />}
      {data && data.results.length === 0 && <Empty>No bookings yet.</Empty>}

      {/* Phones: cards */}
      <div className="space-y-2.5 md:hidden">
        {data?.results.map((b) => (
          <article key={b.id} className="card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-navy">{b.reference}</p>
              {status(b)}
            </div>
            <p className="mt-1 text-sm font-semibold">{b.destination_name}</p>
            <p className="text-xs text-muted">{fmtDate(b.start_date)} to {fmtDate(b.end_date)}</p>
            <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-line pt-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate">{b.username} · {b.num_travelers} traveler{b.num_travelers === 1 ? "" : "s"}</p>
                <a className="block truncate text-xs text-brand-dark" href={`mailto:${b.email}`}>{b.email}</a>
              </div>
              <p className="shrink-0 text-base font-bold text-brand-dark">{rupee(b.total_amount)}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Larger screens: table */}
      {data && data.results.length > 0 && (
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface">
              <tr>
                <th className={th}>Ref</th><th className={th}>Traveler</th><th className={th}>Destination</th>
                <th className={th}>Dates</th><th className={th}>People</th><th className={th}>Total</th><th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((b) => (
                <tr key={b.id} className="transition hover:bg-surface/70">
                  <td className={`${td} font-semibold text-navy`}>{b.reference}</td>
                  <td className={td}><p>{b.username}</p><a className="text-xs text-brand-dark hover:underline" href={`mailto:${b.email}`}>{b.email}</a></td>
                  <td className={td}>{b.destination_name}</td>
                  <td className={td}>{fmtDate(b.start_date)} to {fmtDate(b.end_date)}</td>
                  <td className={td}>{b.num_travelers}</td>
                  <td className={td}>{rupee(b.total_amount)}</td>
                  <td className={td}>{status(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager data={data} page={page} onPage={setPage} />
    </>
  );
}
