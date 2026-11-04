import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURE = { "/trips": "My Trips", "/favorites": "Favorites" };

// roles: optional list such as ["admin", "editor"]. Omit it to only require a login.
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-10 text-center text-muted">Loading...</p>;
  if (!user) {
    const base = "/" + location.pathname.split("/")[1];
    const name = FEATURE[base];
    const notice = location.pathname.startsWith("/trips/new")
      ? "Please log in to plan and confirm your trip."
      : name ? `Please log in to open ${name}.` : "Please log in to continue.";
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search, notice }} />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
