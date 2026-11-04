import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { bannerStyle, useBanner } from "../components/useBanner.js";

const FEATURES = [
  ["pin", "Real attractions", "Entry fees, timings and how to reach, listed for each place."],
  ["calendar", "Ready trip plan", "Pick dates and travelers and get a day-by-day plan with stay, food and travel."],
  ["wallet", "Total cost up front", "See the full amount before you confirm, then get the booking by email."],
  ["shield", "Details you can trust", "Each place shows when its details were last verified."],
];

export default function About() {
  const bannerImg = useBanner("about");
  return (
    <>
      <section className="hero-bg text-white" style={bannerStyle(bannerImg)}>
        <div className="page py-14">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">About ExploreSouth</h1>
          <p className="mt-3 max-w-2xl text-white/75">
            A simple travel guide and planner for South India: Tamil Nadu, Kerala, Karnataka,
            Andhra Pradesh and Telangana.
          </p>
        </div>
      </section>

      <section className="page grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <h2 className="h-section">Why we built it</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Planning a trip often means jumping between many websites to check ticket prices, opening hours
            and travel time. ExploreSouth brings these together in one place, so you can pick a destination,
            see what is worth visiting, plan each day and know roughly what the trip will cost.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            Fees and timings can change, so we show when each detail was last verified. Please confirm
            locally before you travel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/explore" className="btn-primary">Explore destinations</Link>
            <Link to="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([icon, title, text]) => (
            <div key={title} className="card p-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
                <Icon name={icon} size={20} />
              </span>
              <h3 className="font-semibold text-navy">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
