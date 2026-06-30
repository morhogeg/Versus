"use client";
import { useEffect } from "react";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import Results from "@/components/Results";
import Disclaimer from "@/components/Disclaimer";
import { alpha, ASH, GOLD, PLASMA } from "@/lib/colors";
import type { BattleRecord } from "@/lib/types";

export default function BattleClient({ record }: { record: BattleRecord }) {
  const { hydrate, reset } = useVersus();

  useEffect(() => {
    hydrate(record);
    track("session_start", { referrer: typeof document !== "undefined" ? document.referrer : "", landedOnPermalink: true });
  }, [record, hydrate]);

  return (
    <div>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <a href="/" onClick={reset} className="font-display text-2xl uppercase tracking-wide">
          <span style={{ color: PLASMA }}>VERSUS</span>
          <span style={{ color: GOLD }}>AI</span>
        </a>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: alpha(ASH, 0.9) }}>
          Shared Verdict
        </span>
      </header>
      <Results />
      <Disclaimer />
    </div>
  );
}
