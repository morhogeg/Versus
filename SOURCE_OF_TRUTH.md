# Versus — Single Source of Truth

> **This is the ONE document.** Backlog, architecture, and session log live here.
> Do NOT create separate HANDOFF/TASKS/spec docs — consolidate into this file.
>
> **How to use it:**
> - **Learning the code?** Start at §1–§2 (product, architecture).
> - **Picking work?** §4 is the ranked backlog — every open task lives there.
> - **Finishing a session?** Update §4 (check boxes, re-rank) and prepend a
>   one-paragraph entry to §9. Page older §9 entries into
>   `docs/reference/session-log-archive.md` once this gets long.
> - **Skills** (`.claude/skills/ship`, `.claude/skills/verify`) point here.
>
> Keep this doc **slim** — it loads into context every session. Move one-time
> reviews / long references into `docs/reference/`.

---

## 1. What Versus is

_(Product overview: what it does, the positioning, the current phase/grade.)_

## 2. Architecture & stack

- **Frontend:** _(framework, where it lives, deploy target)_
- **Backend:** _(language, services, project IDs)_
- **Data:** _(store, schema shape)_
- **Deploy surfaces:** _(each surface + the exact command/trigger)_

### Operational gotchas (hard-won — don't re-learn these)

_(Add every non-obvious footgun here as you hit it: env quirks, deploy traps,
platform-specific bugs. This section is the highest-signal part of the doc —
grow it from real failures, mirror the important ones into the relevant skill's
Gotchas section.)_

## 3. Current state (the thing everything gates on)

_(The one or two facts that block or unblock most work right now — e.g. an auth
cutover, a migration in flight, a flag that's off. Keep it current.)_

## 4. THE BACKLOG — ranked, most urgent → least

> Rank = (blocks launch) > (hard requirement) > (security/cost exposure) >
> (product quality) > (growth/differentiators).

### 🔴 P0 — blockers
1. **[ ]** _(task — what "done" looks like; note any owner-only steps)_

### 🟠 P1 — required for release
2. **[ ]** _(task)_

### 🟡 P2 — hardening
3. **[ ]** _(task)_

### 🟢 P3 — roadmap (post-launch)
4. **[ ]** _(task)_

### ✅ Done — verified against code (do not redo)
- _(move completed items here with commit SHAs)_

## 5. Ship checklist (what the `/ship` skill automates)

1. Scope the diff (which surfaces changed?).
2. Verify: run `/verify` (typecheck + tests + drive the change).
3. Commit on the feature branch with a clear, scoped message.
4. Merge to the default branch and push (triggers any auto-deploy).
5. Deploy each changed surface with its **targeted** command (never a blanket deploy).
6. Update **this document** (§4 checkboxes + §9 session log).

---

## 9. Session log

> One short paragraph per session, newest first. Detail lives in git history —
> this is the orientation trail, not a changelog. Page older entries into
> `docs/reference/session-log-archive.md` as this grows.

- **_(date)_ — Bootstrapped from the reusable Claude Code starter kit.** Seeded
  `CLAUDE.md`, this source-of-truth skeleton, and the `/verify` + `/ship` skill
  templates. Next: fill in §1–§3 and the first real P0 backlog items.

## 10. Known accounts / IDs (quick reference)

- Repo: `morhogeg/versus`.
- _(project IDs, hosting URLs, bundle IDs, etc.)_
