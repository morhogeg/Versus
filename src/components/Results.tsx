"use client";
import { useEffect } from "react";
import { effectiveFor } from "@/lib/data";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import { territoryColor, alpha, ASH, GOLD } from "@/lib/colors";
import VerdictBanner from "./VerdictBanner";
import RadarChart from "./RadarChart";
import StatLedger from "./StatLedger";
import Narrative from "./Narrative";
import ShareCard from "./ShareCard";
import CounterVerdict from "./CounterVerdict";

export default function Results() {
  const { fighterA, fighterB, arena, verdict, battleId, cacheHit, model, reset, newChallenger } = useVersus();

  const data = fighterA && fighterB && arena ? effectiveFor(fighterA, fighterB, arena) : null;

  useEffect(() => {
    if (verdict) {
      track("matchup_completed", { winnerId: verdict.winnerId, confidence: verdict.confidence });
    }
  }, [verdict, battleId]);

  if (!data || !verdict) return null;
  const { fighterA: a, fighterB: b, arena: ar, effectiveA, effectiveB } = data;
  const colorA = territoryColor("a", a.accentHint);
  const colorB = territoryColor("b", b.accentHint);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      {/* Layer 1 — Instant Verdict */}
      <VerdictBanner fighterA={a} fighterB={b} verdict={verdict} colorA={colorA} colorB={colorB} />

      {/* Layer 2 — Categorical Breakdown + radar */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-xl border p-4" style={{ borderColor: alpha(ASH, 0.25) }}>
          <RadarChart statsA={effectiveA} statsB={effectiveB} colorA={colorA} colorB={colorB} />
        </div>
        <StatLedger
          fighterA={a}
          fighterB={b}
          statsA={effectiveA}
          statsB={effectiveB}
          colorA={colorA}
          colorB={colorB}
          verdict={verdict}
        />
      </div>

      {/* Layer 3 — Cinematic Narrative (collapsed) */}
      <Narrative
        narrative={verdict.narrative}
        onExpand={() => track("narrative_expanded", { pairKey: `${a.id}__${b.id}` })}
      />

      {/* Share + counter-verdict (the loops) */}
      {battleId && (
        <ShareCard
          fighterA={a}
          fighterB={b}
          arena={ar}
          verdict={verdict}
          colorA={colorA}
          colorB={colorB}
          battleId={battleId}
        />
      )}
      <CounterVerdict />

      {/* Terminal CTA — never a dead end */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={newChallenger}
          className="rounded-xl px-5 py-3 font-display text-lg uppercase"
          style={{ background: GOLD, color: "#0B0A1A" }}
        >
          New challenger
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border px-5 py-3 font-display text-lg uppercase"
          style={{ borderColor: alpha(ASH, 0.5), color: "var(--color-bone)" }}
        >
          Back to start
        </button>
      </div>

      <p className="text-center font-mono text-[10px]" style={{ color: alpha(ASH, 0.8) }}>
        {cacheHit ? "served from cache · " : ""}verdict by {model ?? "—"}
      </p>
    </div>
  );
}
