import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

const KEY = "es-theme";
const read = () => {
  try { const v = localStorage.getItem(KEY); if (v) return v; } catch { /* ignore */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Bright / dark switch. The choice is saved in this browser and applied to <html data-theme>.
export default function ThemeToggle({ label = false, onLight = false }) {
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const dark = theme === "dark";
  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to bright mode" : "Switch to dark mode"} title={dark ? "Bright mode" : "Dark mode"}
      className={`theme-toggle ${onLight ? "on-light" : ""} ${label ? "px-3" : ""}`}>
      <Icon name={dark ? "sun" : "moon"} size={19} />
      {label && <span className="text-sm font-medium">{dark ? "Bright mode" : "Dark mode"}</span>}
    </button>
  );
}
