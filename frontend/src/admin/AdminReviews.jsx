import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";
import Stars from "../components/Stars.jsx";
import { Avatar, Empty, Loading, PageHead, Pager, Pill, Segmented } from "./ui.jsx";

const TABS = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["", "All"]];
const TONE = { pending: "amber", approved: "green", rejected: "red" };

export default function AdminReviews() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/reviews/", { params: { status: status || undefined, page } })
      .then((r) => setData(r.data)).catch(() => setData({ results: [] }));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const setReview = async (id, next) => { await api.patch(`/reviews/${id}/`, { status: next }); load(); };
  const remove = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;
    await api.delete(`/reviews/${id}/`);
    load();
  };

  return (
    <>
      <PageHead title="Reviews" subtitle="Approve or reject reviews before they appear on the site." />
      <Segmented options={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      {!data && <Loading />}
      {data?.results.length === 0 && <Empty>No reviews here.</Empty>}

      <div className="space-y-2.5">
        {data?.results.map((r) => (
          <article key={r.id} className="card p-3.5 sm:p-4">
            <div className="flex items-start gap-3">
              <Avatar name={r.user_name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="truncate font-semibold text-navy">{r.destination_name}</p>
                  <Pill tone={TONE[r.status]}>{r.status}</Pill>
                </div>
                <p className="text-xs text-muted">by {r.user_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                <div className="mt-1"><Stars value={r.rating} /></div>
              </div>
            </div>
            {r.comment && <p className="mt-2.5 rounded-xl bg-surface px-3 py-2 text-sm text-ink">{r.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== "approved" && <button className="btn-primary !px-4 !py-1.5 !text-xs" onClick={() => setReview(r.id, "approved")}>Approve</button>}
              {r.status !== "rejected" && <button className="btn-outline !px-4 !py-1.5 !text-xs" onClick={() => setReview(r.id, "rejected")}>Reject</button>}
              <button className="btn-danger" onClick={() => remove(r.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      <Pager data={data} page={page} onPage={setPage} />
    </>
  );
}
