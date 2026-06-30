import { alpha, ASH } from "@/lib/colors";

/**
 * Persistent non-affiliation disclaimer (PRD §7). VersusAI is a fan-made
 * parody/commentary tool — unaffiliated, unendorsed, original art and words only.
 */
export default function Disclaimer() {
  return (
    <footer className="mx-auto max-w-3xl px-4 py-8 text-center">
      <p className="font-mono text-[10px] leading-relaxed" style={{ color: alpha(ASH, 0.9) }}>
        VersusAI is a fan-made parody &amp; commentary tool. It is unaffiliated with and
        unendorsed by any film, show, or rights holder. All portraits are original
        stylized artwork; character names are used as unprotectable facts for
        identification only. Verdicts are transformative opinion, not statements of fact.
      </p>
    </footer>
  );
}
