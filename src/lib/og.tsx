import { readFileSync } from "fs";
import path from "path";

const W = 1200;
const H = 630;

const logoBuffer = readFileSync(
  path.join(process.cwd(), "public", "icon-512.png")
);
const LOGO_DATA_URL = `data:image/png;base64,${logoBuffer.toString("base64")}`;

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 700 | 900;
  style: "normal";
};

async function fetchOgFonts(): Promise<LoadedFont[]> {
  // Without a modern browser UA, Google Fonts serves truetype (TTF) — which
  // Satori decodes natively. A Chrome/Safari UA would return woff2, which the
  // bundled Satori in this Next.js version can't decode.
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900"
  ).then((r) => r.text());

  const byWeight = new Map<500 | 700 | 900, string>();
  for (const block of css.split("@font-face").slice(1)) {
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    const url = block.match(
      /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|opentype)'\)/
    )?.[1];
    if (!weight || !url) continue;
    const w = parseInt(weight, 10);
    if (w !== 500 && w !== 700 && w !== 900) continue;
    byWeight.set(w, url);
  }

  const out: LoadedFont[] = [];
  for (const [weight, url] of byWeight.entries()) {
    const data = await fetch(url).then((r) => r.arrayBuffer());
    out.push({ name: "Montserrat", data, weight, style: "normal" });
  }
  return out;
}

let _ogFontsCache: Promise<LoadedFont[]> | null = null;
export function getOgFonts(): Promise<LoadedFont[]> {
  if (!_ogFontsCache) {
    _ogFontsCache = fetchOgFonts().catch((err) => {
      console.error("[og] font load failed:", err);
      _ogFontsCache = null;
      return [] as LoadedFont[];
    });
  }
  return _ogFontsCache;
}

type Point = { x: number; y: number };
type Line = { x1: number; y1: number; x2: number; y2: number; a: number };

function buildNetwork(w: number, h: number, density: number, connect: number) {
  const count = Math.floor((w * h) / density);
  let seed = 13;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({ x: rnd() * w, y: rnd() * h });
  }
  const lines: Line[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < connect) {
        lines.push({
          x1: pts[i].x,
          y1: pts[i].y,
          x2: pts[j].x,
          y2: pts[j].y,
          a: 1 - d / connect,
        });
      }
    }
  }
  return { pts, lines };
}

const NETWORK = buildNetwork(W, H, 11000, 150);

export function Constellation({
  lineAlpha = 0.13,
  particleAlpha = 0.4,
}: {
  lineAlpha?: number;
  particleAlpha?: number;
}) {
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", top: 0, left: 0, display: "flex" }}
    >
      {NETWORK.lines.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={`rgba(148,163,184,${(l.a * lineAlpha).toFixed(3)})`}
          strokeWidth={0.7}
        />
      ))}
      {NETWORK.pts.map((p, i) => (
        <circle
          key={`p${i}`}
          cx={p.x}
          cy={p.y}
          r={1.6}
          fill={`rgba(148,163,184,${particleAlpha})`}
        />
      ))}
    </svg>
  );
}

export function GridBg({ tight = false }: { tight?: boolean }) {
  const alpha = tight ? 0.05 : 0.06;
  const size = tight ? 32 : 48;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        backgroundImage: `linear-gradient(rgba(148,163,184,${alpha}) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,${alpha}) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

export function Glow({
  width,
  height,
  color,
  top,
  left,
  right,
  bottom,
}: {
  width: number;
  height: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  // Satori's css-to-react-native trims every style value; passing
  // `top: undefined` etc. blows up. Build the style object with only the
  // position keys we actually have.
  const style: Record<string, string | number> = {
    position: "absolute",
    display: "flex",
    width,
    height,
    background: `radial-gradient(circle, ${color} 0%, transparent 55%)`,
    borderRadius: 9999,
  };
  if (typeof top === "number") style.top = top;
  if (typeof left === "number") style.left = left;
  if (typeof right === "number") style.right = right;
  if (typeof bottom === "number") style.bottom = bottom;
  return <div style={style} />;
}

export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_DATA_URL}
        alt=""
        width={36}
        height={36}
        style={{ width: 36, height: 36, borderRadius: 8 }}
      />
      <div
        style={{
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.01em",
          color: "#E5E7EB",
          display: "flex",
        }}
      >
        Do I Need To Upgrade?
      </div>
    </div>
  );
}

export function IconCheck({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="2" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCPU({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="1.6"
      />
      <rect
        x="9"
        y="9"
        width="6"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="1.4"
      />
      {[3, 8, 13, 18].map((p) => (
        <g key={p}>
          <line x1={p} y1="2" x2={p} y2="6" stroke={color} strokeWidth="1.4" />
          <line x1={p} y1="18" x2={p} y2="22" stroke={color} strokeWidth="1.4" />
          <line x1="2" y1={p} x2="6" y2={p} stroke={color} strokeWidth="1.4" />
          <line x1="18" y1={p} x2="22" y2={p} stroke={color} strokeWidth="1.4" />
        </g>
      ))}
    </svg>
  );
}

export function IconGPU({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="7"
        width="20"
        height="10"
        rx="2"
        stroke={color}
        strokeWidth="1.6"
      />
      <circle cx="8" cy="12" r="2.2" stroke={color} strokeWidth="1.4" />
      <circle cx="16" cy="12" r="2.2" stroke={color} strokeWidth="1.4" />
      <line x1="2" y1="19" x2="6" y2="19" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export function IconRAM({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 8h20v8H2z" stroke={color} strokeWidth="1.6" />
      <path
        d="M5 16v2M9 16v2M15 16v2M19 16v2"
        stroke={color}
        strokeWidth="1.4"
      />
      <rect x="5" y="10" width="3" height="4" stroke={color} strokeWidth="1.2" />
      <rect
        x="10.5"
        y="10"
        width="3"
        height="4"
        stroke={color}
        strokeWidth="1.2"
      />
      <rect x="16" y="10" width="3" height="4" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

export function IconDisk({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}
