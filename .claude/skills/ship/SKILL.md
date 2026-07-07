---
name: ship
description: Ship Versus. Verify, commit, merge the current branch to the default branch, deploy each changed surface with its targeted command, and update SOURCE_OF_TRUTH.md for the next session. Use whenever the user says ship, deploy, release, "push it live", or "make it live".
---

# Ship Versus

> **Before anything:** read `SOURCE_OF_TRUTH.md` (repo root) — architecture,
> deploy gotchas (§2), and the ranked backlog (§4). All post-ship documentation
> goes THERE (§4 checkboxes + §9 session log) — never create HANDOFF/spec files.
>
> 🚨 **Every ship MUST update `SOURCE_OF_TRUTH.md` before it's done.** In the same
> ship: (1) prepend a dated §9 entry covering what advanced AND any new issues /
> workarounds / deferred owner steps (name commit SHAs, versions, endpoints);
> (2) check off / add / re-rank §4 items; (3) update §3 / §2 gotchas if state or
> an operational gotcha changed. A ship that deploys code but leaves the source of
> truth stale is INCOMPLETE.

## Steps

1. **Assess scope.** `git status` + `git diff --name-only <default>...HEAD` — which
   surfaces changed? Only deploy what changed.
2. **Verify.** Run the `/verify` skill — must pass. Don't ship on a green
   typecheck alone.
3. **Commit** uncommitted work on the feature branch with a clear, scoped message.
4. **Merge to the default branch and push.**
   ```bash
   git checkout <default> && git merge <feature-branch> --no-ff --no-edit && git push
   ```
5. **Deploy each changed surface with its TARGETED command.** Never a blanket
   deploy — deploy exactly the services that changed. _(TODO: fill in the real
   per-surface commands for this project.)_
6. **Update `SOURCE_OF_TRUTH.md`** (see the 🚨 block). Commit + push the doc.
7. **Report** exactly what shipped and where, with any follow-up owner steps.

## Notes / gotchas
- Don't redeploy what didn't change.
- _(Add deploy footguns here as you hit them — mirror the load-bearing ones into
  SOURCE_OF_TRUTH §2.)_
