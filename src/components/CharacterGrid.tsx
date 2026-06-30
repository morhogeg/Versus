"use client";
import { useState } from "react";
import { CHARACTERS } from "@/lib/data";
import { useVersus } from "@/state/store";
import { territoryColor, alpha, ASH, PLASMA, PYRE } from "@/lib/colors";
import Portrait from "./Portrait";
import type { CharacterProfile } from "@/lib/types";

function topAxis(c: CharacterProfile): string {
  let best = "combatSkill";
  let bestV = -1;
  for (const [k, v] of Object.entries(c.baseStats)) {
    if (v > bestV) {
      bestV = v;
      best = k;
    }
  }
  return `${best} ${bestV}`;
}

export default function CharacterGrid() {
  const { fighterA, fighterB, pickFighter } = useVersus();
  const [slammed, setSlammed] = useState<string | null>(null);

  const slotFor = (id: string): "a" | "b" | null =>
    fighterA === id ? "a" : fighterB === id ? "b" : null;

  const prompt = !fighterA
    ? "Pick Fighter A"
    : !fighterB
      ? "Pick Fighter B"
      : "Both locked";

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="font-mono text-xs" style={{ color: PLASMA }}>
          A: {fighterA ? CHARACTERS.find((c) => c.id === fighterA)?.displayName : "—"}
        </span>
        <span className="font-display text-lg uppercase tracking-widest" style={{ color: "var(--color-bone)" }}>
          {prompt}
        </span>
        <span className="font-mono text-xs" style={{ color: PYRE }}>
          B: {fighterB ? CHARACTERS.find((c) => c.id === fighterB)?.displayName : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CHARACTERS.map((c) => {
          const slot = slotFor(c.id);
          const selected = slot !== null;
          const color = selected ? territoryColor(slot, c.accentHint) : c.accentHint ?? "#9AA0AE";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                pickFighter(c.id);
                setSlammed(c.id);
                window.setTimeout(() => setSlammed((s) => (s === c.id ? null : s)), 320);
              }}
              aria-pressed={selected}
              className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${slammed === c.id ? "vs-slam" : ""}`}
              style={{
                borderColor: selected ? color : alpha(ASH, 0.3),
                background: selected ? alpha(color, 0.1) : "transparent",
                boxShadow: selected ? `0 0 24px ${alpha(color, 0.3)}` : "none",
              }}
            >
              {slot && (
                <span
                  className="absolute left-2 top-2 font-mono text-[10px] font-bold uppercase"
                  style={{ color }}
                >
                  {slot}
                </span>
              )}
              <span
                className="absolute right-2 top-2 font-mono text-[10px]"
                style={{ color: alpha(ASH, 0.9) }}
              >
                {c.tier}
              </span>
              <Portrait id={c.id} displayName={c.displayName} color={color} size={92} />
              <span className="font-display text-sm uppercase leading-tight" style={{ color: "var(--color-bone)" }}>
                {c.displayName}
              </span>
              <span className="font-mono text-[10px]" style={{ color: alpha(ASH, 0.9) }}>
                {c.universe}
              </span>
              {/* hover reveals the fighter's top stat fingerprint */}
              <span
                className="font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color }}
              >
                ▲ {topAxis(c)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
