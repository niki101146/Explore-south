import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { PageHead } from "./ui.jsx";

const EMPTY = {
  name: "", city: "", categories: [], short_description: "", description: "",
  latitude: "", longitude: "", best_season: "all_year", best_time_to_visit: "",
  avg_daily_budget: 0, how_to_reach: "", travel_tips: "",
  is_featured: false, is_published: true, last_verified: "",
};

export default function DestinationForm({ slug, onClose }) {
  const [f, setF] = useState(EMPTY);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cover, setCover] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [destId, setDestId] = useState(null);
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState({ file: null, caption: "" });
  const [newCity, setNewCity] = useState({ open: false, state: "", name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const check = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  const loadCities = () => api.get("/cities/").then((r) => setCities(r.data));

  useEffect(() => {
    loadCities().catch(() => {});
    api.get("/states/").then((r) => setStates(r.data)).catch(() => {});
    api.get("/categories/").then((r) => setCategories(r.data)).catch(() => {});
    if (slug) {
      api.get(`/destinations/${slug}/`).then(({ data }) => {
        setDestId(data.id);
        setImages(data.images);
        setCoverUrl(data.cover_image || "");
        setF({
          name: data.name, city: String(data.city_id), categories: data.categories.map((c) => c.id),
          short_description: data.short_description || "", description: data.description || "",
          latitude: data.latitude ?? "", longitude: data.longitude ?? "",
          best_season: data.best_season, best_time_to_visit: data.best_time_to_visit || "",
          avg_daily_budget: data.avg_daily_budget, how_to_reach: data.how_to_reach || "",
          travel_tips: data.travel_tips || "", is_featured: data.is_featured,
          is_published: data.is_published, last_verified: data.last_verified || "",
        });
      }).catch(() => setError("Could not load this destination."));
    }
  }, [slug]);

  const toggleCategory = (id) =>
    setF({ ...f, categories: f.categories.includes(id) ? f.categories.filter((x) => x !== id) : [...f.categories, id] });

  const addCity = async () => {
    try {
      const { data } = await api.post("/cities/", { state: newCity.state, name: newCity.name });
      await loadCities();
      setF({ ...f, city: String(data.id) });
      setNewCity({ open: false, state: "", name: "" });
    } catch (e) { setError(errorMessage(e)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => {
        if (k === "categories") v.forEach((id) => fd.append("categories", id));
        else if (typeof v === "boolean") fd.append(k, v ? "true" : "false");
        else fd.append(k, v ?? "");
      });
      if (cover) fd.append("cover_image", cover);
      if (slug) await api.put(`/destinations/${slug}/`, fd);
      else await api.post("/destinations/", fd);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const MAX_MB = 5;
  const pickCover = (file) => {
    if (file && file.size > MAX_MB * 1024 * 1024) {
      setError(`Cover image must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setError("");
    setCover(file || null);
  };

  const uploadImage = async () => {
    if (!newImage.file) return;
    if (newImage.file.size > MAX_MB * 1024 * 1024) { setError(`Image must be ${MAX_MB} MB or smaller.`); return; }
    try {
      const fd = new FormData();
      fd.append("destination", destId);
      fd.append("image", newImage.file);
      fd.append("caption", newImage.caption);
      const { data } = await api.post("/destination-images/", fd);
      setImages([...images, data]);
      setNewImage({ file: null, caption: "" });
    } catch (err) { setError(errorMessage(err)); }
  };

  const deleteImage = async (id) => {
    await api.delete(`/destination-images/${id}/`);
    setImages(images.filter((i) => i.id !== id));
  };

  return (
    <>
      <PageHead title={slug ? "Edit destination" : "Add destination"}>
        <button className="btn-outline !py-2" onClick={onClose}>← Back</button>
      </PageHead>

      <form onSubmit={submit} className="space-y-4">
        <div className="card grid gap-3 p-3.5 sm:grid-cols-2 sm:p-5">
          <h2 className="font-bold text-navy sm:col-span-2">Basics</h2>
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required value={f.name} onChange={set("name")} />
          </div>

          <div>
            <label className="label">City</label>
            <select className="input" required value={f.city} onChange={set("city")}>
              <option value="">Choose a city</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.state_name})</option>)}
            </select>
            <button type="button" className="mt-1 text-xs font-semibold text-brand-dark"
              onClick={() => setNewCity({ ...newCity, open: !newCity.open })}>
              + Add a new city
            </button>
            {newCity.open && (
              <div className="mt-2 grid gap-2 rounded-lg bg-surface p-3">
                <select className="input" value={newCity.state}
                  onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}>
                  <option value="">State</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input className="input" placeholder="City name" value={newCity.name}
                  onChange={(e) => setNewCity({ ...newCity, name: e.target.value })} />
                <button type="button" className="btn-primary" onClick={addCity}
                  disabled={!newCity.state || !newCity.name}>Save city</button>
              </div>
            )}
          </div>


          <div className="sm:col-span-2">
            <label className="label">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c.id} onClick={() => toggleCategory(c.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    f.categories.includes(c.id)
                      ? "border-brand bg-brand/10 text-brand-dark" : "border-line bg-white text-slate-600"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Short description</label>
            <input className="input" maxLength={255} value={f.short_description} onChange={set("short_description")} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Full description</label>
            <textarea className="input" rows={5} required value={f.description} onChange={set("description")} />
          </div>
          <div>
            <label className="label">Best time to visit</label>
            <input className="input" value={f.best_time_to_visit} onChange={set("best_time_to_visit")} />
          </div>
          <div>
            <label className="label">Daily budget per person (₹)</label>
            <input type="number" min="0" className="input" value={f.avg_daily_budget} onChange={set("avg_daily_budget")} />
          </div>
          <div>
            <label className="label">Latitude</label>
            <input className="input" value={f.latitude} onChange={set("latitude")} placeholder="11.410200" />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input className="input" value={f.longitude} onChange={set("longitude")} placeholder="76.695000" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">How to reach</label>
            <textarea className="input" rows={2} value={f.how_to_reach} onChange={set("how_to_reach")} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Travel tips</label>
            <textarea className="input" rows={2} value={f.travel_tips} onChange={set("travel_tips")} />
          </div>
        </div>

        <div className="card grid gap-3 p-3.5 sm:grid-cols-2 sm:p-5">
          <h2 className="font-bold text-navy sm:col-span-2">Cover and publishing</h2>
          <div>
            <label className="label">Cover image</label>
            {coverUrl && !cover && <img src={coverUrl} alt="" className="mb-2 h-28 rounded-lg object-cover" />}
            <input type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pickCover(e.target.files[0])} className="text-sm" />
          </div>
          <div>
            <label className="label">Details last verified</label>
            <input type="date" className="input" value={f.last_verified} onChange={set("last_verified")} />
            <p className="mt-1 text-xs text-muted">Set when you have checked fees, timings and contacts.</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm">
            <input type="checkbox" checked={f.is_featured} onChange={check("is_featured")} /> Featured on home page
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm">
            <input type="checkbox" checked={f.is_published} onChange={check("is_published")} /> Published (visible to visitors)
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save destination"}</button>
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>

      {slug && (
        <div className="card mt-4 p-3.5 sm:p-5">
          <h2 className="mb-3 font-bold text-navy">Gallery</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((im) => (
              <div key={im.id} className="relative">
                <img src={im.image} alt={im.caption} className="h-28 w-full rounded-lg object-cover" />
                <button type="button" onClick={() => deleteImage(im.id)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-2 text-sm text-red-600">×</button>
              </div>
            ))}
            {images.length === 0 && <p className="col-span-full text-sm text-muted">No gallery images yet.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm"
              onChange={(e) => setNewImage({ ...newImage, file: e.target.files[0] || null })} />
            <input className="input max-w-xs" placeholder="Caption (optional)" value={newImage.caption}
              onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })} />
            <button type="button" className="btn-outline" onClick={uploadImage} disabled={!newImage.file}>Upload</button>
          </div>
        </div>
      )}
    </>
  );
}
