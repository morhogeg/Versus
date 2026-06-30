import "server-only";
import { getDb } from "./firestore";
import { mem, type CharCounters, type DuelCounters } from "./memoryStore";

// Aggregate counters (PRD §2.5). Updated with ATOMIC increments on every completed
// battle — we touch exactly three docs (character A, character B, the duel), never
// the whole roster. Derived ratios (winRate, splitA/splitB) are computed on read
// (see helpers below), so the write path is pure increments with no read-modify-write.
//
// Recency windows (last7dAppearances, last24hRuns) are incremented as plain counters
// here; time-bucketed decay is an M5 concern and not yet wired.

const memChar = mem.chars;
const memDuel = mem.duels;

function pairKeyOf(a: string, b: string): [string, string, string] {
  const [x, y] = [a, b].sort();
  return [`${x}__${y}`, x, y];
}

function bumpMemoryChar(id: string, won: boolean) {
  const c =
    memChar.get(id) ??
    { characterId: id, appearances: 0, wins: 0, losses: 0, last7dAppearances: 0 };
  c.appearances += 1;
  c.last7dAppearances += 1;
  if (won) c.wins += 1;
  else c.losses += 1;
  memChar.set(id, c);
}

function bumpMemoryDuel(pairKey: string, x: string, y: string, xWon: boolean) {
  const d =
    memDuel.get(pairKey) ??
    { pairKey, fighterA: x, fighterB: y, totalRuns: 0, last24hRuns: 0, winsA: 0 };
  d.totalRuns += 1;
  d.last24hRuns += 1;
  if (xWon) d.winsA += 1;
  memDuel.set(pairKey, d);
}

/**
 * Atomically update character + duel aggregates for one completed battle.
 */
export async function bumpAggregates(
  fighterAId: string,
  fighterBId: string,
  winnerId: string,
): Promise<void> {
  const [pairKey, x, y] = pairKeyOf(fighterAId, fighterBId);
  const xWon = winnerId === x;

  const db = getDb();
  if (!db) {
    bumpMemoryChar(fighterAId, winnerId === fighterAId);
    bumpMemoryChar(fighterBId, winnerId === fighterBId);
    bumpMemoryDuel(pairKey, x, y, xWon);
    return;
  }

  const { FieldValue } = require("firebase-admin/firestore");
  const inc = (n: number) => FieldValue.increment(n);

  const charUpdate = (id: string, won: boolean) =>
    db
      .collection("characterStats")
      .doc(id)
      .set(
        {
          characterId: id,
          appearances: inc(1),
          last7dAppearances: inc(1),
          wins: inc(won ? 1 : 0),
          losses: inc(won ? 0 : 1),
        },
        { merge: true },
      );

  await Promise.all([
    charUpdate(fighterAId, winnerId === fighterAId),
    charUpdate(fighterBId, winnerId === fighterBId),
    db
      .collection("duelStats")
      .doc(pairKey)
      .set(
        {
          pairKey,
          fighterA: x,
          fighterB: y,
          totalRuns: inc(1),
          last24hRuns: inc(1),
          winsA: inc(xWon ? 1 : 0),
        },
        { merge: true },
      ),
  ]);
}

// ── Read helpers (derived ratios) — used by M5 dashboard; handy for tests now ──

export function characterWinRate(c: CharCounters): number {
  return c.appearances ? c.wins / c.appearances : 0;
}

export function duelSplit(d: DuelCounters): { splitA: number; splitB: number } {
  const splitA = d.totalRuns ? d.winsA / d.totalRuns : 0.5;
  return { splitA, splitB: 1 - splitA };
}

/** Test/debug-only: read the in-memory counters (Firestore path reads from db). */
export function _peekMemory() {
  return { chars: memChar, duels: memDuel };
}
