import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Empty, ErrorNote, Loading, PageHead, Pager, Pill, SearchBox, td, th } from "./ui.jsx";

const EMPTY = {
  destination: "", name: "", description: "", entry_fee: 0, timings: "",
  latitude: "", longitude: "", last_verified: "",
};

export default function AdminAttractions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [editing, setEditing] = useState(null); // null | {id?, ...fields}
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/attractions/", {
      params: { page, search: search || undefined, destination: destFilter || undefined },
    }).then((r) => setData(r.data)).catch(() => setError("Could not load attractions."));
  }, [page, search, destFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/destinations/", { params: { page_size: 100 } })
      .then((r) => setDestinations(r.data.results)).catch(() => {});
  }, []);

  const startEdit = (a) =>
    setEditing({
      id: a.id, destination: String(a.destination), name: a.name, description: a.description || "",
      entry_fee: a.entry_fee, timings: a.timings || "", latitude: a.latitude ?? "",
      longitude: a.longitude ?? "", last_verified: a.last_verified || "",
      images: a.images || [],
    });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const { id, images: _images, ...rest } = editing;
    const body = {
      ...rest,
      latitude: rest.latitude === "" ? null : rest.latitude,
      longitude: rest.longitude === "" ? null : rest.longitude,
      last_verified: rest.last_verified || null,
    };
    try {
      if (id) await api.put(`/attractions/${id}/`, body);
      else await api.post("/attractions/", body);
      setEditing(null);
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.name}"?`)) return;
    await api.delete(`/attractions/${a.id}/`);
    load();
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be 5 MB or smaller."); return; }
    setError("");
    try {
      const fd = new FormData();
      fd.append("attraction", editing.id);
      fd.append("image", file);
      const { data: img } = await api.post("/attraction-images/", fd);
      setEditing((cur) => ({ ...cur, images: [...(cur.images || []), img] }));
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const deletePhoto = async (imgId) => {
    await api.delete(`/attraction-images/${imgId}/`);
    setEditing((cur) => ({ ...cur, images: cur.images.filter((i) => i.id !== imgId) }));
    load();
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  return (
    <>
      <PageHead title="Attractions" subtitle="Places to visit inside each destination.">
        <button className="btn-primary !py-2" onClick={() => setEditing({ ...EMPTY })}>+ Add attraction</button>
      </PageHead>

      {editing && (
        <form onSubmit={save} className="card mb-4 grid gap-3 border-brand/30 p-3.5 sm:grid-cols-2 sm:p-5">
          <h2 className="font-bold text-navy sm:col-span-2">{editing.id ? "Edit attraction" : "New attraction"}</h2>
          <div>
            <label className="label">Destination</label>
            <select className="input" required value={editing.destination} onChange={set("destination")}>
              <option value="">Choose</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" required value={editing.name} onChange={set("name")} />
          </div>
          <div>
            <label className="label">Entry fee per person (₹, 0 = free)</label>
            <input type="number" min="0" step="0.01" className="input" value={editing.entry_fee} onChange={set("entry_fee")} />
          </div>
          <div>
            <label className="label">Timings</label>
            <input className="input" value={editing.timings} onChange={set("timings")} placeholder="9:00 AM - 5:00 PM" />
          </div>
          <div>
            <label className="label">Latitude</label>
            <input className="input" value={editing.latitude} onChange={set("latitude")} />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input className="input" value={editing.longitude} onChange={set("longitude")} />
          </div>
          <div>
            <label className="label">Last verified</label>
            <input type="date" className="input" value={editing.last_verified} onChange={set("last_verified")} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={editing.description} onChange={set("description")} />
          </div>
          {editing.id ? (
            <div className="sm:col-span-2">
              <label className="label">Photos</label>
              <div className="mb-2 flex flex-wrap gap-3">
                {(editing.images || []).map((im) => (
                  <div key={im.id} className="relative">
                    <img src={im.image} alt={im.caption} className="h-20 w-28 rounded-lg object-cover" />
                    <button type="button" onClick={() => deletePhoto(im.id)}
                      className="absolute right-1 top-1 rounded bg-white/90 px-2 text-sm text-red-600">×</button>
                  </div>
                ))}
                {(editing.images || []).length === 0 && <p className="text-sm text-muted">No photos yet.</p>}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm"
                onChange={(e) => { uploadPhoto(e.target.files[0]); e.target.value = ""; }} />
            </div>
          ) : (
            <p className="text-xs text-muted sm:col-span-2">Save the attraction first, then edit it to add photos.</p>
          )}
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:flex">
            <button className="btn-primary">Save</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <SearchBox className="sm:w-72" placeholder="Search attractions" value={search}
          onChange={(v) => { setSearch(v); setPage(1); }} />
        <select className="input !rounded-xl !py-2.5 sm:max-w-xs" value={destFilter} aria-label="Destination"
          onChange={(e) => { setDestFilter(e.target.value); setPage(1); }}>
          <option value="">All destinations</option>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {!editing && <ErrorNote>{error}</ErrorNote>}
      {!data && !error && <Loading />}
      {data && data.results.length === 0 && <Empty>No attractions found.</Empty>}

      {/* Phones: cards */}
      <div className="space-y-2.5 md:hidden">
        {data?.results.map((a) => (
          <article key={a.id} className="card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-navy">{a.name}</p>
                <p className="text-xs text-muted">{a.destination_name}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-brand-dark">{Number(a.entry_fee) > 0 ? `₹${Number(a.entry_fee)}` : "Free"}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{a.timings || "No timings"}</p>
            <div className="mt-2">
              {a.last_verified ? <Pill tone="green">Verified {a.last_verified}</Pill> : <Pill tone="amber">Not verified</Pill>}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-sm !px-4 !py-1.5" onClick={() => startEdit(a)}>Edit</button>
              {user.role === "admin" && <button className="btn-danger" onClick={() => remove(a)}>Delete</button>}
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
                <th className={th}>Name</th><th className={th}>Destination</th><th className={th}>Fee</th>
                <th className={th}>Timings</th><th className={th}>Verified</th><th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((a) => (
                <tr key={a.id} className="transition hover:bg-surface/70">
                  <td className={`${td} font-semibold text-navy`}>{a.name}</td>
                  <td className={td}>{a.destination_name}</td>
                  <td className={td}>{Number(a.entry_fee) > 0 ? `₹${Number(a.entry_fee)}` : "Free"}</td>
                  <td className={td}>{a.timings || "-"}</td>
                  <td className={td}>
                    {a.last_verified ? <Pill tone="green">{a.last_verified}</Pill> : <Pill tone="amber">Not verified</Pill>}
                  </td>
                  <td className={td}>
                    <div className="flex justify-end gap-2">
                      <button className="btn-sm" onClick={() => startEdit(a)}>Edit</button>
                      {user.role === "admin" && <button className="btn-danger" onClick={() => remove(a)}>Delete</button>}
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
