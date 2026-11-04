import { useState } from "react";

// The ExploreSouth logo (public/logo.webp). Set the height with className, e.g. "h-12".
// If the file is missing, a simple text logo is shown instead.
export default function Logo({ className = "h-11 sm:h-12" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="font-display text-xl font-semibold tracking-tight text-white">
        Explore<span className="text-accent">South</span>
      </span>
    );
  }
  return (
    <img src="/logo.webp" alt="ExploreSouth" onError={() => setFailed(true)}
      className={`block w-auto ${className}`} />
  );
}
