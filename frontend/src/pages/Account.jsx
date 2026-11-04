import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";

// Account hub. Visitors who are not logged in only see a log in / sign up prompt;
// My Trips, Favorites and the rest appear after they sign in.
export default function Account() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const canAdmin = ["admin", "editor"].includes(user?.role);

  if (loading) return <div className="page py-16 text-center text-sm text-muted">Loading…</div>;

  if (!user) {
    const state = { from: "/account", notice: "Please log in to open your account." };
    return (
      <div className="page flex min-h-[60vh] max-w-md items-center py-8">
        <div className="rise w-full rounded-3xl border border-line bg-white p-6 text-center shadow-[0_10px_30px_rgba(59,36,23,0.10)]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand text-brand-dark">
            <Icon name="user" size={30} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-navy">Log in to your account</h1>
          <p className="mt-1.5 text-sm text-muted">Log in or create a free account to see your trips and saved places.</p>
          <div className="mt-5 grid gap-2.5">
            <Link to="/login" state={state} className="btn-primary !py-3">Log in</Link>
            <Link to="/register" state={state} className="btn-outline !py-3">Create free account</Link>
          </div>
        </div>
      </div>
    );
  }

  const rows = [
    ["/trips", "My Trips", "Your planned and confirmed trips", "trip"],
    ["/favorites", "Favorites", "Places you have saved", "heart"],
    ...(canAdmin ? [["/admin", "Admin dashboard", "Manage destinations and users", "shield"]] : []),
    ["/budget", "Budget calculator", "Estimate your trip cost", "wallet"],
    ["/contact", "Help and contact", "Questions? Talk to us", "mail"],
  ];

  return (
    <div className="page max-w-xl py-5 sm:py-10">
      <div className="rise flex items-center gap-3 rounded-2xl bg-navy p-4 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold uppercase text-navy">
          {user.username?.[0]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.username}</p>
          <p className="truncate text-xs capitalize text-white/65">{user.email || user.role}</p>
        </div>
      </div>

      <ul className="card mt-4 divide-y divide-line overflow-hidden">
        {rows.map(([to, title, sub, icon], i) => (
          <li key={to} className="rise" style={{ "--i": i + 1 }}>
            <Link to={to} className="flex items-center gap-3 px-3.5 py-3 transition active:bg-sand hover:bg-sand/60">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-brand-dark">
                <Icon name={icon} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy">{title}</span>
                <span className="block truncate text-xs text-muted">{sub}</span>
              </span>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      <button onClick={() => { logout(); navigate("/"); }} className="btn-outline mt-4 w-full !py-2.5 text-sm">
        <Icon name="logout" size={16} /> Log out
      </button>
    </div>
  );
}
