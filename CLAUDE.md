# Versus

<!-- One-paragraph description of what Versus is. Replace this. -->
_(Project description goes here — what it does, who it's for, the current phase.)_

**Read `SOURCE_OF_TRUTH.md` first.** It is the single source of truth for this
project: overview + architecture (§1–§2), the ranked backlog (§4), ship checklist
(§5), and the session log (§9). Keep it slim (the hot path) — page older
session-log entries and one-time strategy docs into `docs/reference/` as it grows.

Rules:
- When learning the codebase or picking work, start from `SOURCE_OF_TRUTH.md` §4.
- When a change needs documenting, update `SOURCE_OF_TRUTH.md` (check boxes in §4,
  add a §9 session-log entry). Do **not** create new HANDOFF/TASKS/spec docs — the
  source of truth is the one doc.
- Verify with the `/verify` skill before declaring a change done — never on a green
  typecheck alone.
- Ship via the `/ship` skill.

> This file was seeded from the reusable Claude Code starter kit (see
> `docs/STARTER_KIT.md`). Fill in the project specifics and delete this note.
