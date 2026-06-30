"use client";
import { getArena, getCharacter } from "@/lib/data";
import { useVersus } from "@/state/store";
import { territoryColor, alpha, GOLD } from "@/lib/colors";
import Portrait from "./Portrait";

/**
 * The reveal/loading state (PRD §3.3): both fighters face off across the seam while
 * the verdict streams in progressively below.
 */
export default function TaleOfTheTape() {
  const { fighterA, fighterB, arena, streamText } = useVersus();
  const a = fighterA ? getCharacter(fighterA) : null;
  const b = fighterB ? getCharacter(fighterB) : null;
  const ar = arena ? getArena(arena) : null;
  if (!a || !b || !ar) return null;

  const colorA = territoryColor("a", a.accentHint);
  const colorB = territoryColor("b", b.accentHint);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <span className="font-display text-2xl uppercase tracking-[0.3em]" style={{ color: GOLD }}>
        Tale of the Tape
      </span>

      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-2">
          <Portrait id={a.id} displayName={a.displayName} color={colorA} size={120} />
          <span className="font-display text-lg uppercase" style={{ color: colorA }}>{a.displayName}</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="seam-line h-24 w-[3px]" style={{ transform: "skewX(-9deg)" }} />
          <span className="mt-2 font-display text-3xl" style={{ color: GOLD }}>VS</span>
          <span className="mt-1 font-mono text-[10px] uppercase" style={{ color: alpha("#F2F0FF", 0.7) }}>
            {ar.displayName}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Portrait id={b.id} displayName={b.displayName} color={colorB} size={120} />
          <span className="font-display text-lg uppercase" style={{ color: colorB }}>{b.displayName}</span>
        </div>
      </div>

      <div className="min-h-16 max-w-lg text-center">
        {streamText ? (
          <p className="text-sm leading-relaxed" style={{ color: alpha("#F2F0FF", 0.85) }}>
            {streamText}
            <span className="ml-0.5 inline-block h-3 w-[6px] animate-pulse" style={{ background: GOLD }} />
          </p>
        ) : (
          <p className="font-mono text-sm" style={{ color: alpha("#F2F0FF", 0.6) }}>
            The analyst is deciding<span className="animate-pulse">…</span>
          </p>
        )}
      </div>
    </div>
  );
}
