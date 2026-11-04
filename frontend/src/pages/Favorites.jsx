import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import PageBanner from "../components/PageBanner.jsx";

export default function Favorites() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get("/favorites/").then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const remove = async (id) => {
    await api.delete(`/favorites/${id}/`);
    setItems((list) => list.filter((f) => f.id !== id));
  };

  return (
    <>
    <PageBanner title="Saved destinations" subtitle="Places you have saved for later." />
    <div className="page py-10">

      {items === null && <p className="text-muted">Loading...</p>}
      {items?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-muted">You have not saved anything yet.</p>
          <Link to="/explore" className="btn-primary mt-4">Explore destinations</Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((f) => (
          <div key={f.id} className="card overflow-hidden">
            <Link to={`/destinations/${f.destination_slug}`}>
              {f.cover_image ? (
                <img src={f.cover_image} alt={f.destination_name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-navy-2 to-brand text-5xl font-extrabold text-white/70">
                  {f.destination_name[0]}
                </div>
              )}
            </Link>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <Link to={`/destinations/${f.destination_slug}`} className="font-bold text-navy hover:text-brand-dark">
                  {f.destination_name}
                </Link>
                <p className="text-sm text-muted">{f.city_name}, {f.state_name}</p>
              </div>
              <button onClick={() => remove(f.id)} className="btn-danger">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
