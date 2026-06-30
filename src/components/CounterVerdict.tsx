"use client";
import { ARENAS } from "@/lib/data";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import { alpha, ASH, GOLD } from "@/lib/colors";

/**
 * "You think it's wrong?" (PRD §5.2) — flips ONE variable (the arena) and instantly
 * regenerates a counter-verdict to share back. Converts a passive viewer into a creator.
 */
export default function CounterVerdict() {
  const { fighterA, fighterB, arena, runBattle } = useVersus();
  if (!fighterA || !fighterB || !arena) return null;

  const others = ARENAS.filter((a) => a.id !== arena);

  return (
    <div className="w-full rounded-xl border p-4" style={{ borderColor: alpha(ASH, 0.3) }}>
      <p className="font-display text-base uppercase" style={{ color: "var(--color-bone)" }}>
        You think it&apos;s wrong?
      </p>
      <p className="mb-3 text-xs" style={{ color: alpha("#F2F0FF", 0.65) }}>
        Change one thing — the arena — and prove the opposite.
      </p>
      <div className="flex flex-wrap gap-2">
        {others.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              track("counter_verdict", { changedVar: "arena" });
              runBattle({ fighterAId: fighterA, fighterBId: fighterB, arenaId: a.id });
            }}
            className="rounded-full border px-3 py-1.5 font-mono text-xs transition-colors hover:border-[var(--color-gold)]"
            style={{ borderColor: alpha(GOLD, 0.4), color: GOLD }}
          >
            Rematch in {a.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
