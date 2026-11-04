import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

// [path, label, icon]
const ITEMS = [
  ["/", "Home", "home"],
  ["/explore", "Explore", "compass"],
  ["/season", "Best time", "sun"],
  ["/ai-planner", "AI Planner", "sparkles"],
  ["/account", "Account", "user"],
];

// Pages that live inside the Account tab (My Trips, Favorites) keep it highlighted.
const ACCOUNT_PATHS = ["/account", "/trips", "/favorites"];

// Slim floating bar at the bottom of the screen on phones. The top menu still has the other links.
export default function BottomNav() {
  const { pathname } = useLocation();
  if (pathname === "/trips/new") return null; // that page has its own confirm bar
  const inAccount = ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-4 bottom-2.5 z-[880] md:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto flex max-w-sm items-stretch rounded-2xl bg-navy/95 p-1 shadow-[0_8px_24px_rgba(43,24,12,0.35)] ring-1 ring-white/10 backdrop-blur-md">
        {ITEMS.map(([to, label, icon]) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink to={to} end={to === "/"}
              className={({ isActive }) => {
                const on = to === "/account" ? inAccount : isActive;
                return `flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold leading-tight transition ${
                  on ? "bg-white/15 text-accent" : "text-white/70 active:bg-white/10"}`;
              }}>
              <Icon name={icon} size={18} />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
