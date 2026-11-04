import { useEffect, useState } from "react";
import api from "../services/api.js";

// Banners are uploaded in Admin > Banners. They are fetched once and shared by every page.
let cache = null;
function load() {
  if (!cache) cache = api.get("/banners/").then((r) => r.data).catch(() => { cache = null; return []; });
  return cache;
}
export function clearBannerCache() { cache = null; }

// All banner photos for a page, in the order set by the admin: [{ id, src, caption }].
export function useBanners(page) {
  const [list, setList] = useState([]);
  useEffect(() => {
    let live = true;
    load().then((all) => {
      if (live) setList(all.filter((b) => b.page === page).map((b) => ({ id: b.id, src: b.image, caption: b.caption })));
    });
    return () => { live = false; };
  }, [page]);
  return list;
}

// The first banner photo for a page, or "" when none is uploaded (the default artwork shows).
export function useBanner(page) {
  return useBanners(page)[0]?.src || "";
}

// Inline style that puts the photo behind a .hero-bg section, with a dark veil so text stays readable.
export function bannerStyle(src) {
  if (!src) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(43,26,16,.55), rgba(43,26,16,.78)), url("${src}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}
