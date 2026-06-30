"use client";
import { useEffect, useRef, useState } from "react";
import { useVersus } from "@/state/store";
import { track } from "@/lib/analytics";
import { alpha, ASH, GOLD, PLASMA, PYRE } from "@/lib/colors";
import DuelStrip from "@/components/DuelStrip";
import CharacterGrid from "@/components/CharacterGrid";
import ArenaSelect from "@/components/ArenaSelect";
import TaleOfTheTape from "@/components/TaleOfTheTape";
import Results from "@/components/Results";
import Disclaimer from "@/components/Disclaimer";

export default function Home() {
  const { phase, fighterA, fighterB, error, goTo, reset } = useVersus();
  const [shake, setShake] = useState(false);
  const lockedCount = (fighterA ? 1 : 0) + (fighterB ? 1 : 0);
  const prevLocked = useRef(0);

  useEffect(() => {
    track("session_start", {
      referrer: document.referrer,
      landedOnPermalink: false,
    });
  }, []);

  // Lock-in screen-shake when a fighter is newly locked.
  useEffect(() => {
    if (lockedCount > prevLocked.current) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 320);
      prevLocked.current = lockedCount;
      return () => window.clearTimeout(t);
    }
    prevLocked.current = lockedCount;
  }, [lockedCount]);

  return (
    <div className={shake ? "vs-shake" : ""}>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <button type="button" onClick={reset} className="font-display text-2xl uppercase tracking-wide">
          <span style={{ color: PLASMA }}>VERSUS</span>
          <span style={{ color: GOLD }}>AI</span>
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: alpha(ASH, 0.9) }}>
          Who Would Win?
        </span>
      </header>

      {error && (
        <div className="mx-auto max-w-3xl px-4">
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: PYRE, color: PYRE }}>
            {error}
          </p>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4">
        {phase === "landing" && (
          <section className="flex flex-col gap-8 py-6">
            <div className="text-center">
              <h1 className="font-display text-4xl uppercase leading-none sm:text-6xl" style={{ color: "var(--color-bone)" }}>
                Pick your <span style={{ color: PLASMA }}>fight</span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: alpha("#F2F0FF", 0.7) }}>
                Two characters. One arena. A verdict opinionated enough to start an argument.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-display text-sm uppercase tracking-widest" style={{ color: GOLD }}>
                🔥 Trending &amp; Featured Duels
              </h2>
              <DuelStrip />
            </div>

            <button
              type="button"
              onClick={() => goTo("select")}
              className="mx-auto rounded-xl px-8 py-4 font-display text-xl uppercase tracking-widest"
              style={{ background: GOLD, color: "#0B0A1A" }}
            >
              Build your own →
            </button>
          </section>
        )}

        {phase === "select" && (
          <section className="py-4">
            <CharacterGrid />
            <BackRow onBack={() => goTo("landing")} />
          </section>
        )}

        {phase === "arena" && (
          <section className="py-4">
            <h2 className="mb-4 text-center font-display text-2xl uppercase tracking-widest" style={{ color: "var(--color-bone)" }}>
              Choose the Arena
            </h2>
            <ArenaSelect />
            <BackRow onBack={() => goTo("select")} />
          </section>
        )}

        {phase === "revealing" && <TaleOfTheTape />}
      </main>

      {phase === "results" && <Results />}

      <Disclaimer />
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onBack}
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: alpha(ASH, 1) }}
      >
        ← Back
      </button>
    </div>
  );
}
