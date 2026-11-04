import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";
import Navbar from "./Navbar.jsx";
import ChatWidget from "./ChatWidget.jsx";
import BottomNav from "./BottomNav.jsx";
import ScrollProgress from "./ScrollProgress.jsx";
import useAutoReveal from "../hooks/useAutoReveal.js";

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useAutoReveal("main");
  const { user, loading } = useAuth();
  // Admins and editors stay in the admin area; the website opens only after "Back to website".
  const viewSite = (() => { try { return sessionStorage.getItem("es-view-site") === "1"; } catch { return false; } })();
  if (!loading && ["admin", "editor"].includes(user?.role) && !viewSite) return <Navigate to="/admin" replace />;
  return (
    <div className="public-shell flex min-h-screen flex-col max-md:pb-16">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <BottomNav />
      <ChatWidget />
    </div>
  );
}
