import { describe, it, expect } from "vitest";
import { applyArena } from "./arenaEngine";
import { AXES, type Arena, type CharacterProfile, type Stats } from "./types";

function stats(overrides: Partial<Stats> = {}): Stats {
  const base: Stats = {
    combatSkill: 60,
    strength: 60,
    speed: 60,
    durability: 60,
    intelligence: 60,
    willpower: 60,
    adaptability: 60,
  };
  return { ...base, ...overrides };
}

function char(
  id: string,
  baseStats: Stats,
  traitKeys: string[] = [],
): CharacterProfile {
  return {
    id,
    displayName: id,
    universe: "test",
    archetype: "warrior",
    tier: "B",
    portraitKey: id,
    baseStats,
    traits: traitKeys.map((k) => ({ key: k, label: k, weight: 1 })),
    gear: [],
    weaknesses: [],
    vibeTags: [],
    loreBlurb: "",
  };
}

function arena(modifiers: Arena["modifiers"]): Arena {
  return {
    id: "test_arena",
    displayName: "Test Arena",
    description: "",
    modifiers,
    rules: [],
    promptFlavor: "",
  };
}

describe("applyArena", () => {
  it("returns exactly the seven canonical axes", () => {
    const a = char("a", stats());
    const b = char("b", stats());
    const { effectiveA, effectiveB } = applyArena(a, b, arena([]));
    expect(Object.keys(effectiveA).sort()).toEqual([...AXES].sort());
    expect(Object.keys(effectiveB).sort()).toEqual([...AXES].sort());
  });

  it("produces integers in [0,100]", () => {
    const a = char("a", stats({ speed: 95, strength: 5 }));
    const b = char("b", stats());
    const { effectiveA } = applyArena(
      a,
      b,
      arena([
        { stat: "speed", op: "scale", value: 1.5, appliesTo: "all" },
        { stat: "strength", op: "add", value: -50, appliesTo: "all" },
      ]),
    );
    for (const axis of AXES) {
      expect(Number.isInteger(effectiveA[axis])).toBe(true);
      expect(effectiveA[axis]).toBeGreaterThanOrEqual(0);
      expect(effectiveA[axis]).toBeLessThanOrEqual(100);
    }
    expect(effectiveA.speed).toBe(100); // 95*1.5 = 142.5 -> clamp 100
    expect(effectiveA.strength).toBe(0); // 5-50 = -45 -> clamp 0
  });

  it("is deterministic — running twice yields identical output", () => {
    const a = char("a", stats({ intelligence: 73 }));
    const b = char("b", stats({ durability: 41 }));
    const ar = arena([
      { stat: "intelligence", op: "scale", value: 1.1, appliesTo: "all" },
    ]);
    expect(applyArena(a, b, ar)).toEqual(applyArena(a, b, ar));
  });

  it("returns baseStats unchanged for an empty modifier array", () => {
    const s = stats({ combatSkill: 72, strength: 58 });
    const a = char("a", s);
    const b = char("b", stats());
    const { effectiveA } = applyArena(a, b, arena([]));
    expect(effectiveA).toEqual(s);
  });

  it("applies modifiers in array order (scale then cap)", () => {
    // Worked example from skill §10.1: speed 60 -> scale 0.8 -> 48 -> cap 40 -> 40.
    const a = char("a", stats({ speed: 60 }));
    const b = char("b", stats({ speed: 60 }));
    const { effectiveA } = applyArena(
      a,
      b,
      arena([
        { stat: "speed", op: "scale", value: 0.8, appliesTo: "all" },
        { stat: "speed", op: "cap", value: 40, appliesTo: "all" },
      ]),
    );
    expect(effectiveA.speed).toBe(40);
  });

  it("only applies a conditional modifier to qualifying (trait-bearing) targets", () => {
    const a = char("a", stats({ combatSkill: 60 }), ["stealth"]);
    const b = char("b", stats({ combatSkill: 60 }), []);
    const { effectiveA, effectiveB } = applyArena(
      a,
      b,
      arena([
        {
          stat: "combatSkill",
          op: "scale",
          value: 1.2,
          appliesTo: "all",
          condition: { trait: "stealth" },
        },
      ]),
    );
    expect(effectiveA.combatSkill).toBe(72); // 60*1.2, has stealth
    expect(effectiveB.combatSkill).toBe(60); // unchanged, no stealth
  });

  it("respects appliesTo a / b", () => {
    const a = char("a", stats({ strength: 50 }));
    const b = char("b", stats({ strength: 50 }));
    const { effectiveA, effectiveB } = applyArena(
      a,
      b,
      arena([{ stat: "strength", op: "set", value: 90, appliesTo: "a" }]),
    );
    expect(effectiveA.strength).toBe(90);
    expect(effectiveB.strength).toBe(50);
  });

  it("throws on an unknown op", () => {
    const a = char("a", stats());
    const b = char("b", stats());
    expect(() =>
      applyArena(
        a,
        b,
        arena([
          // @ts-expect-error intentionally invalid op
          { stat: "speed", op: "multiply", value: 2, appliesTo: "all" },
        ]),
      ),
    ).toThrow(/unknown modifier op/);
  });

  it("throws on an unknown stat key", () => {
    const a = char("a", stats());
    const b = char("b", stats());
    expect(() =>
      applyArena(
        a,
        b,
        arena([
          // @ts-expect-error intentionally invalid stat
          { stat: "luck", op: "scale", value: 2, appliesTo: "all" },
        ]),
      ),
    ).toThrow(/unknown stat key/);
  });
});
