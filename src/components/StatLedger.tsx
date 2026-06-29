"use client";
import { AXES, type Axis, type CharacterProfile, type Stats, type Verdict } from "@/lib/types";
import { alpha, ASH, GOLD } from "@/lib/colors";

const AXIS_LABEL: Record<Axis, string> = {
  combatSkill: "Combat Skill",
  strength: "Strength",
  speed: "Speed",
  durability: "Durability",
  intelligence: "Intelligence",
  willpower: "Willpower",
  adaptability: "Adaptability",
};

interface Props {
  fighterA: CharacterProfile;
  fighterB: CharacterProfile;
  statsA: Stats;
  statsB: Stats;
  colorA: string;
  colorB: string;
  verdict: Verdict;
}

/**
 * The Categorical Breakdown — a "tale of the tape" ledger that reads ACROSS the seam:
 * A's number · axis label · B's number. The per-axis winner is marked, and any note
 * the verdict supplied for that axis is shown beneath. This is the "evidence" layer.
 */
export default function StatLedger({
  fighterA,
  fighterB,
  statsA,
  statsB,
  colorA,
  colorB,
  verdict,
}: Props) {
  const noteByAxis = new Map(verdict.categories.map((c) => [c.axis, c]));

  return (
    <div className="w-full">
      {/* header row with fighter names on each side of the seam */}
      <div className="mb-3 flex items-center justify-between font-display text-lg uppercase">
        <span style={{ color: colorA }}>{fighterA.displayName}</span>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: alpha(GOLD, 0.7) }}>
          TALE OF THE TAPE
        </span>
        <span style={{ color: colorB }}>{fighterB.displayName}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {AXES.map((axis) => {
          const a = statsA[axis];
          const b = statsB[axis];
          const aWins = a > b;
          const bWins = b > a;
          const note = noteByAxis.get(axis);
          const total = Math.max(a + b, 1);
          return (
            <li
              key={axis}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: alpha(ASH, 0.25) }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 text-right font-mono text-sm tabular-nums"
                  style={{ color: colorA, fontWeight: aWins ? 700 : 400, opacity: aWins ? 1 : 0.6 }}
                >
                  {a}
                </span>

                {/* dual bar meeting at center seam */}
                <div className="flex flex-1 items-center" aria-hidden>
                  <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-l-full" style={{ background: alpha(ASH, 0.15) }}>
                    <div style={{ width: `${(a / total) * 100}%`, background: colorA, opacity: aWins ? 1 : 0.5 }} />
                  </div>
                  <div className="h-3 w-[2px]" style={{ background: alpha(GOLD, 0.6) }} />
                  <div className="flex h-2 flex-1 overflow-hidden rounded-r-full" style={{ background: alpha(ASH, 0.15) }}>
                    <div style={{ width: `${(b / total) * 100}%`, background: colorB, opacity: bWins ? 1 : 0.5 }} />
                  </div>
                </div>

                <span
                  className="w-10 font-mono text-sm tabular-nums"
                  style={{ color: colorB, fontWeight: bWins ? 700 : 400, opacity: bWins ? 1 : 0.6 }}
                >
                  {b}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-center gap-2 text-center">
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: alpha(ASH, 0.9) }}>
                  {AXIS_LABEL[axis]}
                </span>
              </div>

              {note && (
                <p className="mt-0.5 text-center text-xs" style={{ color: alpha("#F2F0FF", 0.65) }}>
                  {note.note}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
