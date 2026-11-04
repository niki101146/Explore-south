import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";
import PasswordInput from "../components/PasswordInput.jsx";
import AuthShell from "../components/AuthShell.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Invalid username or password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your account"
      footer={<>No account? <Link to="/register" state={location.state} className="font-semibold text-brand-dark">Sign up</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {location.state?.notice && (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-navy">{location.state.notice}</p>
        )}
        <div>
          <label className="label">Username</label>
          <input className="input" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password</label>
          <PasswordInput value={form.password} autoComplete="current-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
