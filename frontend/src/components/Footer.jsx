import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import Logo from "./Logo.jsx";

// Slim footer. It is only rendered on the Home page.
export default function Footer() {
  const [states, setStates] = useState([]);
  useEffect(() => {
    api.get("/states/").then((r) => setStates(r.data)).catch(() => {});
  }, []);

  const head = "mb-2 text-[11px] font-bold uppercase tracking-widest text-white/90";
  const link = "text-[13px] text-white/65 transition hover:text-accent";
  return (
    <footer className="mt-10 bg-navy text-white sm:mt-14">
      <div className="page flex flex-col gap-6 py-7 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo className="h-9 sm:h-11" />
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            Travel guide and trip planner for Tamil Nadu, Kerala, Karnataka, Andhra Pradesh and Telangana.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 sm:gap-x-16">
          <div>
            <p className={head}>Explore</p>
            <ul className="space-y-1.5">
              <li><Link to="/explore" className={link}>All destinations</Link></li>
              <li><Link to="/ai-planner" className={link}>AI Trip Matcher</Link></li>
              <li><Link to="/budget" className={link}>Budget calculator</Link></li>
              <li><Link to="/about" className={link}>About us</Link></li>
              <li><Link to="/contact" className={link}>Contact us</Link></li>
            </ul>
          </div>
          <div>
            <p className={head}>By state</p>
            <ul className="space-y-1.5">
              {states.map((s) => (
                <li key={s.id}><Link to={`/explore?state=${s.slug}`} className={link}>{s.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page flex flex-col gap-0.5 py-3 text-center text-[11px] text-white/50 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} ExploreSouth</p>
          <p>Fees and timings change. Please confirm locally before you travel.</p>
        </div>
      </div>
    </footer>
  );
}
