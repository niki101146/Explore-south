import { bannerStyle, useBanner } from "./useBanner.js";
// Nature banner (sky, sun and green hills) shared by every inner page.
export default function PageBanner({ title, subtitle, children }) {
  const bannerImg = useBanner("trips");
  return (
    <section className="hero-bg text-white" style={bannerStyle(bannerImg)}>
      <div className="page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-white/85">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
