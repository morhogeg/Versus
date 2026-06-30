"use client";
import { useRef, useState } from "react";
import type { Arena, CharacterProfile, Verdict } from "@/lib/types";
import {
  nodeToPng,
  downloadDataUrl,
  permalinkFor,
  shareCopy,
  type ShareSurface,
} from "@/lib/shareCard";
import { track } from "@/lib/analytics";
import { alpha, ASH, GOLD } from "@/lib/colors";
import CardArt from "./CardArt";

interface Props {
  fighterA: CharacterProfile;
  fighterB: CharacterProfile;
  arena: Arena;
  verdict: Verdict;
  colorA: string;
  colorB: string;
  battleId: string;
}

const SURFACES: { key: ShareSurface; label: string }[] = [
  { key: "reddit", label: "Reddit" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
];

export default function ShareCard({ fighterA, fighterB, arena, verdict, colorA, colorB, battleId }: Props) {
  const squareRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<ShareSurface | null>(null);
  const permalink = permalinkFor(battleId);

  const cardProps = { fighterA, fighterB, arena, verdict, colorA, colorB, permalink };

  async function exportPng(node: HTMLDivElement | null, w: number, h: number, name: string, surface: ShareSurface) {
    if (!node || busy) return;
    setBusy(true);
    try {
      const url = await nodeToPng(node, w, h);
      track("card_generated", { surface });
      downloadDataUrl(url, name);
    } catch (e) {
      console.error("card export failed", e);
    } finally {
      setBusy(false);
    }
  }

  async function copyShare(surface: ShareSurface) {
    const copy = shareCopy(surface, fighterA, fighterB, arena.displayName, verdict, permalink);
    const text = [copy.title, copy.body].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(surface);
      window.setTimeout(() => setCopied((c) => (c === surface ? null : c)), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
    track("share_clicked", { surface });
  }

  return (
    <div className="w-full rounded-xl border p-4" style={{ borderColor: alpha(GOLD, 0.25) }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-base uppercase" style={{ color: GOLD }}>Share to Debate</span>
        {busy && <span className="font-mono text-xs" style={{ color: alpha(GOLD, 0.8) }}>rendering…</span>}
      </div>

      {/* small preview rendered directly at preview dimensions */}
      <div className="mx-auto mb-4 flex justify-center overflow-hidden rounded-lg border" style={{ borderColor: alpha(ASH, 0.3) }}>
        <CardArt {...cardProps} width={440} height={248} />
      </div>

      {/* full-size cards kept offscreen for crisp export */}
      <div style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }} aria-hidden>
        <CardArt ref={squareRef} {...cardProps} width={1200} height={675} />
        <CardArt ref={verticalRef} {...cardProps} width={1080} height={1920} vertical />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportPng(squareRef.current, 1200, 675, `versusai-${battleId}.png`, "x")}
          disabled={busy}
          className="rounded-lg px-3 py-2 font-mono text-xs uppercase disabled:opacity-50"
          style={{ background: GOLD, color: "#0B0A1A" }}
        >
          ↓ Card 1200×675
        </button>
        <button
          type="button"
          onClick={() => exportPng(verticalRef.current, 1080, 1920, `versusai-${battleId}-vertical.png`, "tiktok")}
          disabled={busy}
          className="rounded-lg border px-3 py-2 font-mono text-xs uppercase disabled:opacity-50"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          ↓ Vertical 9:16
        </button>
        {SURFACES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => copyShare(s.key)}
            className="rounded-lg border px-3 py-2 font-mono text-xs uppercase"
            style={{ borderColor: alpha(ASH, 0.5), color: "var(--color-bone)" }}
          >
            {copied === s.key ? "copied ✓" : `copy ${s.label}`}
          </button>
        ))}
      </div>
    </div>
  );
}
