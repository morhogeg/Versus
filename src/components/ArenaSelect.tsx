"use client";
import { ARENAS } from "@/lib/data";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import { alpha, ASH, GOLD } from "@/lib/colors";
import type { Arena } from "@/lib/types";

// Render an arena's effect as readable tags — never raw modifier math (PRD §3.3).
function effectTags(arena: Arena): { up: string[]; down: string[] } {
  const up: string[] = [];
  const down: string[] = [];
  for (const m of arena.modifiers) {
    if (m.op === "scale") {
      if (m.value > 1) up.push(m.stat);
      else if (m.value < 1) down.push(m.stat);
    } else if (m.op === "add") {
      (m.value >= 0 ? up : down).push(m.stat);
    }
  }
  return { up: [...new Set(up)], down: [...new Set(down)] };
}

export default function ArenaSelect() {
  const { arena, fighterA, fighterB, setArena, runBattle } = useVersus();

  return (
    <div className="flex flex-col gap-3">
      {ARENAS.map((a) => {
        const selected = arena === a.id;
        const { up, down } = effectTags(a);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => setArena(a.id)}
            aria-pressed={selected}
            className="rounded-xl border p-4 text-left transition-colors"
            style={{
              borderColor: selected ? GOLD : alpha(ASH, 0.3),
              background: selected ? alpha(GOLD, 0.07) : "transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg uppercase" style={{ color: "var(--color-bone)" }}>
                {a.displayName}
              </span>
              {selected && <span className="font-mono text-xs" style={{ color: GOLD }}>SELECTED</span>}
            </div>
            <p className="mt-1 text-sm" style={{ color: alpha("#F2F0FF", 0.7) }}>
              {a.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {up.map((s) => (
                <span key={`u${s}`} className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ background: alpha("#00E5FF", 0.14), color: "#00E5FF" }}>
                  ▲ {s}
                </span>
              ))}
              {down.map((s) => (
                <span key={`d${s}`} className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ background: alpha("#FF2D6F", 0.14), color: "#FF2D6F" }}>
                  ▼ {s}
                </span>
              ))}
            </div>
          </button>
        );
      })}

      <button
        type="button"
        disabled={!arena}
        onClick={() => {
          track("matchup_built", { fighterA, fighterB, arena });
          runBattle();
        }}
        className="mt-2 rounded-xl py-4 font-display text-xl uppercase tracking-widest transition-opacity disabled:opacity-40"
        style={{ background: GOLD, color: "#0B0A1A" }}
      >
        Fight →
      </button>
    </div>
  );
}
