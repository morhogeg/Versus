"use client";
import { useState } from "react";
import { alpha, ASH, GOLD } from "@/lib/colors";

interface Props {
  narrative: string;
  onExpand?: () => void;
}

/**
 * The Cinematic Narrative — the deep layer, default COLLAPSED so it never blocks the
 * scannable layers above (PRD §3.4).
 */
export default function Narrative({ narrative, onExpand }: Props) {
  const [open, setOpen] = useState(false);
  const paragraphs = narrative.split(/\n\n+/).filter(Boolean);

  return (
    <div className="w-full rounded-xl border" style={{ borderColor: alpha(ASH, 0.25) }}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) onExpand?.();
        }}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-display text-base uppercase" style={{ color: "var(--color-bone)" }}>
          How the fight plays out
        </span>
        <span className="font-mono text-xs" style={{ color: alpha(GOLD, 0.85) }}>
          {open ? "− hide" : "+ read"}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: alpha("#F2F0FF", 0.82) }}>
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
