// Shows a destination photo, or a generated landscape tile when no photo is uploaded.
const TONES = [
  ["#c2762b", "#3b2417"],
  ["#f2b84b", "#7a4a12"],
  ["#9a5b2a", "#2b1a10"],
  ["#d89a4f", "#4a2c18"],
  ["#6b4a35", "#3b2417"],
];

function hash(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Cover({ name, src, className = "" }) {
  if (src) return <img src={src} alt={name} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  const [a, b] = TONES[hash(name) % TONES.length];
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}
      role="img" aria-label={name}
    >
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="290" cy="90" r="30" fill="#fff" opacity="0.22" />
        <path d="M0 300V190q60-70 120-20t110-40q60-50 170 40V300z" fill="#fff" opacity="0.1" />
        <path d="M0 300V230q80-50 150-10t130-20q60-20 120 20V300z" fill="#000" opacity="0.18" />
      </svg>
    </div>
  );
}
