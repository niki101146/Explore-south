import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Empty, ErrorNote, Loading, PageHead, Pager, Pill, SearchBox, td, th } from "./ui.jsx";
import DestinationForm from "./DestinationForm.jsx";

export default function AdminDestinations() {
  const { user } = useAuth();
  const [view, setView] = useState({ mode: "list", slug: null });
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/destinations/", { params: { page, search: search || undefined } })
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load destinations."));
  }, [page, search]);

  useEffect(() => { if (view.mode === "list") load(); }, [load, view.mode]);

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.name}" and its attractions and reviews?`)) return;
    try {
      await api.delete(`/destinations/${d.slug}/`);
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  if (view.mode === "form") {
    return <DestinationForm slug={view.slug} onClose={() => setView({ mode: "list", slug: null })} />;
  }

  return (
    <>
      <PageHead title="Destinations" subtitle="Add, edit and publish destinations.">
        <button className="btn-primary !py-2" onClick={() => setView({ mode: "form", slug: null })}>+ Add destination</button>
      </PageHead>

      <SearchBox className="mb-4 sm:max-w-sm" placeholder="Search destinations" value={search}
        onChange={(v) => { setSearch(v); setPage(1); }} />
      <ErrorNote>{error}</ErrorNote>
      {!data && !error && <Loading />}
      {data && data.results.length === 0 && <Empty>No destinations found.</Empty>}

      {/* Phones: cards */}
      <div className="space-y-2.5 md:hidden">
        {data?.results.map((d) => (
          <article key={d.id} className="card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{d.name}</p>
                <p className="text-xs text-muted">{d.city_name}, {d.state_name}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand-dark">{d.review_count > 0 ? `★ ${d.avg_rating.toFixed(1)}` : ""}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted">{d.categories.map((c) => c.name).join(", ") || "No category"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Pill tone={d.is_published ? "green" : "amber"}>{d.is_published ? "Published" : "Draft"}</Pill>
              {d.is_featured && <Pill tone="teal">Featured</Pill>}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-sm !px-4 !py-1.5" onClick={() => setView({ mode: "form", slug: d.slug })}>Edit</button>
              {user.role === "admin" && <button className="btn-danger" onClick={() => remove(d)}>Delete</button>}
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
                <th className={th}>Name</th><th className={th}>Location</th>
                <th className={th}>Status</th><th className={th}>Rating</th><th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((d) => (
                <tr key={d.id} className="transition hover:bg-surface/70">
                  <td className={td}>
                    <p className="font-semibold text-navy">{d.name}</p>
                    <p className="text-xs text-muted">{d.categories.map((c) => c.name).join(", ") || "No category"}</p>
                  </td>
                  <td className={td}>{d.city_name}, {d.state_name}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1">
                      <Pill tone={d.is_published ? "green" : "amber"}>{d.is_published ? "Published" : "Draft"}</Pill>
                      {d.is_featured && <Pill tone="teal">Featured</Pill>}
                    </div>
                  </td>
                  <td className={td}>{d.review_count > 0 ? `★ ${d.avg_rating.toFixed(1)} (${d.review_count})` : "-"}</td>
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button className="btn-sm" onClick={() => setView({ mode: "form", slug: d.slug })}>Edit</button>
                      {user.role === "admin" && <button className="btn-danger" onClick={() => remove(d)}>Delete</button>}
                    </div>
                  </td>
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
