"use client";
import { AXES, type Axis, type Stats } from "@/lib/types";
import { alpha, ASH, BONE } from "@/lib/colors";

const AXIS_SHORT: Record<Axis, string> = {
  combatSkill: "CMB",
  strength: "STR",
  speed: "SPD",
  durability: "DUR",
  intelligence: "INT",
  willpower: "WIL",
  adaptability: "ADP",
};

interface RadarProps {
  statsA: Stats;
  statsB: Stats;
  colorA: string;
  colorB: string;
  size?: number;
}

function polygon(stats: Stats, cx: number, cy: number, r: number): string {
  return AXES.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    const v = stats[axis] / 100;
    const x = cx + Math.cos(angle) * r * v;
    const y = cy + Math.sin(angle) * r * v;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function RadarChart({
  statsA,
  statsB,
  colorA,
  colorB,
  size = 320,
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Seven-axis stat comparison"
      style={{ maxWidth: size }}
    >
      {/* grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={AXES.map((_, i) => {
            const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
            return `${(cx + Math.cos(angle) * r * ring).toFixed(1)},${(cy + Math.sin(angle) * r * ring).toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke={alpha(ASH, 0.3)}
          strokeWidth="1"
        />
      ))}

      {/* spokes + labels */}
      {AXES.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const lx = cx + Math.cos(angle) * (r + 18);
        const ly = cy + Math.sin(angle) * (r + 18);
        return (
          <g key={axis}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={alpha(ASH, 0.25)} strokeWidth="1" />
            <text
              x={lx}
              y={ly}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={alpha(BONE, 0.6)}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {AXIS_SHORT[axis]}
            </text>
          </g>
        );
      })}

      {/* fighter B underneath, A on top */}
      <polygon
        points={polygon(statsB, cx, cy, r)}
        fill={alpha(colorB, 0.22)}
        stroke={colorB}
        strokeWidth="2"
      />
      <polygon
        points={polygon(statsA, cx, cy, r)}
        fill={alpha(colorA, 0.22)}
        stroke={colorA}
        strokeWidth="2"
      />
    </svg>
  );
}
