import {
  AXES,
  type AppliedNote,
  type Arena,
  type ArenaResult,
  type Axis,
  type CharacterProfile,
  type Modifier,
  type Stats,
} from "./types";

// PURE and DETERMINISTIC. No LLM, no I/O, no randomness. Same inputs -> identical
// output, always. See skills/arena-engine.md.

const AXIS_SET = new Set<string>(AXES);

function isAxis(stat: string): stat is Axis {
  return AXIS_SET.has(stat);
}

function cloneStats(stats: Stats): Stats {
  // Rebuild from the canonical axis list so output keys are always exactly the seven.
  const out = {} as Stats;
  for (const axis of AXES) out[axis] = stats[axis];
  return out;
}

function hasTrait(character: CharacterProfile, traitKey: string): boolean {
  return character.traits.some((t) => t.key === traitKey);
}

function applyOp(current: number, mod: Modifier): number {
  switch (mod.op) {
    case "scale":
      return current * mod.value;
    case "add":
      return current + mod.value;
    case "set":
      return mod.value;
    case "cap":
      return Math.min(current, mod.value);
    default: {
      // Closed set — anything else is a content bug to fix, not to swallow.
      const op = (mod as Modifier).op;
      throw new Error(
        `arenaEngine: unknown modifier op "${op}" on stat "${mod.stat}"`,
      );
    }
  }
}

function clampRound(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Deterministically transform two characters' base stats into arena-adjusted
 * effective stats.
 *
 * Resolution order (implemented EXACTLY per skill §10.1):
 *   1. Clone both characters' baseStats.
 *   2. For each modifier IN ARRAY ORDER: resolve targets from `appliesTo`; if a
 *      `condition` is present, a target qualifies only when it has the named trait;
 *      apply the op to the named stat on each qualifying target.
 *   3. After ALL modifiers: clamp every stat to [0, 100] and round to integer.
 */
export function applyArena(
  characterA: CharacterProfile,
  characterB: CharacterProfile,
  arena: Arena,
): ArenaResult {
  const working: Record<"a" | "b", Stats> = {
    a: cloneStats(characterA.baseStats),
    b: cloneStats(characterB.baseStats),
  };
  const characters: Record<"a" | "b", CharacterProfile> = {
    a: characterA,
    b: characterB,
  };
  const appliedNotes: AppliedNote[] = [];

  for (const mod of arena.modifiers) {
    if (!isAxis(mod.stat)) {
      throw new Error(
        `arenaEngine: unknown stat key "${mod.stat}" in arena "${arena.id}"`,
      );
    }

    const targets: Array<"a" | "b"> =
      mod.appliesTo === "all" ? ["a", "b"] : [mod.appliesTo];

    for (const target of targets) {
      if (mod.condition && !hasTrait(characters[target], mod.condition.trait)) {
        continue; // non-qualifying target skips this modifier
      }
      const from = working[target][mod.stat];
      const to = applyOp(from, mod);
      working[target][mod.stat] = to;
      appliedNotes.push({ target, stat: mod.stat, op: mod.op, from, to });
    }
  }

  // Clamp + round once, after every modifier has been applied.
  for (const target of ["a", "b"] as const) {
    for (const axis of AXES) {
      working[target][axis] = clampRound(working[target][axis]);
    }
  }

  return {
    effectiveA: working.a,
    effectiveB: working.b,
    appliedNotes,
  };
}
