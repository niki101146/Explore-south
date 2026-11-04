// Small stroke-icon set (24x24 grid). Use <Icon name="pin" />.
const PATHS = {
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
  wallet: <><path d="M3 7a2 2 0 012-2h13a1 1 0 011 1v2" /><rect x="3" y="8" width="18" height="12" rx="2" /><circle cx="16.5" cy="14" r="1.2" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.6 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />,
  mountain: <path d="M3 19l6-10 4 6 2-3 6 7z" />,
  beach: <><circle cx="12" cy="8" r="3.5" /><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></>,
  temple: <><path d="M12 3v3M9 6h6l1 3H8zM7 9h10l1 4H6zM5 13h14v7H5z" /><path d="M11 20v-4h2v4" /></>,
  leaf: <><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z" /><path d="M5 19c3-4 6-7 10-9" /></>,
  landmark: <path d="M3 20h18M5 20V10M9 20V10M15 20V10M19 20V10M3 10l9-6 9 6z" />,
  boat: <><path d="M3 15h18l-2.5 4h-13z" /><path d="M12 3v12M12 4l6 8h-6" /></>,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  home: <path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5" />,
  trip: <><path d="M4 7h16v12H4zM9 7V5h6v2M4 12h16" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M6 18L18 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  send: <path d="M4 12l16-8-6 16-3-6.5z M11 13.5L20 4" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7" /></>,
  speaker: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /></>,
  speakerOff: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></>,
  sliders: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.5a5.5 5.5 0 0111 0V20zM16 5.5a3 3 0 010 5.8M17 14a4.5 4.5 0 014 4.5V20"/></>,
  car: <><path d="M5 16l1.2-6h11.6l1.2 6M4 16h16v4H4zM7 10l1.5-4h7l1.5 4M7.5 16h.01M16.5 16h.01"/></>,
  bed: <><path d="M3 19V7M3 15h18v4M3 11h18v4M7 11V8h4a3 3 0 013 3"/><path d="M21 19v-8"/></>,
  coffee: <><path d="M4 9h13v7a4 4 0 01-4 4H8a4 4 0 01-4-4zM17 11h2a2 2 0 010 4h-2M7 4c-1 1 1 1.5 0 3M11 4c-1 1 1 1.5 0 3"/></>,
  ticket: <><path d="M4 6h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4z"/><path d="M12 7v2M12 12v2M12 17v.01"/></>,
  chart: <><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6"/><path d="M17 7h3v3"/></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3.3 4M6.5 7.6C3.9 9.3 2 12 2 12s3.6 6 10 6c1.4 0 2.7-.3 3.8-.8M9.9 9.9a3 3 0 004.2 4.2" /></>,
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0114 0z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.01" /></>,
  logout: <path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4M15 8l4 4-4 4M19 12H9" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  sparkles: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></>,
};

export function categoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hill") || n.includes("mount")) return "mountain";
  if (n.includes("temple")) return "temple";
  if (n.includes("beach") || n.includes("coast")) return "beach";
  if (n.includes("heritage") || n.includes("fort") || n.includes("palace")) return "landmark";
  if (n.includes("wild") || n.includes("nature") || n.includes("forest")) return "leaf";
  if (n.includes("backwater") || n.includes("lake") || n.includes("river")) return "boat";
  return "compass";
}

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.7 }) {
  if (name === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" />
      </svg>
    );
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.compass}
    </svg>
  );
}
