import {
  AXES,
  type Arena,
  type Axis,
  type CategoryCall,
  type CharacterProfile,
  type Stats,
  type Verdict,
} from "./types";
import { buildVerdictPrompt, SYSTEM_PROMPT } from "./promptBuilder";

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function resolveModel(): string {
  return process.env.VERSUSAI_MODEL || DEFAULT_MODEL;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * The model id we attribute a verdict to. When there is no API key the verdict is
 * produced by the deterministic local mock, and we say so explicitly so the data
 * never lies about provenance.
 */
export function verdictModel(): string {
  return hasAnthropicKey() ? resolveModel() : "mock-local";
}

export interface VerdictArgs {
  fighterA: CharacterProfile;
  fighterB: CharacterProfile;
  arena: Arena;
  effectiveA: Stats;
  effectiveB: Stats;
}

// ── Defensive parsing (skill §10.2 parsing contract) ─────────────────────────

function stripFences(raw: string): string {
  let s = raw.trim();
  // Strip a leading ```json / ``` fence and a trailing ``` if the model adds them.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // If there is leading/trailing prose, grab the outermost JSON object.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > 0 || (last !== -1 && last < s.length - 1)) {
    if (first !== -1 && last !== -1 && last > first) {
      s = s.slice(first, last + 1);
    }
  }
  return s.trim();
}

export class VerdictParseError extends Error {}

export function parseVerdict(
  raw: string,
  fighterAId: string,
  fighterBId: string,
): Verdict {
  let data: unknown;
  try {
    data = JSON.parse(stripFences(raw));
  } catch {
    throw new VerdictParseError("Verdict was not valid JSON.");
  }
  if (typeof data !== "object" || data === null) {
    throw new VerdictParseError("Verdict was not a JSON object.");
  }
  const d = data as Record<string, unknown>;

  const winnerId = d.winnerId;
  if (winnerId !== fighterAId && winnerId !== fighterBId) {
    throw new VerdictParseError(
      `winnerId "${String(winnerId)}" is not one of the two fighters.`,
    );
  }
  if (typeof d.tagline !== "string" || !d.tagline.trim()) {
    throw new VerdictParseError("Missing tagline.");
  }
  if (typeof d.narrative !== "string" || !d.narrative.trim()) {
    throw new VerdictParseError("Missing narrative.");
  }

  // Confidence: validate it is a number, then clamp to the decisive 1..99 band.
  const rawConfidence = Number(d.confidence);
  if (!Number.isFinite(rawConfidence)) {
    throw new VerdictParseError("Missing or non-numeric confidence.");
  }
  const confidence = Math.max(1, Math.min(99, Math.round(rawConfidence)));

  const axisSet = new Set<string>(AXES);
  const categories: CategoryCall[] = Array.isArray(d.categories)
    ? (d.categories as unknown[])
        .map((c) => c as Record<string, unknown>)
        .filter(
          (c) =>
            typeof c?.axis === "string" &&
            axisSet.has(c.axis) &&
            (c.winnerId === fighterAId || c.winnerId === fighterBId) &&
            typeof c?.note === "string",
        )
        .map((c) => ({
          axis: c.axis as Axis,
          winnerId: c.winnerId as string,
          note: c.note as string,
        }))
    : [];

  return {
    winnerId: winnerId as string,
    confidence,
    tagline: (d.tagline as string).trim(),
    categories,
    narrative: (d.narrative as string).trim(),
  };
}

// ── Anthropic path ───────────────────────────────────────────────────────────

async function streamFromClaude(
  userPrompt: string,
  onDelta: ((text: string) => void) | undefined,
): Promise<string> {
  // Imported lazily so the mock path has no hard dependency at module load.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let buffer = "";
  const stream = client.messages.stream({
    model: resolveModel(),
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  stream.on("text", (text: string) => {
    buffer += text;
    onDelta?.(text);
  });

  await stream.finalMessage();
  return buffer;
}

// ── Deterministic local mock ─────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mean(stats: Stats): number {
  let total = 0;
  for (const axis of AXES) total += stats[axis];
  return total / AXES.length;
}

// Sum of squares rewards a spiky fingerprint over a flat one, so a specialist's
// standout axis (and any arena boost to it) actually swings the result — which lets
// the arena flip a matchup, the core "arguable & replayable" design target (§2.6).
function powerScore(stats: Stats): number {
  let total = 0;
  for (const axis of AXES) total += stats[axis] * stats[axis];
  return total;
}

// Winner-agnostic swagger — never asserts which attribute won, so a tagline can
// never contradict the winner the score picked.
const TAGLINES = [
  "Some fights are settled before they start.",
  "This one was never as close as it looked.",
  "Styles make fights — and this style wins.",
  "The tape doesn't lie. Neither do I.",
  "Right fighter, right ground, right result.",
  "Every angle ran out for the other one.",
  "Built different. Finished early.",
  "Write it down — it only ends one way.",
];

function axisNote(
  axis: Axis,
  winner: CharacterProfile,
  wv: number,
  lv: number,
): string {
  const labels: Record<Axis, string> = {
    combatSkill: "out-fights",
    strength: "overpowers",
    speed: "outpaces",
    durability: "outlasts",
    intelligence: "out-thinks",
    willpower: "out-wills",
    adaptability: "out-adapts",
  };
  return `${winner.displayName} ${labels[axis]} here (${wv} vs ${lv}).`;
}

/**
 * Deterministic, schema-valid verdict produced without any LLM. Seeded entirely by
 * the matchup, so the same inputs always yield the same verdict. Always commits to a
 * winner; never a draw. Used when ANTHROPIC_API_KEY is unset (dev + tests run free).
 */
export function mockVerdict(args: VerdictArgs): Verdict {
  const { fighterA, fighterB, arena, effectiveA, effectiveB } = args;
  const scoreA = powerScore(effectiveA);
  const scoreB = powerScore(effectiveB);

  // Winner by power score; ties resolve to fighter A (never a draw).
  const aWins = scoreA >= scoreB;
  const winner = aWins ? fighterA : fighterB;
  const winnerStats = aWins ? effectiveA : effectiveB;
  const loserStats = aWins ? effectiveB : effectiveA;

  // Confidence from the relative score gap, kept in a decisive-but-not-certain band.
  const ratio = Math.abs(scoreA - scoreB) / (scoreA + scoreB);
  const confidence = Math.max(52, Math.min(93, Math.round(52 + ratio * 600)));

  // Per-axis calls for every contested axis (effective values differ).
  const categories: CategoryCall[] = AXES.filter(
    (axis) => effectiveA[axis] !== effectiveB[axis],
  ).map((axis) => {
    const axisWinnerIsA = effectiveA[axis] >= effectiveB[axis];
    const axisWinner = axisWinnerIsA ? fighterA : fighterB;
    const wv = axisWinnerIsA ? effectiveA[axis] : effectiveB[axis];
    const lv = axisWinnerIsA ? effectiveB[axis] : effectiveA[axis];
    return {
      axis,
      winnerId: axisWinner.id,
      note: axisNote(axis, axisWinner, wv, lv),
    };
  });

  const tagline =
    TAGLINES[hashString(`${fighterA.id}|${fighterB.id}|${arena.id}`) % TAGLINES.length];

  // Find the winner's single strongest axis for the narrative.
  let topAxis: Axis = AXES[0];
  for (const axis of AXES) {
    if (winnerStats[axis] > winnerStats[topAxis]) topAxis = axis;
  }
  const topRule = arena.rules[0] ?? arena.promptFlavor;

  const narrative =
    `In the ${arena.displayName.toLowerCase()}, ${arena.promptFlavor.toLowerCase().replace(/\.$/, "")}. ` +
    `${winner.displayName} reads it instantly and leans on a clear edge in ${topAxis} (${winnerStats[topAxis]}), ` +
    `while the other is forced to fight the environment as much as the opponent.\n\n` +
    `${topRule} As the exchange tightens, ${winner.displayName} turns that edge into control, ` +
    `and the loser's best stats (${Math.round(mean(loserStats))} on average) never get the room they need. ` +
    `It closes out decisively — about ${confidence}% of the time, this is how it ends.`;

  return {
    winnerId: winner.id,
    confidence,
    tagline,
    categories,
    narrative,
  };
}

function mockStreamText(verdict: Verdict): string {
  // Text we feed through onDelta to simulate a streamed reveal.
  return `${verdict.tagline}\n\n${verdict.narrative}`;
}

async function simulateStream(
  text: string,
  onDelta: (t: string) => void,
): Promise<void> {
  const words = text.split(/(\s+)/);
  for (const w of words) {
    onDelta(w);
    // Yield to the event loop so chunks actually flush to the client.
    await new Promise((r) => setTimeout(r, 8));
  }
}

// ── Public entry point ───────────────────────────────────────────────────────

export interface VerdictResult {
  verdict: Verdict;
  model: string;
}

/**
 * Produce a verdict for a matchup. Streams text deltas through `onDelta` (raw model
 * text from Claude, or simulated chunks from the mock) for the reveal UI, then
 * returns the parsed + validated verdict.
 */
export async function generateVerdict(
  args: VerdictArgs,
  onDelta?: (text: string) => void,
): Promise<VerdictResult> {
  const { fighterA, fighterB, arena, effectiveA, effectiveB } = args;

  if (!hasAnthropicKey()) {
    const verdict = mockVerdict(args);
    if (onDelta) await simulateStream(mockStreamText(verdict), onDelta);
    return { verdict, model: "mock-local" };
  }

  const userPrompt = buildVerdictPrompt(
    fighterA,
    fighterB,
    arena,
    effectiveA,
    effectiveB,
  );

  let raw = await streamFromClaude(userPrompt, onDelta);
  try {
    const verdict = parseVerdict(raw, fighterA.id, fighterB.id);
    return { verdict, model: resolveModel() };
  } catch {
    // Retry ONCE with a terse reminder, no streaming this time (skill §10.2).
    raw = await streamFromClaude(
      `${userPrompt}\n\nYour previous reply was not valid. Return ONLY the JSON object, nothing else.`,
      undefined,
    );
    const verdict = parseVerdict(raw, fighterA.id, fighterB.id);
    return { verdict, model: resolveModel() };
  }
}
