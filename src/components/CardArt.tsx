import { forwardRef } from "react";
import type { Arena, CharacterProfile, Verdict } from "@/lib/types";
import { alpha, GOLD, INK } from "@/lib/colors";
import Portrait from "./Portrait";

interface Props {
  fighterA: CharacterProfile;
  fighterB: CharacterProfile;
  arena: Arena;
  verdict: Verdict;
  colorA: string;
  colorB: string;
  permalink: string;
  width: number;
  height: number;
  vertical?: boolean;
}

// Auto-shrink the tagline so it never truncates (skill §10.3).
function taglineSize(text: string, vertical: boolean): number {
  const base = vertical ? 86 : 60;
  if (text.length > 60) return base * 0.7;
  if (text.length > 42) return base * 0.85;
  return base;
}

/**
 * The exportable share-card artwork (skill §10.3). Inline styles only, so html-to-image
 * rasterizes it faithfully. Winner's territory dominates; own stylized portraits only.
 */
const CardArt = forwardRef<HTMLDivElement, Props>(function CardArt(
  { fighterA, fighterB, arena, verdict, colorA, colorB, permalink, width, height, vertical = false },
  ref,
) {
  const winnerIsA = verdict.winnerId === fighterA.id;
  const winColor = winnerIsA ? colorA : colorB;
  const loseColor = winnerIsA ? colorB : colorA;
  const portraitSize = vertical ? 360 : 220;
  const shortLink = permalink.replace(/^https?:\/\//, "");

  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: INK,
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* loser territory */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${alpha(loseColor, 0.4)}, ${alpha(loseColor, 0.05)})` }} />
      {/* winner territory takes ground */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          right: winnerIsA ? "30%" : 0,
          left: winnerIsA ? 0 : "30%",
          background: `linear-gradient(135deg, ${alpha(winColor, 0.6)}, ${alpha(winColor, 0.12)})`,
          clipPath: winnerIsA
            ? "polygon(0 0, 100% 0, calc(100% - 60px) 100%, 0 100%)"
            : "polygon(60px 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* gold seam */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: winnerIsA ? "70%" : "30%",
          width: 5,
          transform: "skewX(-9deg)",
          background: GOLD,
          boxShadow: `0 0 30px 4px ${alpha(GOLD, 0.5)}`,
        }}
      />

      {/* fighters row */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: vertical ? "70px 60px 0" : "0 70px",
          gap: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Portrait id={fighterA.id} displayName={fighterA.displayName} color={colorA} size={portraitSize} />
          <div style={{ fontFamily: "var(--font-display)", fontSize: vertical ? 48 : 34, color: colorA, textTransform: "uppercase", marginTop: 10 }}>
            {fighterA.displayName}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: vertical ? 80 : 64, color: GOLD }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <Portrait id={fighterB.id} displayName={fighterB.displayName} color={colorB} size={portraitSize} />
          <div style={{ fontFamily: "var(--font-display)", fontSize: vertical ? 48 : 34, color: colorB, textTransform: "uppercase", marginTop: 10 }}>
            {fighterB.displayName}
          </div>
        </div>
      </div>

      {/* arena badge */}
      <div style={{ position: "relative", textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: vertical ? 22 : 16, letterSpacing: 2, color: alpha("#F2F0FF", 0.8), border: `1px solid ${alpha("#6B6488", 0.6)}`, borderRadius: 999, padding: vertical ? "8px 20px" : "5px 14px" }}>
          ⚔ {arena.displayName}
        </span>
      </div>

      {/* tagline hero */}
      <div style={{ position: "relative", textAlign: "center", padding: vertical ? "10px 70px 20px" : "0 70px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: taglineSize(verdict.tagline, vertical),
            lineHeight: 1.02,
            color: GOLD,
            textTransform: "uppercase",
            textShadow: `0 0 40px ${alpha(GOLD, 0.35)}`,
          }}
        >
          “{verdict.tagline}”
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: vertical ? 30 : 22, color: GOLD, marginTop: 14 }}>
          👑 {(winnerIsA ? fighterA : fighterB).displayName} · {verdict.confidence}%
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: vertical ? "0 60px 50px" : "0 40px 22px",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize: vertical ? 34 : 24, color: "#F2F0FF", letterSpacing: 1 }}>
          VERSUS<span style={{ color: GOLD }}>AI</span>
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: vertical ? 20 : 14, color: alpha("#F2F0FF", 0.7) }}>
          {shortLink}
        </span>
      </div>
    </div>
  );
});

export default CardArt;
