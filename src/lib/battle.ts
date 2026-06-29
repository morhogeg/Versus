import "server-only";
import { nanoid } from "nanoid";
import { applyArena } from "./arenaEngine";
import { resolveMatchup } from "./data";
import { generateVerdict, verdictModel } from "./verdict";
import { getCachedVerdict, setCachedVerdict, verdictCacheKey } from "./cache";
import { saveBattle } from "./store";
import { bumpAggregates } from "./aggregates";
import type { BattleRecord } from "./types";

export interface RunBattleInput {
  fighterAId: string;
  fighterBId: string;
  arenaId: string;
}

export interface RunBattleOutput {
  record: BattleRecord;
  cacheHit: boolean;
}

/**
 * The core server pipeline (PRD §4.3):
 *   validate ids → load characters + arena server-side → run deterministic arena
 *   engine → cache lookup → (miss) build prompt + stream verdict → persist record,
 *   cache it, atomically bump aggregates.
 *
 * `onDelta` receives streamed text for the reveal UI (only on a cache miss).
 */
export async function runBattle(
  input: RunBattleInput,
  onDelta?: (text: string) => void,
): Promise<RunBattleOutput> {
  const { fighterAId, fighterBId, arenaId } = input;
  const { fighterA, fighterB, arena } = resolveMatchup(
    fighterAId,
    fighterBId,
    arenaId,
  );

  const model = verdictModel();
  const cacheKey = verdictCacheKey(fighterAId, fighterBId, arenaId, model);

  const cached = await getCachedVerdict(cacheKey);
  if (cached) {
    // Stable, shareable permalink: popular duels reuse the canonical battle id.
    const existing = {
      id: cached.battleId,
      fighterA: fighterAId,
      fighterB: fighterBId,
      arena: arenaId,
      verdict: cached.verdict,
      createdAt: new Date().toISOString(),
      model: cached.model,
    } satisfies BattleRecord;
    await bumpAggregates(fighterAId, fighterBId, cached.verdict.winnerId);
    return { record: existing, cacheHit: true };
  }

  const { effectiveA, effectiveB } = applyArena(fighterA, fighterB, arena);
  const { verdict, model: usedModel } = await generateVerdict(
    { fighterA, fighterB, arena, effectiveA, effectiveB },
    onDelta,
  );

  const record: BattleRecord = {
    id: `b_${nanoid(8)}`,
    fighterA: fighterAId,
    fighterB: fighterBId,
    arena: arenaId,
    verdict,
    createdAt: new Date().toISOString(),
    model: usedModel,
  };

  await saveBattle(record);
  await setCachedVerdict(cacheKey, {
    verdict,
    battleId: record.id,
    model: usedModel,
  });
  await bumpAggregates(fighterAId, fighterBId, verdict.winnerId);

  return { record, cacheHit: false };
}
