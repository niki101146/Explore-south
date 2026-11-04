import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";

// [path, label, icon, end?, adminOnly?]
const NAV = [
  ["/admin", "Overview", "chart", true, true],
  ["/admin/destinations", "Destinations", "map"],
  ["/admin/attractions", "Attractions", "landmark"],
  ["/admin/banners", "Banners", "image", false, true],
  ["/admin/reviews", "Reviews", "star", false, true],
  ["/admin/bookings", "Bookings", "ticket", false, true],
  ["/admin/messages", "Messages", "mail", false, true],
  ["/admin/users", "Users", "users", false, true],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { try { sessionStorage.removeItem("es-view-site"); } catch { /* ignore */ } }, []);
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

  const openSite = () => { try { sessionStorage.setItem("es-view-site", "1"); } catch { /* ignore */ } };
  const signOut = () => { try { sessionStorage.removeItem("es-view-site"); } catch { /* ignore */ } logout(); navigate("/"); };

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? "bg-accent text-navy shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
    }`;

  const items = NAV.filter(([, , , , adminOnly]) => !adminOnly || user.role === "admin");

  // Sidebar content, shared by the desktop sidebar and the phone drawer.
  const panel = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <Link to="/admin" aria-label="Admin home"><Logo className="h-9" /></Link>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {items.map(([to, label, icon, end]) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <Icon name={icon} size={18} className="shrink-0" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold uppercase text-navy">{user.username?.[0]}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.username}</span>
            <span className="block text-[11px] capitalize text-white/60">{user.role}</span>
          </span>
        </div>
        <Link to="/" onClick={openSite} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
          <Icon name="home" size={17} /> Back to website
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
          <Icon name="logout" size={17} /> Log out
        </button>
      </div>
    </>
  );

  const current = items.find(([to, , , end]) => (end ? pathname === to : pathname.startsWith(to)));

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        {panel}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar with the hamburger */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-navy px-2 text-white shadow-md lg:hidden">
          <button type="button" aria-label="Open admin menu" aria-expanded={open} onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95">
            <Icon name="menu" size={24} />
          </button>
          <span className="min-w-0 flex-1 truncate text-base font-semibold">{current?.[1] || "Admin"}</span>
          <Link to="/" onClick={openSite} aria-label="Back to website" className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold">
            <Icon name="home" size={14} /> Site
          </Link>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Phone drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="drawer-overlay absolute inset-0 bg-black/55" />
          <aside className="drawer-left absolute bottom-0 left-0 top-0 flex w-[78vw] max-w-[18rem] flex-col bg-navy text-white shadow-2xl">
            {panel}
          </aside>
        </div>
      )}
    </div>
  );
}
