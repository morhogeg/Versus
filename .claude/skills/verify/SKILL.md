---
name: verify
description: Verify a change end-to-end before declaring it done — never report a change complete on a successful edit or typecheck alone. Use after any non-trivial change, before /ship, and whenever the user asks "does it work" / "verify" / "check it". Runs the static checks and drives the actual change in a real environment.
---

# Verifying Versus changes

The goal: encode the checks a careful reviewer would run so Claude can
self-verify instead of handing back work that only *type-checks*. **The more
quantitative the check, the easier it is to self-verify** — a green typecheck is
necessary but never sufficient for a behavior change.

**Never report a change as complete based on a successful edit or typecheck
alone.** Exercise it, observe the result, and report what you actually saw.

## When to run
- After any non-trivial code change → full sequence.
- Docs/config-only change with no runtime surface → skip.
- Always before `/ship`.

## The sequence

### 1. Static checks (fast, always)
```bash
# TODO: the project's typecheck / lint / compile commands, e.g.
# npm run typecheck   /   cargo check   /   python -m py_compile ...
```

### 2. Tests (if they exist / apply)
```bash
# TODO: the project's test command, scoped to what changed when possible.
```

### 3. Drive the actual change
Run the thing and exercise the change the way a user or caller would — this is
the step that catches what static analysis can't (runtime crashes, a control
that renders but does nothing, a wrong result).
```bash
# TODO: start the app / call the endpoint / run the CLI, then assert the
# expected observable outcome. For UI, drive it in a real browser (Playwright +
# the pre-installed Chromium) and fail on console errors — see the MyLinks
# verify skill's smoke.mjs for a reusable pattern.
```

If any step fails, fix it and rerun from step 1 — never hand back a partial pass.

## Report format
State what you observed, not "it should work" — e.g. "typecheck clean; tests
green; ran X and saw Y." If something can only be checked manually (a device, an
external service), say so explicitly and list it.

## Gotchas (grow this from real failures — the highest-signal part of the skill)
<!-- Each time a bug slips past verification, add the check that would have caught
     it here. This is how the skill compounds. -->
- _(none yet — add the first one the moment a change looks verified but isn't.)_
