import "server-only";
import type { BattleRecord } from "./types";
import type { CachedVerdict } from "./cache";

// Shared in-memory fallback store. Next.js bundles each route separately, so a plain
// module-level Map is NOT shared between /api/battle and /battle/[id]. Backing the maps
// on globalThis gives all route bundles ONE instance per server process — so permalinks
// and the verdict cache stay coherent without any external store. (Firestore, when
// configured, is the real cross-process store; this is just the zero-config fallback.)

interface CharCounters {
  characterId: string;
  appearances: number;
  wins: number;
  losses: number;
  last7dAppearances: number;
}

interface DuelCounters {
  pairKey: string;
  fighterA: string;
  fighterB: string;
  totalRuns: number;
  last24hRuns: number;
  winsA: number;
}

interface MemStore {
  battles: Map<string, BattleRecord>;
  verdictCache: Map<string, CachedVerdict>;
  chars: Map<string, CharCounters>;
  duels: Map<string, DuelCounters>;
}

const g = globalThis as typeof globalThis & { __versusMem?: MemStore };

export const mem: MemStore =
  g.__versusMem ??
  (g.__versusMem = {
    battles: new Map(),
    verdictCache: new Map(),
    chars: new Map(),
    duels: new Map(),
  });

export type { CharCounters, DuelCounters };
