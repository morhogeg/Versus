import { alpha, INK } from "@/lib/colors";

// Original, deterministic, stylized fighter emblem — generated entirely from the
// character id + territory color. NEVER franchise art (PRD §7). The same id always
// renders the same silhouette, so portraits are stable and copyright-safe.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export interface PortraitProps {
  id: string;
  displayName: string;
  color: string;
  size?: number;
  className?: string;
}

export default function Portrait({
  id,
  displayName,
  color,
  size = 160,
  className,
}: PortraitProps) {
  const h = hash(id);
  const gid = `pg-${id}`;
  const clip = `pc-${id}`;

  // Seed-driven helm/crest geometry so each fighter reads distinct.
  const crown = 26 + (h % 18); // crest height
  const jaw = 60 + ((h >> 3) % 16); // jaw width
  const tilt = ((h >> 5) % 7) - 3; // slight asymmetry
  const facet = ((h >> 7) % 100) / 100;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${displayName} emblem`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={alpha(color, 0.55)} />
          <stop offset="100%" stopColor={INK} />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="0" y="0" width="100" height="100" rx="10" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${gid})`} />

        {/* angular backdrop facet, seeded */}
        <polygon
          points={`0,${100 - facet * 40} 100,${60 + facet * 30} 100,100 0,100`}
          fill={alpha(color, 0.12)}
        />

        {/* shoulders */}
        <path
          d={`M${50 - jaw / 2 - 8},100 C${50 - jaw / 2 - 8},78 ${50 - jaw / 2},72 50,72 C${50 + jaw / 2},72 ${50 + jaw / 2 + 8},78 ${50 + jaw / 2 + 8},100 Z`}
          fill={INK}
          stroke={color}
          strokeWidth="1.5"
        />

        {/* head / helm silhouette */}
        <path
          d={`M${50 + tilt},18
              L${50 + jaw / 2 - 6},${18 + crown / 2}
              L${50 + jaw / 2 - 8},52
              C${50 + jaw / 2 - 10},64 ${50 + 8},70 50,70
              C${50 - 8},70 ${50 - jaw / 2 + 10},64 ${50 - jaw / 2 + 8},52
              L${50 - jaw / 2 + 6},${18 + crown / 2} Z`}
          fill={INK}
          stroke={color}
          strokeWidth="2"
        />

        {/* visor band — the signature glowing slit */}
        <rect
          x={50 - jaw / 2 + 9}
          y={40}
          width={jaw - 18}
          height={5}
          rx={2.5}
          fill={color}
          opacity={0.92}
        />

        {/* crest mark, seeded shape */}
        {facet > 0.5 ? (
          <polygon
            points={`50,12 ${54},22 ${50},19 ${46},22`}
            fill={color}
            opacity={0.85}
          />
        ) : (
          <circle cx="50" cy="16" r="3" fill={color} opacity={0.85} />
        )}

        {/* monogram, lower-left, mono feel */}
        <text
          x="8"
          y="94"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={alpha(color, 0.9)}
          letterSpacing="0.5"
        >
          {initials(displayName)}
        </text>
      </g>

      <rect
        x="0.75"
        y="0.75"
        width="98.5"
        height="98.5"
        rx="10"
        fill="none"
        stroke={alpha(color, 0.6)}
        strokeWidth="1.5"
      />
    </svg>
  );
}
