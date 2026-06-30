import charactersJson from "@data/characters.json";
import arenasJson from "@data/arenas.json";
import categoriesJson from "@data/categories.json";
import featuredJson from "@data/featured-duels.json";
import { applyArena } from "./arenaEngine";
import type {
  Arena,
  ArenaResult,
  Category,
  CharacterProfile,
  FeaturedDuel,
} from "./types";

export const CHARACTERS = charactersJson as CharacterProfile[];
export const ARENAS = arenasJson as Arena[];
export const CATEGORIES = categoriesJson as unknown as Category[];
export const FEATURED_DUELS = featuredJson as FeaturedDuel[];

const CHARACTER_BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));
const ARENA_BY_ID = new Map(ARENAS.map((a) => [a.id, a]));

export function getCharacter(id: string): CharacterProfile | undefined {
  return CHARACTER_BY_ID.get(id);
}

export function getArena(id: string): Arena | undefined {
  return ARENA_BY_ID.get(id);
}

export function isValidCharacterId(id: string): boolean {
  return CHARACTER_BY_ID.has(id);
}

export function isValidArenaId(id: string): boolean {
  return ARENA_BY_ID.has(id);
}

/**
 * Resolve a matchup, validating every id against the closed roster (server-side).
 * Throwing here is the safety property that keeps arbitrary input out of the prompt
 * (PRD §14). Returns the loaded character/arena objects, never client-sent stats.
 */
export function resolveMatchup(
  fighterAId: string,
  fighterBId: string,
  arenaId: string,
): { fighterA: CharacterProfile; fighterB: CharacterProfile; arena: Arena } {
  const fighterA = getCharacter(fighterAId);
  const fighterB = getCharacter(fighterBId);
  const arena = getArena(arenaId);

  if (!fighterA) throw new Error(`Unknown fighter id: ${fighterAId}`);
  if (!fighterB) throw new Error(`Unknown fighter id: ${fighterBId}`);
  if (!arena) throw new Error(`Unknown arena id: ${arenaId}`);
  if (fighterAId === fighterBId) {
    throw new Error("A fighter cannot battle itself.");
  }

  return { fighterA, fighterB, arena };
}

/**
 * Compute arena-adjusted effective stats for a matchup from the public seed data.
 * Client-safe (pure engine, no secrets) — used by the radar / tale-of-the-tape to
 * show how the arena reshapes each fighter. Returns null if any id is invalid.
 */
export function effectiveFor(
  fighterAId: string,
  fighterBId: string,
  arenaId: string,
):
  | (ArenaResult & {
      fighterA: CharacterProfile;
      fighterB: CharacterProfile;
      arena: Arena;
    })
  | null {
  const fighterA = getCharacter(fighterAId);
  const fighterB = getCharacter(fighterBId);
  const arena = getArena(arenaId);
  if (!fighterA || !fighterB || !arena) return null;
  return { fighterA, fighterB, arena, ...applyArena(fighterA, fighterB, arena) };
}
