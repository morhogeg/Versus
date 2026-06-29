import type { Arena, CharacterProfile, Stats } from "./types";

// Bump this when the prompt template changes — it is part of the verdict cache key,
// so bumping it invalidates every cached verdict (PRD §14).
export const PROMPT_VERSION = "v1";

// The decisive, no-hedge analyst persona. "It depends" is a bug (skill §10.2).
export const SYSTEM_PROMPT = `You are a sharp, slightly irreverent fight analyst who has seen every matchup and is never on the fence. You are confident, vivid, and a little cocky. You commit to a winner every single time and treat any refusal to decide as failure. You write taglines like a boxing promoter, not a Wikipedia editor.

ABSOLUTE RULES:
- ALWAYS name exactly one winnerId. Never a draw. Never "it depends".
- "confidence" is an integer from 1 to 99 (never 0, never 100). It is the probability that winnerId wins THIS matchup in THIS arena.
- "tagline" is <= 12 words, quotable, swagger over description. It is the line that gets screenshotted. Character names are not required in it.
- "categories" has one entry per axis that is actually contested; each names an axis winner and gives a one-sentence reason grounded in the EFFECTIVE (arena-adjusted) stats provided.
- "narrative" is exactly two short paragraphs, present tense, vivid, and SPECIFIC TO THE ARENA — the environment must visibly shape how the fight unfolds.
- Reason on the effective stats provided. They are ALREADY arena-adjusted; do not re-apply any arena math.
- Output ONLY the JSON object. No preamble, no markdown fences, no commentary.

OUTPUT SCHEMA (return EXACTLY this shape):
{ "winnerId": string, "confidence": number, "tagline": string, "categories": [{ "axis": string, "winnerId": string, "note": string }], "narrative": string }`;

function fighterBlock(
  label: "A" | "B",
  c: CharacterProfile,
  effective: Stats,
): string {
  const stats = Object.entries(effective)
    .map(([axis, v]) => `    ${axis}: ${v}`)
    .join("\n");
  const traits = c.traits.map((t) => `${t.label} (weight ${t.weight})`).join("; ");
  const gear = c.gear.map((g) => g.label).join("; ") || "none";
  const weaknesses = c.weaknesses.map((w) => w.label).join("; ") || "none";
  return `FIGHTER ${label} — id: ${c.id}
  displayName: ${c.displayName}
  universe: ${c.universe}
  archetype: ${c.archetype}
  loreBlurb: ${c.loreBlurb}
  effectiveStats (arena-adjusted, 0-100):
${stats}
  traits: ${traits}
  gear: ${gear}
  weaknesses: ${weaknesses}
  vibeTags: ${c.vibeTags.join(", ")}`;
}

/**
 * Build the user-message payload from flat fields + effective (arena-adjusted) stats
 * + the arena's natural-language rules and flavor. The model never sees raw arena math.
 */
export function buildVerdictPrompt(
  fighterA: CharacterProfile,
  fighterB: CharacterProfile,
  arena: Arena,
  effectiveA: Stats,
  effectiveB: Stats,
): string {
  const rules = arena.rules.map((r) => `  - ${r}`).join("\n");
  return `${fighterBlock("A", fighterA, effectiveA)}

${fighterBlock("B", fighterB, effectiveB)}

ARENA — ${arena.displayName}
  flavor: ${arena.promptFlavor}
  rules:
${rules}

Decide who wins this fight in this arena. Commit fully. Return ONLY the JSON object described in the system instructions, using the exact fighter ids "${fighterA.id}" and "${fighterB.id}".`;
}
