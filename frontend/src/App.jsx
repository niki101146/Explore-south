import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import DestinationDetail from "./pages/DestinationDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Favorites from "./pages/Favorites.jsx";
import Trips from "./pages/Trips.jsx";
import Account from "./pages/Account.jsx";
import PlanTrip from "./pages/PlanTrip.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import Budget from "./pages/Budget.jsx";
import SeasonPlanner from "./pages/SeasonPlanner.jsx";
import AiPlanner from "./pages/AiPlanner.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminOverview from "./admin/AdminOverview.jsx";
import AdminDestinations from "./admin/AdminDestinations.jsx";
import AdminAttractions from "./admin/AdminAttractions.jsx";
import AdminReviews from "./admin/AdminReviews.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminMessages from "./admin/AdminMessages.jsx";
import AdminBookings from "./admin/AdminBookings.jsx";
import AdminBanners from "./admin/AdminBanners.jsx";

// Editors have no dashboard stats, so send them straight to Destinations.
function AdminHome() {
  const { user } = useAuth();
  return user.role === "admin" ? <AdminOverview /> : <Navigate to="/admin/destinations" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/season" element={<SeasonPlanner />} />
        <Route path="/ai-planner" element={<AiPlanner />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
        <Route path="/trips" element={<RequireAuth><Trips /></RequireAuth>} />
        <Route path="/trips/new" element={<RequireAuth><PlanTrip /></RequireAuth>} />
        <Route path="/trips/:id" element={<RequireAuth><TripDetail /></RequireAuth>} />
        <Route path="*" element={<p className="p-16 text-center text-muted">Page not found.</p>} />
      </Route>

      <Route path="/admin" element={<RequireAuth roles={["admin", "editor"]}><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminHome />} />
        <Route path="destinations" element={<AdminDestinations />} />
        <Route path="attractions" element={<AdminAttractions />} />
        <Route path="banners" element={<RequireAuth roles={["admin"]}><AdminBanners /></RequireAuth>} />
        <Route path="reviews" element={<RequireAuth roles={["admin"]}><AdminReviews /></RequireAuth>} />
        <Route path="bookings" element={<RequireAuth roles={["admin"]}><AdminBookings /></RequireAuth>} />
        <Route path="messages" element={<RequireAuth roles={["admin"]}><AdminMessages /></RequireAuth>} />
        <Route path="users" element={<RequireAuth roles={["admin"]}><AdminUsers /></RequireAuth>} />
      </Route>
    </Routes>
  );
}
