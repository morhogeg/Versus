"use client";
import { FEATURED_DUELS, getArena, getCharacter } from "@/lib/data";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import { territoryColor, alpha, GOLD, ASH } from "@/lib/colors";
import Portrait from "./Portrait";

/**
 * The cold-start path (PRD §3.5 / §6.2): tap a pre-built duel → straight to a verdict.
 * No selection friction — the single highest-leverage activation mechanism.
 */
export default function DuelStrip() {
  const { runBattle } = useVersus();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {FEATURED_DUELS.map((d, i) => {
        const a = getCharacter(d.fighterA);
        const b = getCharacter(d.fighterB);
        const arena = getArena(d.arena);
        if (!a || !b || !arena) return null;
        const colorA = territoryColor("a", a.accentHint);
        const colorB = territoryColor("b", b.accentHint);
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              track("duel_tapped", { pairKey: `${d.fighterA}__${d.fighterB}`, source: d.source });
              runBattle({ fighterAId: d.fighterA, fighterBId: d.fighterB, arenaId: d.arena });
            }}
            className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border p-3 text-left transition-colors hover:border-[var(--color-gold)]"
            style={{ borderColor: alpha(ASH, 0.3) }}
          >
            <span
              className="self-start rounded-full px-2 py-0.5 font-mono text-[9px] uppercase"
              style={{ background: alpha(GOLD, 0.15), color: GOLD }}
            >
              {d.source === "featured" ? "★ Featured" : "🔥 Controversial"}
            </span>
            <div className="flex items-center justify-between">
              <Portrait id={a.id} displayName={a.displayName} color={colorA} size={56} />
              <span className="font-display text-sm" style={{ color: GOLD }}>VS</span>
              <Portrait id={b.id} displayName={b.displayName} color={colorB} size={56} />
            </div>
            <div className="flex items-center justify-between font-display text-xs uppercase">
              <span style={{ color: colorA }}>{a.displayName}</span>
              <span style={{ color: colorB }}>{b.displayName}</span>
            </div>
            <span className="font-mono text-[10px]" style={{ color: alpha(ASH, 0.95) }}>
              @ {arena.displayName}
            </span>
            <p className="text-xs" style={{ color: alpha("#F2F0FF", 0.7) }}>{d.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}
