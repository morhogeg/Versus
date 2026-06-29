// ── Canonical axes ──────────────────────────────────────────────────────────
// The seven fixed stat axes. The UI and the Arena engine read ONLY these keys.
// Adding an eighth axis is a breaking change across the radar, schema, and every
// category config — never do it casually (see CLAUDE.md hard contracts).
export const AXES = [
  "combatSkill",
  "strength",
  "speed",
  "durability",
  "intelligence",
  "willpower",
  "adaptability",
] as const;

export type Axis = (typeof AXES)[number];

export type Stats = Record<Axis, number>;

// ── Character ───────────────────────────────────────────────────────────────
export type Archetype =
  | "warrior"
  | "tactician"
  | "bruiser"
  | "survivor"
  | "mystic"
  | "mastermind";

export type Tier = "S" | "A" | "B" | "C";

export interface Trait {
  key: string;
  label: string;
  weight: number;
}

export interface Labeled {
  key: string;
  label: string;
}

export interface CharacterProfile {
  id: string;
  displayName: string;
  universe: string;
  archetype: Archetype;
  tier: Tier;
  portraitKey: string;
  accentHint?: string;
  baseStats: Stats;
  traits: Trait[];
  gear: Labeled[];
  weaknesses: Labeled[];
  vibeTags: string[];
  loreBlurb: string;
}

// ── Arena ───────────────────────────────────────────────────────────────────
export type ModifierOp = "scale" | "add" | "set" | "cap";
export type AppliesTo = "all" | "a" | "b";

export interface Modifier {
  stat: Axis;
  op: ModifierOp;
  value: number;
  appliesTo: AppliesTo;
  condition?: { trait: string };
}

export interface Arena {
  id: string;
  displayName: string;
  description: string;
  modifiers: Modifier[];
  rules: string[];
  promptFlavor: string;
}

// ── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  displayName: string;
  status: "active" | "stub";
  axes: string[];
  axisLabels: Record<string, string>;
  arenas: string[];
  personaPrompt: string;
  cardTheme: string;
}

// ── Featured duel ───────────────────────────────────────────────────────────
export interface FeaturedDuel {
  fighterA: string;
  fighterB: string;
  arena: string;
  source: "featured" | "spicy" | "trending";
  blurb: string;
}

// ── Verdict (the LLM contract) ──────────────────────────────────────────────
export interface CategoryCall {
  axis: Axis;
  winnerId: string;
  note: string;
}

export interface Verdict {
  winnerId: string;
  confidence: number; // integer 1..99 — probability winnerId wins this matchup in this arena
  tagline: string;
  categories: CategoryCall[];
  narrative: string;
}

// ── Persisted battle record ─────────────────────────────────────────────────
export interface BattleRecord {
  id: string;
  fighterA: string;
  fighterB: string;
  arena: string;
  verdict: Verdict;
  createdAt: string;
  model: string;
}

// ── Engine output ───────────────────────────────────────────────────────────
export interface AppliedNote {
  target: "a" | "b";
  stat: Axis;
  op: ModifierOp;
  from: number;
  to: number;
}

export interface ArenaResult {
  effectiveA: Stats;
  effectiveB: Stats;
  appliedNotes: AppliedNote[];
}
