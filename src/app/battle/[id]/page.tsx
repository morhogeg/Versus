import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBattle } from "@/lib/store";
import { getArena, getCharacter } from "@/lib/data";
import BattleClient from "./BattleClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const record = await getBattle(id);
  if (!record) return { title: "VersusAI — verdict not found" };
  const a = getCharacter(record.fighterA);
  const b = getCharacter(record.fighterB);
  const title = a && b ? `${a.displayName} vs ${b.displayName} — VersusAI` : "VersusAI";
  return {
    title,
    description: record.verdict.tagline,
    openGraph: { title, description: record.verdict.tagline },
  };
}

export default async function BattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getBattle(id);
  // Validate the record still references live roster entries.
  if (!record || !getCharacter(record.fighterA) || !getCharacter(record.fighterB) || !getArena(record.arena)) {
    notFound();
  }
  return <BattleClient record={record} />;
}
