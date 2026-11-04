import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import HeroArt from "./HeroArt.jsx";

const INTERVAL = 5500; // ms between slides

// Auto-scrolling hero background. Slides crossfade with a slow zoom.
// slides: [{ id, src, name, place, to }]. With no photos it falls back to the built-in artwork.
export default function HeroSlider({ slides = [] }) {
  const [i, setI] = useState(0);
  const count = slides.length;
  const reduce = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { setI(0); }, [count]);

  // A fresh timer after every change, so clicking a dot restarts the countdown.
  useEffect(() => {
    if (count < 2 || reduce) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % count), INTERVAL);
    return () => clearTimeout(t);
  }, [i, count, reduce]);

  if (count === 0) return <HeroArt photo className="pointer-events-none absolute inset-0 z-0" />;

  const current = slides[i] || slides[0];
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-800" aria-hidden="true">
        {slides.map((s, idx) => (
          <div key={s.id} className={`hero-slide ${idx === i ? "is-active" : ""}`}>
            <img src={s.src} alt="" loading={idx === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-[3.75rem] z-10 sm:bottom-16 lg:bottom-24">
        <div className="page flex items-center justify-center gap-4 sm:justify-between">
          {current.name ? <Link to={current.to}
            className="inline-flex min-w-0 items-center gap-1.5 max-sm:hidden rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-black/50">
            <Icon name="pin" size={13} />
            <span className="truncate">{current.name}{current.place ? `, ${current.place}` : ""}</span>
          </Link> : <span />}
          {count > 1 && (
            <div className="flex items-center gap-2" role="tablist" aria-label="Banner slides">
              {slides.map((s, idx) => (
                <button key={s.id} type="button" role="tab" aria-selected={idx === i}
                  aria-label={`Show slide ${idx + 1}`} onClick={() => setI(idx)}
                  className={`h-2 rounded-full transition-all ${idx === i ? "w-7 bg-accent" : "w-2 bg-white/60 hover:bg-white"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
