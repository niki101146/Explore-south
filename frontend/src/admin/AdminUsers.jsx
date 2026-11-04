import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { Avatar, Empty, ErrorNote, Loading, PageHead, Pager, Pill, SearchBox, td, th } from "./ui.jsx";

export default function AdminUsers() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/admin-dashboard/users/", { params: { page, search: search || undefined } })
      .then((r) => setData(r.data)).catch(() => setError("Could not load users."));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (u) => {
    setError("");
    try {
      await api.patch(`/admin-dashboard/users/${u.id}/`, { is_active: !u.is_active });
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  const changeRole = async (u, role) => {
    setError("");
    try {
      await api.patch(`/admin-dashboard/users/${u.id}/`, { role });
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <>
      <PageHead title="Users" subtitle="Set roles: Admin (everything), Editor (content and pictures), User. Deactivate an account to block login." />
      <SearchBox className="mb-4 sm:max-w-sm" placeholder="Search username or email" value={search}
        onChange={(v) => { setSearch(v); setPage(1); }} />
      <ErrorNote>{error}</ErrorNote>
      {!data && !error && <Loading />}
      {data && data.results.length === 0 && <Empty>No users found.</Empty>}

      {/* Phones: cards */}
      <div className="space-y-2.5 md:hidden">
        {data?.results.map((u) => (
          <article key={u.id} className="card p-3.5">
            <div className="flex items-center gap-3">
              <Avatar name={u.username} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{u.username}</p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>
              {u.is_active ? <Pill tone="green">Active</Pill> : <Pill tone="red">Off</Pill>}
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-surface py-1.5"><b className="block text-sm text-navy">{u.favorites_count}</b>Favorites</div>
              <div className="rounded-lg bg-surface py-1.5"><b className="block text-sm text-navy">{u.reviews_count}</b>Reviews</div>
              <div className="rounded-lg bg-surface py-1.5"><b className="block text-sm text-navy">{new Date(u.date_joined).toLocaleDateString()}</b>Joined</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <select className="input !w-auto flex-1 !py-1.5 text-sm" value={u.role} onChange={(e) => changeRole(u, e.target.value)} aria-label="Role">
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn-sm !py-2" onClick={() => toggle(u)}>{u.is_active ? "Deactivate" : "Activate"}</button>
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
                <th className={th}>User</th><th className={th}>Role</th><th className={th}>Joined</th>
                <th className={th}>Favorites</th><th className={th}>Reviews</th><th className={th}>Status</th><th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((u) => (
                <tr key={u.id} className="transition hover:bg-surface/70">
                  <td className={td}>
                    <p className="font-semibold text-navy">{u.username}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className={td}>
                    <select className="input max-w-[8rem] !py-1" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className={td}>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className={td}>{u.favorites_count}</td>
                  <td className={td}>{u.reviews_count}</td>
                  <td className={td}>{u.is_active ? <Pill tone="green">Active</Pill> : <Pill tone="red">Deactivated</Pill>}</td>
                  <td className={`${td} text-right`}>
                    <button className="btn-sm" onClick={() => toggle(u)}>{u.is_active ? "Deactivate" : "Activate"}</button>
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
