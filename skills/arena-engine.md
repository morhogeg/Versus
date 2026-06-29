# Skill: Arena Engine

## Purpose
Deterministically transform two characters' base stats into arena-adjusted
`effectiveStats` before any verdict is generated. PURE function. No LLM, no I/O,
no randomness. Same inputs -> identical output, always.

## Signature
applyArena(characterA, characterB, arena) -> { effectiveA, effectiveB, appliedNotes }
- effectiveA / effectiveB: the seven baseStats keys, integers clamped 0..100
- appliedNotes: human-readable list of what changed, for debugging + optional UI

## Modifier ops (closed set — reject anything else)
- scale : stat = round(stat * value)
- add   : stat = stat + value          (value may be negative)
- set   : stat = value
- cap   : stat = min(stat, value)

## Resolution order (implement EXACTLY)
1. effectiveA = clone(characterA.baseStats); effectiveB = clone(characterB.baseStats)
2. For each modifier in arena.modifiers, IN ARRAY ORDER:
   a. Determine targets from `appliesTo`: "all" -> both; "a" -> A; "b" -> B.
   b. If modifier.condition exists, the target qualifies only if it has the
      named trait (condition.trait) in its traits[]. Non-qualifying targets skip.
   c. Apply op to the named stat on each qualifying target.
3. After ALL modifiers: clamp every stat to [0, 100], round to integer.
4. Return effectiveA, effectiveB, appliedNotes.

## Invariants (assert in tests)
- Output keys === the seven canonical axes, no more, no fewer.
- Every output value is an integer in [0, 100].
- Running twice yields identical output (determinism).
- An empty arena.modifiers array returns baseStats unchanged.

## Worked example
characterA.baseStats.speed = 60, modifier { stat:"speed", op:"scale",
value:0.8, appliesTo:"all" } -> effectiveA.speed = round(60 * 0.8) = 48.
Then a later { stat:"speed", op:"cap", value:40 } -> min(48,40) = 40.
Order matters: the cap runs after the scale because it appears later in the array.

## Failure mode
Unknown op or unknown stat key -> throw a clear error naming the offending
modifier. Never silently skip — a malformed arena is a content bug to fix, not
to swallow.
