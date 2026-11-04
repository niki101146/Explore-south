import { useState } from "react";

/*
  A Western Ghats sunrise with a gopuram silhouette and coconut palms, drawn in SVG so the
  site looks finished before any photo is uploaded.

  To use a real photo instead, save it as  frontend/public/hero.jpg  (set `photo` on the
  <HeroArt>). If the file is missing, the illustration is shown.
*/
const W = 1440;
const H = 800;
const rand = (seed, i) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function ridge(seed, base, amp, freq) {
  const pts = [];
  for (let x = -48; x <= W + 48; x += 48) {
    const i = x / 48;
    const n = 0.55 * Math.sin(i * freq + seed) + 0.3 * Math.sin(i * freq * 2.3 + seed * 1.7)
      + 0.15 * (rand(seed, i) * 2 - 1);
    pts.push([x, base - amp * (0.5 + 0.5 * n)]);
  }
  let d = `M${pts[0][0]} ${H} L${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${x} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  return `${d} L${W + 48} ${H} Z`;
}

const FAR = ridge(2, 520, 170, 0.35);
const MID = ridge(5, 610, 150, 0.5);
const NEAR = ridge(9, 700, 90, 0.7);

function Palm({ x, y, h, lean, s = 1 }) {
  const tx = x + lean;
  const ty = y - h;
  const fronds = [-170, -145, -120, -95, -70, -45, -20, -5];
  return (
    <g stroke="#3b2417" fill="none" strokeLinecap="round">
      <path d={`M${x} ${y} Q${x + lean * 0.15} ${y - h * 0.55} ${tx} ${ty}`} strokeWidth={7 * s} />
      {fronds.map((a) => {
        const r = (a * Math.PI) / 180;
        const L = 95 * s;
        const ex = tx + Math.cos(r) * L;
        const ey = ty + Math.sin(r) * L + 30 * s;
        const cx = tx + Math.cos(r) * L * 0.5;
        const cy = ty + Math.sin(r) * L * 0.5 - 26 * s;
        return <path key={a} d={`M${tx} ${ty} Q${cx} ${cy} ${ex} ${ey}`} strokeWidth={5 * s} />;
      })}
    </g>
  );
}

function Gopuram({ x, y, scale = 1 }) {
  const tiers = Array.from({ length: 7 }, (_, i) => {
    const bw = 150 - i * 17;
    const tw = bw - 10;
    const y0 = -44 - i * 26;
    return `${-bw / 2},${y0} ${bw / 2},${y0} ${tw / 2},${y0 - 26} ${-tw / 2},${y0 - 26}`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#4a2c18" stroke="rgba(255,255,255,.07)">
      <rect x="-85" y="-44" width="170" height="160" />
      {tiers.map((p, i) => <polygon key={i} points={p} />)}
      <ellipse cx="0" cy="-232" rx="26" ry="10" />
      <path d="M0 -242v-26" strokeWidth="3" stroke="#4a2c18" />
      <circle cx="0" cy="-272" r="4" />
      <path d="M-14 116V-8a14 14 0 0128 0V116z" fill="#3b2417" stroke="none" />
    </g>
  );
}

export default function HeroArt({ className = "", photo = false }) {
  const [photoOk, setPhotoOk] = useState(photo);
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="es-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1a10" />
            <stop offset="0.2" stopColor="#6b4a35" />
            <stop offset="0.4" stopColor="#facc15" />
            <stop offset="0.55" stopColor="#fde68a" />
            <stop offset="1" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id="es-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fef9c3" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#fde68a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="es-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8672a" />
            <stop offset="1" stopColor="#3b2417" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#es-sky)" />
        <circle cx="1010" cy="400" r="260" fill="url(#es-glow)" />
        <circle cx="1010" cy="400" r="58" fill="#fef9c3" />
        <path d={FAR} fill="#a8815f" opacity="0.55" />
        <path d={MID} fill="#5a3a24" />
        <Gopuram x={700} y={668} scale={1.05} />
        <path d={NEAR} fill="#2b1a10" />
        <rect y="742" width={W} height="58" fill="url(#es-water)" />
        <g stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeLinecap="round">
          <path d="M120 768h90M330 782h60M560 766h120M820 780h80M1040 768h110M1260 782h70" />
        </g>
        <Palm x={70} y={760} h={300} lean={34} s={1.15} />
        <Palm x={150} y={770} h={210} lean={-22} s={0.85} />
        <Palm x={1390} y={760} h={330} lean={-40} s={1.2} />
        <Palm x={1300} y={772} h={200} lean={24} s={0.8} />
      </svg>
      {photoOk && (
        <img
          src="/hero.jpg" alt="" onError={() => setPhotoOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
