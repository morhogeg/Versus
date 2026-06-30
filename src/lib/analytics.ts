"use client";

// Lightweight, swappable analytics sink (PRD §13). Names map 1:1 to the funnel.
// Replace the body with PostHog/Plausible/your-own-KV later; the call sites stay put.

export type AnalyticsEvent =
  | "session_start"
  | "duel_tapped"
  | "matchup_built"
  | "verdict_requested"
  | "matchup_completed"
  | "narrative_expanded"
  | "counter_verdict"
  | "card_generated"
  | "share_clicked"
  | "rankings_viewed";

interface WindowWithBuffer extends Window {
  __versusEvents?: Array<{ event: string; props?: Record<string, unknown>; t: number }>;
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithBuffer;
  w.__versusEvents = w.__versusEvents ?? [];
  w.__versusEvents.push({ event, props, t: Date.now() });
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}
