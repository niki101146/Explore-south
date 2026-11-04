import { useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { SITE } from "../siteInfo.js";
import Icon from "../components/Icon.jsx";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const EMPTY = { name: "", email: "", message: "", website: "" };

export default function Contact() {
  const bannerImg = useBanner("contact");
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDone("");
    setBusy(true);
    try {
      const { data } = await api.post("/contact/", form);
      setDone(data.detail || "Thanks! Your message has been sent.");
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.status === 429
        ? "Too many messages from this device. Please try again later."
        : errorMessage(err, "Could not send your message. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    ["mail", "Email", SITE.email, `mailto:${SITE.email}`],
    ["phone", "Phone", SITE.phone, `tel:${SITE.phone.replace(/\s/g, "")}`],
  ];

  return (
    <>
      <section className="hero-bg text-white" style={bannerStyle(bannerImg)}>
        <div className="page py-14">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">Contact us</h1>
          <p className="mt-3 max-w-2xl text-white/75">Questions, corrections or suggestions? We would like to hear from you.</p>
        </div>
      </section>

      <section className="page grid gap-8 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {cards.map(([icon, label, value, href]) => (
            <a key={label} href={href} className="card flex items-center gap-4 p-5 transition hover:border-brand">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
                <Icon name={icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
                <span className="block truncate font-semibold text-navy">{value}</span>
              </span>
            </a>
          ))}
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-navy">Send a message</h2>

          {/* Honeypot field: hidden from people, filled by bots */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
            value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">Your name</label>
              <input id="c-name" className="input" required maxLength={100} value={form.name} onChange={set("name")} />
            </div>
            <div>
              <label className="label" htmlFor="c-email">Your email</label>
              <input id="c-email" type="email" className="input" required value={form.email} onChange={set("email")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-msg">Message</label>
            <textarea id="c-msg" rows={5} className="input" required minLength={10} maxLength={3000}
              value={form.message} onChange={set("message")} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
          {done && <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark" role="status">{done}</p>}

          <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Sending..." : "Send message"}</button>
        </form>
      </section>
    </>
  );
}
