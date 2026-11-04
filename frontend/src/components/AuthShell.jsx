import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import Icon from "./Icon.jsx";

const POINTS = [
  ["sparkles", "AI trip matcher", "Describe a trip and get ranked places, costs and the best month."],
  ["calendar", "Day-by-day plans", "Ready itineraries with stay, food and travel costs."],
  ["heart", "Save what you love", "Keep favorite places and trips in one account."],
];

// Phones: a warm header band with the form on a card that overlaps it.
// Desktop: brand panel on the left, centred form card on the right.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[1fr_1fr]">
      <aside className="auth-art relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <Link to="/" aria-label="ExploreSouth home" className="relative z-10"><Logo className="h-14" /></Link>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Your South India trips, planned in one place.</h2>
          <ul className="mt-8 space-y-5">
            {POINTS.map(([icon, t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent"><Icon name={icon} size={20} /></span>
                <span><b className="block">{t}</b><span className="text-sm text-white/70">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/50">Discover · Explore · Experience</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="auth-art relative px-5 pb-12 pt-5 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" aria-label="ExploreSouth home"><Logo className="h-9" /></Link>
            <Link to="/" className="text-xs font-medium text-white/80">← Home</Link>
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
        </header>

        <main className="relative -mt-6 flex-1 rounded-t-3xl bg-surface px-5 pb-10 pt-6 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="mb-6 hidden items-center gap-2 text-sm font-medium text-muted transition hover:text-navy lg:inline-flex">
              <span aria-hidden="true">←</span> Back to home
            </Link>
            <div className="hidden lg:block">
              <h1 className="text-3xl font-bold tracking-tight text-navy">{title}</h1>
              <p className="mb-6 mt-1.5 text-muted">{subtitle}</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_24px_rgba(59,36,23,0.08)] sm:p-6">
              {children}
            </div>
            <p className="mt-5 text-center text-sm text-muted">{footer}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
