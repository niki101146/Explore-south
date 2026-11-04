import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";
import PasswordInput from "../components/PasswordInput.jsx";
import AuthShell from "../components/AuthShell.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Free, and takes less than a minute"
      footer={<>Already registered? <Link to="/login" state={location.state} className="font-semibold text-brand-dark">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Username</label>
          <input className="input" value={form.username} onChange={set("username")} required /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set("email")} required /></div>
        <div><label className="label">Password</label>
          <PasswordInput minLength={8} autoComplete="new-password" value={form.password}
            onChange={set("password")} placeholder="At least 8 characters" required /></div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
