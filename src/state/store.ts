"use client";
import { create } from "zustand";
import type { BattleRecord, Verdict } from "@/lib/types";
import { track } from "@/lib/analytics";

export type Phase = "landing" | "select" | "arena" | "revealing" | "results";

interface VersusState {
  phase: Phase;
  fighterA: string | null;
  fighterB: string | null;
  arena: string | null;
  verdict: Verdict | null;
  battleId: string | null;
  model: string | null;
  cacheHit: boolean;
  streamText: string;
  error: string | null;

  goTo: (phase: Phase) => void;
  pickFighter: (id: string) => void;
  clearFighter: (side: "a" | "b") => void;
  setArena: (id: string) => void;
  reset: () => void;
  newChallenger: () => void;
  hydrate: (record: BattleRecord) => void;
  runBattle: (input?: {
    fighterAId: string;
    fighterBId: string;
    arenaId: string;
  }) => Promise<void>;
}

const initial = {
  phase: "landing" as Phase,
  fighterA: null,
  fighterB: null,
  arena: null,
  verdict: null,
  battleId: null,
  model: null,
  cacheHit: false,
  streamText: "",
  error: null,
};

export const useVersus = create<VersusState>((set, get) => ({
  ...initial,

  goTo: (phase) => set({ phase }),

  pickFighter: (id) => {
    const { fighterA, fighterB } = get();
    if (!fighterA) {
      set({ fighterA: id });
    } else if (fighterA === id) {
      set({ fighterA: null }); // tapping the locked fighter clears it
    } else if (!fighterB) {
      set({ fighterB: id, phase: "arena" });
    } else if (fighterB === id) {
      set({ fighterB: null });
    }
  },

  clearFighter: (side) =>
    set(side === "a" ? { fighterA: null } : { fighterB: null }),

  setArena: (id) => set({ arena: id }),

  reset: () => set({ ...initial }),

  // Keep nothing but go back to character select for a fresh matchup.
  newChallenger: () =>
    set({
      ...initial,
      phase: "select",
    }),

  hydrate: (record) =>
    set({
      phase: "results",
      fighterA: record.fighterA,
      fighterB: record.fighterB,
      arena: record.arena,
      verdict: record.verdict,
      battleId: record.id,
      model: record.model,
      cacheHit: false,
      streamText: `${record.verdict.tagline}\n\n${record.verdict.narrative}`,
      error: null,
    }),

  runBattle: async (input) => {
    const state = get();
    const payload = input ?? {
      fighterAId: state.fighterA!,
      fighterBId: state.fighterB!,
      arenaId: state.arena!,
    };
    if (input) {
      // Counter-verdict / direct duel tap: adopt the supplied matchup.
      set({
        fighterA: payload.fighterAId,
        fighterB: payload.fighterBId,
        arena: payload.arenaId,
      });
    }

    set({ phase: "revealing", streamText: "", verdict: null, error: null });
    track("verdict_requested", {
      pairKey: `${payload.fighterAId}__${payload.fighterBId}`,
      arena: payload.arenaId,
    });

    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const handleLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let frame: Record<string, unknown>;
        try {
          frame = JSON.parse(trimmed);
        } catch {
          return;
        }
        if (frame.type === "chunk") {
          set((s) => ({ streamText: s.streamText + String(frame.text ?? "") }));
        } else if (frame.type === "done") {
          set({
            verdict: frame.verdict as Verdict,
            battleId: String(frame.id),
            model: String(frame.model),
            cacheHit: Boolean(frame.cacheHit),
            phase: "results",
          });
        } else if (frame.type === "error") {
          set({ error: String(frame.message), phase: "select" });
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          handleLine(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
      }
      if (buf) handleLine(buf);

      // Safety: if the stream closed without a verdict, surface an error.
      if (!get().verdict && !get().error) {
        set({ error: "The verdict never arrived.", phase: "select" });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong.",
        phase: "select",
      });
    }
  },
}));
