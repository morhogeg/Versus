import "server-only";
import type { Verdict } from "./types";
import { getDb } from "./firestore";
import { mem } from "./memoryStore";
import { PROMPT_VERSION } from "./promptBuilder";

// Verdict cache (PRD §14). A verdict is a pure function of
// (fighterA, fighterB, arena, model, promptVersion) — so cache on exactly that tuple.
// Bumping PROMPT_VERSION invalidates the whole cache by changing every key.
//
// Note: fighter order matters for the verdict (A is "left"), so the key is NOT sorted.

const COLLECTION = "verdictCache";

export interface CachedVerdict {
  verdict: Verdict;
  battleId: string;
  model: string;
}

const memory = mem.verdictCache;

export function verdictCacheKey(
  fighterAId: string,
  fighterBId: string,
  arenaId: string,
  model: string,
): string {
  return [fighterAId, fighterBId, arenaId, model, PROMPT_VERSION].join("|");
}

export async function getCachedVerdict(
  key: string,
): Promise<CachedVerdict | null> {
  const db = getDb();
  if (!db) return memory.get(key) ?? null;
  const snap = await db.collection(COLLECTION).doc(encodeKey(key)).get();
  return snap.exists ? (snap.data() as CachedVerdict) : null;
}

export async function setCachedVerdict(
  key: string,
  value: CachedVerdict,
): Promise<void> {
  const db = getDb();
  if (!db) {
    memory.set(key, value);
    return;
  }
  await db.collection(COLLECTION).doc(encodeKey(key)).set(value);
}

// Firestore doc ids cannot contain "/"; our keys don't, but encode defensively.
function encodeKey(key: string): string {
  return key.replace(/\//g, "_");
}
