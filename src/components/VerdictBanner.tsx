"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { CharacterProfile, Verdict } from "@/lib/types";
import { alpha, GOLD } from "@/lib/colors";

interface Props {
  fighterA: CharacterProfile;
  fighterB: CharacterProfile;
  verdict: Verdict;
  colorA: string;
  colorB: string;
}

/**
 * The Instant Verdict banner — the seam-flood moment (PRD §3.2). On reveal the
 * winner's color surges across the seam and takes ground; the gold tagline stamps in.
 * One of only two bold motion moments in the product.
 */
export default function VerdictBanner({
  fighterA,
  fighterB,
  verdict,
  colorA,
  colorB,
}: Props) {
  const reduce = useReducedMotion();
  const winnerIsA = verdict.winnerId === fighterA.id;
  const winner = winnerIsA ? fighterA : fighterB;
  const loser = winnerIsA ? fighterB : fighterA;
  const winColor = winnerIsA ? colorA : colorB;
  const loseColor = winnerIsA ? colorB : colorA;

  // The winner's territory takes ~72% of the width.
  const floodWidth = "72%";

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border"
      style={{ borderColor: alpha(GOLD, 0.25), minHeight: 260 }}
    >
      {/* loser territory (full bleed, behind) */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${alpha(loseColor, 0.35)}, ${alpha(loseColor, 0.06)})`,
        }}
        aria-hidden
      />

      {/* winner territory floods across the diagonal seam */}
      <motion.div
        className="absolute inset-y-0 left-0"
        initial={reduce ? { width: floodWidth } : { width: "50%" }}
        animate={{ width: floodWidth }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 90, damping: 16, delay: 0.15 }
        }
        style={{
          background: `linear-gradient(135deg, ${alpha(winColor, 0.55)}, ${alpha(winColor, 0.12)})`,
          clipPath: "polygon(0 0, 100% 0, calc(100% - 44px) 100%, 0 100%)",
        }}
        aria-hidden
      >
        {/* the charged gold seam at the flood's leading edge */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            right: -2,
            width: 4,
            transform: "skewX(-9deg)",
            background: GOLD,
            boxShadow: `0 0 26px 3px ${alpha(GOLD, 0.5)}`,
          }}
        />
      </motion.div>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 px-6 py-9 text-center">
        <span
          className="font-mono text-xs tracking-[0.35em]"
          style={{ color: alpha(GOLD, 0.85) }}
        >
          VERDICT
        </span>

        <motion.div
          initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.25 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.45, type: "spring", stiffness: 200, damping: 14 }}
          className="flex flex-col items-center"
        >
          <h1
            className="font-display text-5xl uppercase leading-none sm:text-6xl"
            style={{ color: GOLD, textShadow: `0 0 30px ${alpha(GOLD, 0.35)}` }}
          >
            {winner.displayName}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm" style={{ color: GOLD }}>
              👑 {verdict.confidence}% likely
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { delay: 0.7 }}
          className="font-display mt-1 max-w-xl text-balance text-xl uppercase sm:text-2xl"
          style={{ color: "var(--color-bone)" }}
        >
          “{verdict.tagline}”
        </motion.p>

        <span className="mt-1 font-mono text-[11px] uppercase tracking-widest" style={{ color: alpha(loseColor, 0.8) }}>
          over {loser.displayName}
        </span>
      </div>
    </div>
  );
}
