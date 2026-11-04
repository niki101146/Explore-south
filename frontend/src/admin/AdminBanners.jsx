import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { clearBannerCache } from "../components/useBanner.js";
import { Empty, ErrorNote, Loading, PageHead, Segmented } from "./ui.jsx";

const MAX_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp";

// [key, label, hint]; keep in sync with Banner.Page in the backend.
const PAGES = [
  ["home", "Home", "Slides behind the home page headline. Add several and they scroll."],
  ["explore", "Explore", "Top of the Explore page."],
  ["season", "Best time", "Top of the Best time page."],
  ["budget", "Budget", "Top of the Budget page."],
  ["ai_planner", "AI Planner", "Top of the AI Planner page."],
  ["about", "About us", "Top of the About us page."],
  ["contact", "Contact us", "Top of the Contact us page."],
  ["trips", "Trips, plan and saved", "Top of My trips, Plan a trip, Trip detail and Saved pages."],
];

function tooBig(file) {
  return file && file.size > MAX_MB * 1024 * 1024;
}

// ---------------------------------------------------------------- page banners
function PageBanners() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api.get("/banners/").then((r) => setItems(r.data)).catch(() => setError("Could not load banners."));
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (page, files) => {
    setError("");
    const picked = [...files];
    if (picked.some(tooBig)) { setError(`Each image must be ${MAX_MB} MB or smaller.`); return; }
    setBusy(page);
    try {
      for (const file of picked) {
        const fd = new FormData();
        fd.append("page", page);
        fd.append("image", file);
        await api.post("/banners/", fd);
      }
      clearBannerCache();
      load();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(""); }
  };

  const remove = async (b) => {
    if (!window.confirm("Delete this banner image?")) return;
    try {
      await api.delete(`/banners/${b.id}/`);
      clearBannerCache();
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  const saveCaption = async (b, caption) => {
    if (caption === b.caption) return;
    try {
      await api.patch(`/banners/${b.id}/`, { caption });
      clearBannerCache();
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  if (!items && !error) return <Loading />;

  return (
    <div className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      <p className="text-xs text-muted sm:text-sm">
        Wide photos work best (about 1920 x 700). A dark overlay is added so the text stays readable.
        With no photo, the default artwork is shown.
      </p>
      {PAGES.map(([key, label, hint]) => {
        const mine = (items || []).filter((b) => b.page === key);
        const multi = key === "home";
        return (
          <section key={key} className="card p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-navy">{label}</h2>
                <p className="text-xs text-muted">{hint}</p>
              </div>
              <label className="btn-primary cursor-pointer !px-3 !py-1.5 !text-xs">
                {busy === key ? "Uploading..." : multi ? "+ Add photos" : mine.length ? "+ Add another" : "+ Upload photo"}
                <input type="file" accept={ACCEPT} multiple={multi} className="sr-only" disabled={busy === key}
                  onChange={(e) => { upload(key, e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            {mine.length === 0 ? (
              <p className="mt-3 rounded-xl bg-sand px-3 py-4 text-center text-xs text-muted">No photo yet. The default artwork is showing.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {mine.map((b, i) => (
                  <figure key={b.id} className="overflow-hidden rounded-xl ring-1 ring-line">
                    <div className="relative">
                      <img src={b.image} alt="" className="h-24 w-full object-cover sm:h-28" />
                      {!multi && i === 0 && mine.length > 1 && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">In use</span>
                      )}
                      <button type="button" onClick={() => remove(b)} aria-label="Delete banner"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white transition hover:bg-red-600">
                        ×
                      </button>
                    </div>
                    {multi && (
                      <input defaultValue={b.caption} placeholder="Caption (optional)" maxLength={120}
                        onBlur={(e) => saveCaption(b, e.target.value.trim())}
                        className="w-full border-0 bg-white px-2 py-1.5 text-xs outline-none" aria-label="Caption" />
                    )}
                  </figure>
                ))}
              </div>
            )}
            {!multi && mine.length > 1 && (
              <p className="mt-2 text-[11px] text-muted">Only the first photo is used on this page. Delete the others to switch.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- state images
function StateImages() {
  const [states, setStates] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api.get("/states/").then((r) => setStates(r.data)).catch(() => setError("Could not load states."));
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (s, file) => {
    if (!file) return;
    if (tooBig(file)) { setError(`Image must be ${MAX_MB} MB or smaller.`); return; }
    setError("");
    setBusy(s.id);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.patch(`/states/${s.id}/`, fd);
      load();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(null); }
  };

  const clear = async (s) => {
    if (!window.confirm(`Remove the photo for ${s.name}?`)) return;
    try {
      // An empty value clears an ImageField in a multipart request.
      const fd = new FormData();
      fd.append("image", "");
      await api.patch(`/states/${s.id}/`, fd);
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  if (!states && !error) return <Loading />;
  if (states && states.length === 0) return <Empty>No states yet.</Empty>;

  return (
    <div className="space-y-3">
      <ErrorNote>{error}</ErrorNote>
      <p className="text-xs text-muted sm:text-sm">
        These photos appear on the home page under Explore by state. Landscape photos about 800 x 500 work best.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {states?.map((s) => (
          <article key={s.id} className="card overflow-hidden">
            <div className="relative h-32 bg-sand">
              {s.image
                ? <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-xs text-muted">No photo yet</div>}
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-sm font-semibold text-white">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 p-2.5">
              <label className="btn-outline cursor-pointer !px-3 !py-1.5 !text-xs">
                {busy === s.id ? "Uploading..." : s.image ? "Replace" : "Upload"}
                <input type="file" accept={ACCEPT} className="sr-only" disabled={busy === s.id}
                  onChange={(e) => { upload(s, e.target.files[0]); e.target.value = ""; }} />
              </label>
              {s.image && (
                <button type="button" onClick={() => clear(s)} className="px-2 py-1.5 text-xs font-semibold text-red-600 hover:underline">Remove</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [tab, setTab] = useState("banners");
  return (
    <>
      <PageHead title="Banners and images" subtitle="Photos for the top of each page and for the home page state cards." />
      <Segmented value={tab} onChange={setTab} options={[["banners", "Page banners"], ["states", "State images"]]} />
      {tab === "banners" ? <PageBanners /> : <StateImages />}
    </>
  );
}
