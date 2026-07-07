# Reusable Claude Code starter kit

This repo is seeded with a portable version of the workflow that the MyLinks /
Machina project evolved over dozens of sessions. The idea (from the Claude Code
team's *Getting started with loops*): a good agentic loop depends on the **system
around it** — a clean codebase, a way for Claude to verify its own work, and docs
that stay reachable and cheap to load. Start every new project with this machinery
instead of rebuilding it.

## What's here

```
CLAUDE.md                      # pointer file → SOURCE_OF_TRUTH.md + the core rules
SOURCE_OF_TRUTH.md             # the ONE doc: overview, backlog (§4), ship list, session log (§9)
.claude/skills/verify/SKILL.md # turn-based loop: verify a change end-to-end, not on typecheck alone
.claude/skills/ship/SKILL.md   # release automation + mandatory source-of-truth update
.claude/settings.json          # empty permission allowlist to grow (see below)
docs/reference/                # where one-time reviews + archived session-log entries go
```

## How to use it on a new project

1. **Fill in `SOURCE_OF_TRUTH.md`** §1–§3 and your first real P0 backlog items.
   Keep it slim — it loads into context every session. Move long, one-time
   material into `docs/reference/`.
2. **Fill in the skill TODOs** — the real typecheck/test/run commands in
   `verify`, the real per-surface deploy commands in `ship`.
3. **Grow the Gotchas sections from real failures.** Every time a bug slips past
   verification, add the check that would have caught it. This is what makes the
   loop compound instead of repeating mistakes.
4. **Reduce permission prompts** with the `/fewer-permission-prompts` skill — it
   scans your transcripts and writes a *reviewed* allowlist into
   `.claude/settings.json`. (Do it via the skill, not by hand: an agent
   self-granting a broad allowlist is blocked by the harness, by design.)

## The loop playbook (general, any project)

From *Getting started with loops* — pick the simplest primitive that fits:

| Loop | Hand off | Reach for |
|---|---|---|
| **Turn-based** | the check | the `/verify` skill (quantitative self-checks) |
| **Goal-based** | the stop condition | `/goal <criteria>, stop after N tries` |
| **Time-based** | the trigger | `/loop <interval> <prompt>`, `/schedule` |
| **Proactive** | the prompt | routines + dynamic workflows + auto mode |

Cross-cutting habits:
- **Give Claude a way to verify itself** — the single highest-ROI investment.
- **Encode failures into the system, not just the fix** — a gotcha, a hook, a
  test — so every future iteration benefits.
- **Second-agent review** (`/code-review`) — fresh context is less biased.
- **Manage tokens** — right-size the primitive and model, set clear stop
  criteria, use scripts for deterministic work, pilot before large runs, review
  with `/usage`.

### Optional: a deploy guard hook

If this project has a dangerous "blanket deploy" command, add a `PreToolUse` hook
that blocks it and points at the targeted command — see MyLinks
`.claude/hooks/guard-firebase-deploy.py` for the pattern (a small Python script
reading the tool payload on stdin, exit 2 to block). Wire it into
`.claude/settings.json` yourself — Claude Code requires a human to edit settings,
since hooks run arbitrary commands.
