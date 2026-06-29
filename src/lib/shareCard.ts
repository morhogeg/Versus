"use client";
import { toPng } from "html-to-image";
import type { CharacterProfile, Verdict } from "./types";

// Client-side share-card export (skill §10.3). No diffusion, no server render —
// deterministic, copyright-safe. Renders a DOM node to PNG.

export type ShareSurface = "reddit" | "x" | "tiktok";

export function permalinkFor(battleId: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/battle/${battleId}`;
}

/** Per-surface copy returned alongside the image (skill §10.3). */
export function shareCopy(
  surface: ShareSurface,
  fighterA: CharacterProfile,
  fighterB: CharacterProfile,
  arenaName: string,
  verdict: Verdict,
  permalink: string,
): { title?: string; body: string } {
  const winnerIsA = verdict.winnerId === fighterA.id;
  const winner = winnerIsA ? fighterA : fighterB;
  const loser = winnerIsA ? fighterB : fighterA;

  switch (surface) {
    case "reddit":
      return {
        title: `${winner.displayName} beats ${loser.displayName} in ${arenaName} — ${verdict.confidence}%. Fight me.`,
        body: permalink,
      };
    case "x":
      return {
        body: `${verdict.tagline} — ${winner.displayName} over ${loser.displayName}. Settle it: ${permalink}`,
      };
    case "tiktok":
      return {
        body: `${winner.displayName} vs ${loser.displayName} — who wins? #whowouldwin #versusai #debate ${permalink}`,
      };
  }
}

/** Render a DOM node to a PNG data URL at the given pixel size. */
export async function nodeToPng(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  return toPng(node, {
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#0B0A1A",
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
