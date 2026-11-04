import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";
import Icon from "./Icon.jsx";

// [path, label, icon, needsLogin]
const LINKS = [
  ["/", "Home", "home", false],
  ["/explore", "Explore", "compass", false],
  ["/season", "Best time", "sun", false],
  ["/budget", "Budget", "wallet", false],
  ["/ai-planner", "AI Planner", "sparkles", false],
  ["/trips", "My Trips", "trip", true],
  ["/favorites", "Favorites", "heart", true],
  ["/about", "About us", "info", false],
  ["/contact", "Contact us", "pin", false],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);
  const canAdmin = ["admin", "editor"].includes(user?.role);

  // Close the mobile menu on navigation, and lock page scroll while it is open.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const desktopLink = ({ isActive }) =>
    `relative flex items-center gap-1.5 whitespace-nowrap px-2 py-2 text-[13px] 2xl:px-3.5 2xl:text-sm font-medium transition after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent after:transition ${
      isActive ? "text-white after:opacity-100" : "text-white/70 after:opacity-0 hover:text-white"
    }`;
  const mobileLink = ({ isActive }) =>
    `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
      isActive ? "bg-white/12 text-accent" : "text-white/80 active:bg-white/10"
    }`;

  // Logged-out visitors still see every link; protected ones show a lock and
  // send them to the login page (RequireAuth explains why and brings them back).
  // On phones My Trips and Favorites live under Account, so the drawer leaves them out.
  const renderLinks = (cls, mobile) => (
    <>
      {LINKS.filter(([to]) => !mobile || !["/trips", "/favorites"].includes(to)).map(([to, label, icon, needsLogin]) => (
        <NavLink key={to} to={to} end={to === "/"} className={cls}
          title={needsLogin && !user ? "Log in required" : undefined}>
          {mobile && <Icon name={icon} size={18} className="shrink-0" />}
          <span>{label}</span>
          {needsLogin && !user && (
            <Icon name="lock" size={mobile ? 16 : 13} className={mobile ? "ml-auto opacity-60" : "opacity-60"} />
          )}
        </NavLink>
      ))}
      {canAdmin && (
        <NavLink to="/admin" className={cls}>
          {mobile && <Icon name="shield" size={18} className="shrink-0" />}<span>Admin</span>
        </NavLink>
      )}
    </>
  );

  const doLogout = () => { logout(); close(); navigate("/"); };

  return (
    <>
    <header className={`sticky top-0 z-[1000] border-b border-white/10 text-white backdrop-blur-md transition-all duration-300 ${scrolled ? "nav-scrolled bg-navy/95" : "bg-navy/80"}`}>
      <nav className={`page flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-[58px] xl:h-[60px]" : "h-[64px] xl:h-[72px]"}`} aria-label="Main">
        <Link to="/" onClick={close} aria-label="ExploreSouth home"><Logo /></Link>

        <div className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
          {renderLinks(desktopLink, false)}
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <Link to="/explore" aria-label="Search destinations"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white">
            <Icon name="search" size={19} />
          </Link>
          {user ? (
            <>
              <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm text-white/90">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase text-navy">
                  {user.username?.[0]}
                </span>
                {user.username}
              </span>
              <button onClick={doLogout} className="btn-ghost !py-2">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white">Log in</Link>
              <Link to="/register" className="btn-accent">Sign up</Link>
            </>
          )}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} size={26} />
        </button>
      </nav>

    </header>

      {/* Mobile menu: a drawer in a portal. It must live outside the header, because the header's
          backdrop blur would otherwise make this fixed panel size itself to the 64px bar. */}
      {open && createPortal(
        <div className="fixed inset-0 z-[1100] xl:hidden" style={{ position: "fixed", inset: 0, zIndex: 1100 }} role="dialog" aria-modal="true" aria-label="Site menu">
          <button type="button" aria-label="Close menu" onClick={close} className="drawer-overlay" style={{ position: "absolute", inset: 0, background: "rgba(20,10,4,0.55)", border: 0 }} />
          <aside id="mobile-menu" className="drawer-panel flex flex-col text-white shadow-2xl"
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(64vw, 14rem)", background: "#3b2417" }}>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 pl-4 pr-1.5">
              <Link to="/" onClick={close} aria-label="ExploreSouth home"><Logo className="h-8" /></Link>
              <button type="button" aria-label="Close menu" onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10">
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
              {user ? (
                <Link to="/account" onClick={close} className="mb-3 flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold uppercase text-navy">
                    {user.username?.[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{user.username}</span>
                    <span className="block text-[11px] text-white/60">My account, trips, favorites</span>
                  </span>
                  <Icon name="chevron" size={15} className="text-white/50" />
                </Link>
              ) : (
                <div className="mb-3 rounded-xl bg-white/10 p-3">
                  <p className="text-sm font-semibold">Welcome to ExploreSouth</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/65">Create a free account to save places and plan trips.</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <Link to="/register" onClick={close} className="btn-accent !px-2 !py-1.5 !text-xs">Sign up</Link>
                    <Link to="/login" onClick={close} className="btn-ghost !px-2 !py-1.5 !text-xs">Log in</Link>
                  </div>
                </div>
              )}
              <nav aria-label="Menu" className="flex flex-col gap-0.5">{renderLinks(mobileLink, true)}</nav>
            </div>

            {user && (
              <div className="shrink-0 border-t border-white/10 p-3">
                <button onClick={doLogout} className="btn-ghost w-full !py-2 !text-sm">Log out</button>
              </div>
            )}
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}