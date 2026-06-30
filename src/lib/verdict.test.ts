import { describe, it, expect } from "vitest";
import { applyArena } from "./arenaEngine";
import { mockVerdict, parseVerdict, VerdictParseError } from "./verdict";
import { CHARACTERS, ARENAS, getArena, getCharacter } from "./data";
import { AXES, type Axis } from "./types";

function runMock(aId: string, bId: string, arenaId: string) {
  const a = getCharacter(aId)!;
  const b = getCharacter(bId)!;
  const arena = getArena(arenaId)!;
  const { effectiveA, effectiveB } = applyArena(a, b, arena);
  return mockVerdict({ fighterA: a, fighterB: b, arena, effectiveA, effectiveB });
}

describe("mockVerdict", () => {
  it("always commits to one of the two fighters (never a draw)", () => {
    const v = runMock("tommy_shelby", "jaime_lannister", "gotham_alleyways");
    expect([v.winnerId]).toContain(v.winnerId);
    expect(["tommy_shelby", "jaime_lannister"]).toContain(v.winnerId);
  });

  it("produces an integer confidence in [1,99]", () => {
    const v = runMock("walter_white", "the_t800", "prep_time_48h");
    expect(Number.isInteger(v.confidence)).toBe(true);
    expect(v.confidence).toBeGreaterThanOrEqual(1);
    expect(v.confidence).toBeLessThanOrEqual(99);
  });

  it("is deterministic for the same matchup", () => {
    const a = runMock("geralt_of_rivia", "the_t800", "frozen_tundra");
    const b = runMock("geralt_of_rivia", "the_t800", "frozen_tundra");
    expect(a).toEqual(b);
  });

  it("emits a schema-valid verdict for every pair of fighters across every arena", () => {
    const axisSet = new Set<string>(AXES);
    for (const arena of ARENAS) {
      for (const a of CHARACTERS) {
        for (const b of CHARACTERS) {
          if (a.id === b.id) continue;
          const v = runMock(a.id, b.id, arena.id);
          expect([a.id, b.id]).toContain(v.winnerId);
          expect(v.tagline.length).toBeGreaterThan(0);
          expect(v.tagline.split(" ").length).toBeLessThanOrEqual(12);
          expect(v.narrative.length).toBeGreaterThan(0);
          for (const c of v.categories) {
            expect(axisSet.has(c.axis)).toBe(true);
            expect([a.id, b.id]).toContain(c.winnerId);
          }
        }
      }
    }
  });
});

describe("parseVerdict", () => {
  const A = "tommy_shelby";
  const B = "jaime_lannister";
  const valid = {
    winnerId: A,
    confidence: 71,
    tagline: "Brains in the dark beat a blade in the light.",
    categories: [{ axis: "intelligence", winnerId: A, note: "n" }],
    narrative: "Para one.\n\nPara two.",
  };

  it("parses a clean JSON object", () => {
    expect(parseVerdict(JSON.stringify(valid), A, B).winnerId).toBe(A);
  });

  it("strips ```json fences", () => {
    const raw = "```json\n" + JSON.stringify(valid) + "\n```";
    expect(parseVerdict(raw, A, B).confidence).toBe(71);
  });

  it("extracts the JSON object from surrounding prose", () => {
    const raw = "Here is the verdict: " + JSON.stringify(valid) + " Enjoy!";
    expect(parseVerdict(raw, A, B).winnerId).toBe(A);
  });

  it("clamps out-of-range confidence into [1,99]", () => {
    expect(parseVerdict(JSON.stringify({ ...valid, confidence: 0 }), A, B).confidence).toBe(1);
    expect(parseVerdict(JSON.stringify({ ...valid, confidence: 150 }), A, B).confidence).toBe(99);
  });

  it("drops invalid category entries", () => {
    const bad = {
      ...valid,
      categories: [
        { axis: "intelligence", winnerId: A, note: "ok" },
        { axis: "luck", winnerId: A, note: "bad axis" },
        { axis: "speed", winnerId: "nobody", note: "bad winner" },
      ],
    };
    const v = parseVerdict(JSON.stringify(bad), A, B);
    expect(v.categories).toHaveLength(1);
  });

  it("throws when winnerId is not one of the two fighters", () => {
    expect(() => parseVerdict(JSON.stringify({ ...valid, winnerId: "nobody" }), A, B)).toThrow(
      VerdictParseError,
    );
  });

  it("throws on non-JSON", () => {
    expect(() => parseVerdict("the winner is tommy", A, B)).toThrow(VerdictParseError);
  });
});

describe("seed balance (PRD §2.6)", () => {
  function avg(c: (typeof CHARACTERS)[number]): number {
    let t = 0;
    for (const axis of AXES) t += c.baseStats[axis as Axis];
    return t / AXES.length;
  }

  it("ships 12 fighters with unique ids", () => {
    expect(CHARACTERS).toHaveLength(12);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(12);
  });

  it("keeps every average inside the 60–86 band", () => {
    for (const c of CHARACTERS) {
      const a = avg(c);
      expect(a).toBeGreaterThanOrEqual(60);
      expect(a).toBeLessThanOrEqual(86);
    }
  });

  it("gives every fighter a spiky fingerprint and at least one weakness", () => {
    for (const c of CHARACTERS) {
      const values = AXES.map((axis) => c.baseStats[axis as Axis]);
      const spread = Math.max(...values) - Math.min(...values);
      expect(spread).toBeGreaterThanOrEqual(12);
      expect(c.weaknesses.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("tags Arya and Omar with the stealth trait (arena interaction)", () => {
    for (const id of ["arya_stark", "omar_little"]) {
      const c = getCharacter(id)!;
      expect(c.traits.some((t) => t.key === "stealth")).toBe(true);
    }
  });

  it("uses only closed-set ops and valid axes in arena modifiers", () => {
    const ops = new Set(["scale", "add", "set", "cap"]);
    const axisSet = new Set<string>(AXES);
    for (const arena of ARENAS) {
      for (const m of arena.modifiers) {
        expect(ops.has(m.op)).toBe(true);
        expect(axisSet.has(m.stat)).toBe(true);
      }
    }
  });
});
