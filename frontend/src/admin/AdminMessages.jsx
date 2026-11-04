import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { Avatar, Empty, ErrorNote, Loading, PageHead, Pager, Pill, Segmented } from "./ui.jsx";

export default function AdminMessages() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(""); // "" | "false" (unread)
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/admin-dashboard/messages/", { params: { page, is_read: filter || undefined } })
      .then((r) => setData(r.data)).catch(() => setError("Could not load messages."));
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (m) => {
    try { await api.patch(`/admin-dashboard/messages/${m.id}/`, { is_read: !m.is_read }); load(); }
    catch (e) { setError(errorMessage(e)); }
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try { await api.delete(`/admin-dashboard/messages/${m.id}/`); load(); }
    catch (e) { setError(errorMessage(e)); }
  };

  return (
    <>
      <PageHead title="Messages" subtitle="Messages sent from the Contact us page." />
      <Segmented options={[["", "All messages"], ["false", "Unread only"]]} value={filter}
        onChange={(v) => { setFilter(v); setPage(1); }} />
      <ErrorNote>{error}</ErrorNote>
      {!data && !error && <Loading />}

      <div className="space-y-2.5">
        {data?.results.map((m) => (
          <article key={m.id} className={`card p-3.5 sm:p-4 ${m.is_read ? "" : "border-l-4 border-l-accent"}`}>
            <div className="flex items-start gap-3">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                  {m.name} {!m.is_read && <Pill tone="amber">New</Pill>}
                </p>
                <a href={`mailto:${m.email}`} className="block truncate text-sm text-brand-dark hover:underline">{m.email}</a>
                <p className="text-xs text-muted">{new Date(m.created_at).toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-2.5 whitespace-pre-wrap rounded-xl bg-surface px-3 py-2 text-sm text-ink">{m.message}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-sm" onClick={() => toggle(m)}>{m.is_read ? "Mark unread" : "Mark read"}</button>
              <button className="btn-danger" onClick={() => remove(m)}>Delete</button>
            </div>
          </article>
        ))}
        {data && data.results.length === 0 && <Empty>No messages yet.</Empty>}
      </div>
      <Pager data={data} page={page} onPage={setPage} />
    </>
  );
}
