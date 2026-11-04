import { useEffect } from "react";

// Adds a scroll-reveal animation to the content of every public page without editing each page.
//  * blocks:   direct children of <section> and of .page containers fade up as they enter the screen
//  * grids:    cards inside a grid animate one after another (staggered)
//  * opt in:   any element with data-reveal; opt out: data-no-reveal on the element or an ancestor
// Elements are hidden only after this script marks them, and are always shown again when they
// scroll into view (or when they are already above the viewport), so nothing can stay invisible.
const BLOCKS = "section > *, .page > *, [data-reveal]";
const GRID_ITEMS = "section > .grid > *, .page > .grid > *, section > div > .grid > *, .page > div > .grid > *";

export default function useAutoReveal(rootSelector = "main") {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return undefined;
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;

    const show = (el) => { el.classList.add("is-in"); io.unobserve(el); };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting || e.boundingClientRect.top < 0) show(e.target); });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    const eligible = (el) => {
      if (el.dataset.rv || el.closest("[data-no-reveal]") || el.closest(".fan-card, .hero-slide, .leaflet-container")) return false;
      const pos = getComputedStyle(el).position;
      if (pos === "absolute" || pos === "fixed" || pos === "sticky") return false;
      if (getComputedStyle(el).display === "none") return false;
      return el.getBoundingClientRect().bottom > 0; // skip what is already scrolled past
    };
    const mark = (el, delay = 0) => {
      el.dataset.rv = "1";
      el.classList.add("reveal");
      if (delay) el.style.setProperty("--rd", `${delay}ms`);
      io.observe(el);
    };

    const scan = () => {
      const gridItems = new Set(root.querySelectorAll(GRID_ITEMS));
      root.querySelectorAll(BLOCKS).forEach((el) => {
        if (gridItems.has(el) || !eligible(el)) return;
        if (el.closest(".reveal")) return;                 // an ancestor already animates
        if (el.querySelector(".grid")) {                   // let a grid's cards animate instead of the block
          const hasItems = [...gridItems].some((g) => el.contains(g));
          if (hasItems) return;
        }
        mark(el);
      });
      gridItems.forEach((el) => {
        if (!eligible(el) || el.closest(".reveal")) return;
        const index = [...el.parentElement.children].indexOf(el);
        mark(el, Math.min(index, 8) * 80);
      });
    };

    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); };
    scan();
    const mo = new MutationObserver(schedule);   // pages load their data after first render
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame); mo.disconnect(); io.disconnect();
      // Undo the markers so the next run (React StrictMode re-runs effects on first load in dev)
      // can observe these elements again instead of skipping them and leaving them hidden.
      root.querySelectorAll("[data-rv]").forEach((el) => {
        delete el.dataset.rv;
        el.classList.remove("reveal", "is-in");
        el.style.removeProperty("--rd");
      });
    };
  }, [rootSelector]);
}
