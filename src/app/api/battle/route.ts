import { NextRequest } from "next/server";
import { runBattle } from "@/lib/battle";

// Node runtime: firebase-admin and the Anthropic SDK need Node, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BattleBody {
  fighterAId?: unknown;
  fighterBId?: unknown;
  arenaId?: unknown;
}

/**
 * POST /api/battle
 * Body: { fighterAId, fighterBId, arenaId }
 *
 * Streams newline-delimited JSON (NDJSON) frames:
 *   { "type": "chunk", "text": "..." }            // streamed reveal text (cache miss only)
 *   { "type": "done", "id", "verdict", "cacheHit", "model" }
 *   { "type": "error", "message": "..." }
 */
export async function POST(req: NextRequest) {
  let body: BattleBody;
  try {
    body = (await req.json()) as BattleBody;
  } catch {
    return frameError("Invalid JSON body.", 400);
  }

  const { fighterAId, fighterBId, arenaId } = body;
  if (
    typeof fighterAId !== "string" ||
    typeof fighterBId !== "string" ||
    typeof arenaId !== "string"
  ) {
    return frameError("fighterAId, fighterBId and arenaId are required.", 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const { record, cacheHit } = await runBattle(
          { fighterAId, fighterBId, arenaId },
          (text) => send({ type: "chunk", text }),
        );
        send({
          type: "done",
          id: record.id,
          verdict: record.verdict,
          model: record.model,
          cacheHit,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate verdict.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function frameError(message: string, status: number): Response {
  return new Response(JSON.stringify({ type: "error", message }) + "\n", {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
