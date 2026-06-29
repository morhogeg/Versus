import "server-only";
import type { BattleRecord } from "./types";
import { getDb } from "./firestore";
import { mem } from "./memoryStore";

// Battle-record persistence. Firestore primary; shared in-memory fallback when no creds.
// The in-memory map does not survive a cold start — fine for local dev.

const memory = mem.battles;

const COLLECTION = "battles";

export async function saveBattle(record: BattleRecord): Promise<void> {
  const db = getDb();
  if (!db) {
    memory.set(record.id, record);
    return;
  }
  await db.collection(COLLECTION).doc(record.id).set(record);
}

export async function getBattle(id: string): Promise<BattleRecord | null> {
  const db = getDb();
  if (!db) {
    return memory.get(id) ?? null;
  }
  const snap = await db.collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as BattleRecord) : null;
}
