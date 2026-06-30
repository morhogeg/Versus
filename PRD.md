# VersusAI — Product Requirements Document & Technical Specification

**Working title:** VersusAI
**Doc version:** 1.2
**Owner:** Mor
**Intended consumer:** Claude Code (this document is the source of truth, written to be handed directly to an agent)
**Last updated:** June 2026

> **What changed in v1.2:** Real seed content shipped — 12-character roster, 5 arenas, category configs, and editorial featured duels (§2.6, Appendix A/B; files in `/data`). Added stat-balance philosophy (§2.6). Resolved confidence semantics with a recommendation (§12 #1). Added an analytics event taxonomy tied to the success metrics (§13) and a cost / caching / abuse-control section for viral spikes (§14).
>
> **v1.1:** Full design system with committed signature vibe (§3.2). Arena Rankings dashboard + Trending & Suggested Duels for cold-start activation (§3.5, §6). Three expanded skill-file contracts inlined (§10). Aggregate-stats data model (§2.5).

---

## 0. How to read this document (for the agent)

This PRD is the single source of truth. Build in the milestone order in §11. Do not invent scope; if a decision is genuinely blocked, stop and surface it rather than guessing. Every data shape, prompt contract, and component boundary is a contract — honor it exactly so the UI layer and the LLM layer stay decoupled.

The product has exactly **one job**: take two pop-culture characters plus an arena and return a verdict opinionated enough to start an argument and structured enough to render beautifully. Everything else serves that.

---

## 1. Vision & positioning

### 1.1 One-liner
A fighting-game-styled "Who Would Win?" simulator that turns the oldest argument on the internet into a 10-second, infinitely shareable verdict machine.

### 1.2 Why now (trend grounding)
- **Character consistency is the defining consumer-AI motif of 2026.** We ride that current, applied to *judgment* rather than image generation.
- **The scannable two-layer format wins.** Instant punchy answer first, depth second — the product is architected around exactly this.
- **AI × social is still uncracked.** A single-purpose, identity-driven, debate-bait artifact is a wedge into the unsolved "AI as social object" space. The shareable card *is* the growth engine.
- **r/whowouldwin is a pre-existing, self-sustaining demand pool.** We productize a habit millions already perform manually.

### 1.3 What this is NOT
- Not a chatbot with a theme. The conversation surface is hidden; the user only ever sees a structured product.
- Not a wiki. We store *just enough* character data to make the verdict feel grounded.
- Not a hosted-art product. The viral artifact is a **client-generated card built from structured data**, not a diffusion render — fast, free, deterministic, on-brand, copyright-safe.

### 1.4 Success metrics (v1)
- **Activation:** % of first-time visitors who complete one matchup. Target ≥ 60%. *(The Suggested Duels system in §6 is the primary lever here.)*
- **Loop:** matchups per session. Target ≥ 3 (the arena variable is the replay lever).
- **Virality:** share-card generations ÷ completed matchups. Target ≥ 15%.
- **K-factor proxy:** inbound visits landing directly on a shared `/battle/:id` permalink.

---

## 2. Product architecture & data model

### 2.1 Design principle
Three consumers read the character object and the schema must serve all three without glue:
1. **The UI** — numeric stats (0–100) for bars and radar charts.
2. **The Arena engine** — programmatically mutates those stats before the verdict runs.
3. **The LLM prompt builder** — clean, flat, human-readable fields to inject as context.

Keep it flat. Store as JSON documents (Firestore, or flat JSON seed files for v1 — see §4).

### 2.2 Character Profile schema

```json
{
  "id": "tommy_shelby",
  "displayName": "Tommy Shelby",
  "universe": "Peaky Blinders",
  "archetype": "tactician",
  "tier": "A",
  "portraitKey": "tommy_shelby",
  "accentHint": "#3AE0C0",

  "baseStats": {
    "combatSkill":   72,
    "strength":      58,
    "speed":         60,
    "durability":    62,
    "intelligence":  90,
    "willpower":     88,
    "adaptability":  85
  },

  "traits": [
    { "key": "tactical_foresight", "label": "Plans three moves ahead",          "weight": 0.9 },
    { "key": "fearlessness",       "label": "Has already made peace with death", "weight": 0.8 }
  ],

  "gear":       [ { "key": "razor_cap", "label": "Razor-blade flat cap" }, { "key": "revolver", "label": "Service revolver" } ],
  "weaknesses": [ { "key": "no_powers", "label": "Entirely mortal — no enhancements" } ],

  "vibeTags": ["cold", "calculating", "loyal", "haunted"],
  "loreBlurb": "A WW1-hardened gang strategist who wins wars before they start."
}
```

**Field rationale**
- `baseStats` are the *only* numbers the UI and Arena engine touch. Seven fixed axes, always 0–100.
- `traits` / `weaknesses` carry a `weight` so the engine and the LLM reason about *how much* a trait matters.
- `loreBlurb` + `vibeTags` give the narrative layer texture without bloating the prompt.
- `portraitKey` **never** points at a copyrighted image — it maps to a stylized silhouette/avatar we control (§7).
- `accentHint` lets a character carry its own territory color when it makes thematic sense; falls back to the default cyan/magenta assignment otherwise.

### 2.3 Arena system

An Arena is a declarative set of **stat modifiers and rule overrides** applied to *both* characters before the verdict prompt is built. The engine is pure and deterministic; the LLM never sees raw arena math, only resulting modified stats plus a natural-language description of the constraints.

```json
{
  "id": "gotham_alleyways",
  "displayName": "Gotham Alleyways",
  "description": "Cramped, rain-slicked, pitch-dark. Close quarters. No room to run.",
  "modifiers": [
    { "stat": "speed",        "op": "scale", "value": 0.8,  "appliesTo": "all" },
    { "stat": "combatSkill",  "op": "scale", "value": 1.15, "appliesTo": "all", "condition": { "trait": "stealth" } },
    { "stat": "intelligence", "op": "scale", "value": 1.1,  "appliesTo": "all" }
  ],
  "rules": [
    "Visibility is near zero — ranged advantages are heavily reduced.",
    "No escape routes — the fight resolves to a conclusion."
  ],
  "promptFlavor": "A claustrophobic urban kill-box where cunning beats brawn."
}
```

**Modifier ops (closed set):** `scale` (multiply), `add` (flat ±), `set` (override), `cap` (ceiling).

**Resolution order (deterministic — implement exactly):**
1. Clone both characters' `baseStats` → `effectiveStats`.
2. For each modifier, in array order: if `condition` is absent or satisfied by the character's traits, apply `op` to the named stat.
3. Clamp every value to `[0, 100]`.
4. Pass `effectiveStats` + `rules` + `promptFlavor` into the prompt builder.

The arena is what makes the product *replayable*: same fighters, different arena → genuinely different verdict. Treat arenas as first-class content.

### 2.4 Battle record (persisted; powers permalinks & sharing)

```json
{
  "id": "b_8fk2p",
  "fighterA": "tommy_shelby",
  "fighterB": "jaime_lannister",
  "arena": "gotham_alleyways",
  "verdict": { "winnerId": "tommy_shelby", "confidence": 71, "tagline": "Brains in the dark beat a blade in the light." },
  "createdAt": "2026-06-23T10:00:00Z",
  "model": "claude-sonnet-4-6"
}
```

Persist *inputs + verdict summary*, not the full narrative — regenerate or cache long-form on demand.

### 2.5 Aggregate stats (powers the dashboard, trending & suggested duels)

Maintained as incrementally-updated counters, written on each completed battle. Never computed by scanning all battles at read time.

**Character aggregate** (`characterStats/{characterId}`): appearances, wins, losses, winRate, last7dAppearances.

**Duel aggregate** (`duelStats/{pairKey}` where `pairKey` = sorted `"a__b"`): totalRuns, last24hRuns, splitA, splitB.

**Write path (on every completed battle, atomic increment):** bump both characters' appearances + win/loss, recompute winRate, bump the duel totalRuns + recency window + split. Use atomic counters (Firestore `increment`).

### 2.6 Seed content & stat-balance philosophy

The v1 seed ships as real files in `/data`: `characters.json` (12 fighters), `arenas.json` (5 arenas), `categories.json` (Fighting active, Wisdom/Intrigue stubbed), `featured-duels.json` (6 editorial duels).

**Balance is a product requirement.** Calibration rules:
- No character averages above ~86 or below ~60 across the seven axes.
- Spiky, not flat — each fighter has a clear win-on / lose-on fingerprint.
- Power must come with a weakness — every high-tier fighter carries an exploitable `weakness`.
- Mortals are the baseline; enhanced/machine fighters are the spice.
- The arena should be able to flip a matchup.

---

## 3. Frontend UX/UI & gamification

### 3.1 Core user flow
Landing → (Trending/Suggested tap → Results) or (Build your own → Character Select → Arena Select → Tale of the Tape reveal → Results Dashboard → Share). The terminal CTA always offers the cheapest path back to another matchup or into the rankings dashboard.

### 3.2 Design system — committed signature vibe

**Concept: "Two Territories, One Seam."** Each fighter owns a saturated color *territory*; the territories meet at a charged diagonal **VS seam** on a deep ink ground. A third color is the *judgment* color (verdict stamp, winner crown, oracle voice).

**Signature element:** on verdict reveal, the winner's color **surges across the seam** and bleeds into the loser's territory — the screen visibly *takes ground*.

**Palette:**

| Role | Name | Hex |
|---|---|---|
| Ground | Ink | `#0B0A1A` |
| Fighter A | Plasma | `#00E5FF` |
| Fighter B | Pyre | `#FF2D6F` |
| Judgment | Verdict Gold | `#FFE600` |
| Text | Bone | `#F2F0FF` |
| Structure | Ash | `#6B6488` |

**Typography:** Display = heavy compressed grotesque, all-caps (big moments only). Body = clean modern grotesque. Data/stats = monospace.

**Motion (two bold moments only):** fighter lock-in (slam + screen-shake); verdict reveal (seam-flood + gold tagline stamp). Everywhere else subtle. Respect `prefers-reduced-motion` (flood → clean cross-fade + static gold stamp). Visible keyboard focus; full mobile responsiveness.

### 3.3 Key components
CharacterGrid, StatWheel/RadarChart, ArenaCard, TaleOfTheTape, VerdictBanner, ShareCard, DuelStrip, RankingsDashboard.

### 3.4 Three ways to display the outcome (layered by depth)
1. **Instant Verdict** (punchy, top) — `WINNER · 71% · "tagline"`.
2. **Categorical Breakdown** (scannable, middle) — per-axis winner + radar overlay.
3. **Cinematic Narrative** (deep, collapsible bottom) — short vivid prose, default collapsed.

### 3.5 Cold-start solved: tap-to-play
Landing leads with DuelStrip (Trending + Suggested). Tap a pre-built duel → straight to a fully-rendered results page.

---

## 4. Tech stack & execution plan

### 4.1 Recommended stack
Frontend: React + Vite + TS, Zustand, Framer Motion, Tailwind. Backend: lightweight serverless. Data: flat JSON seed + edge KV/Firestore for BattleRecord + aggregates. LLM: Claude (Sonnet tier).

> **This build:** Next.js 16 (App Router) instead of Vite — Vercel-native, built-in API routes. Persistence via Firestore (firebase-admin) with in-memory fallback. See CLAUDE.md.

### 4.2 State shape (Zustand)
```ts
{
  phase: 'landing' | 'select' | 'arena' | 'revealing' | 'results',
  fighterA: CharacterId | null,
  fighterB: CharacterId | null,
  arena: ArenaId | null,
  verdict: Verdict | null,
  streamBuffer: string,
  error: string | null
}
```

### 4.3 API & prompt strategy

**Endpoints:** `POST /api/battle` (streams structured verdict), `GET /api/duels/trending`, `GET /api/duels/suggested`, `GET /api/rankings`.

**`/api/battle` server responsibilities (in order):** validate ids against roster → load characters + arena server-side → run deterministic Arena engine → build prompt from fixed template → call LLM with strict structured-output instruction and stream → parse defensively, persist BattleRecord, atomically update aggregates, return verdict id.

**Structured output contract** — model returns only this JSON, no preamble/fences:
```json
{
  "winnerId": "tommy_shelby",
  "confidence": 71,
  "tagline": "Brains in the dark beat a blade in the light.",
  "categories": [
    { "axis": "combatSkill",  "winnerId": "jaime_lannister", "note": "..." },
    { "axis": "intelligence", "winnerId": "tommy_shelby",    "note": "..." }
  ],
  "narrative": "Two short paragraphs of vivid, arena-specific fight prose."
}
```

**Prompt-builder rules** (full contract in skills/verdict-prompt.md): inject effectiveStats not base stats; decisive irreverent analyst persona that always commits to a winner and never hedges; tagline ≤ 12 words; stream for the reveal; parse JSON once stream closes.

---

## 5. Virality & growth loops
"Share to Debate" — a client-generated image card rendered from the structured verdict (HTML/Canvas → PNG). Three share surfaces (Reddit, X, TikTok/Reels) with tailored copy. The disagreement mechanic ("You think it's wrong?") flips one variable and instantly generates a counter-verdict to share back. Category roadmap: Fighting (v1) → Wisdom/Intrigue (v2) → Survival (v3) → Crossover chaos. Categories are config, not code.

## 6. Dashboard, Trending & Suggested Duels
Arena Rankings dashboard (Hall of Champions / Most Used / Hottest Duels), Trending Duels landing strip, Suggested Duels (editorial + algorithmic "spicy"), all powered by §2.5 aggregates. *(Out of scope for the M1–M4 build; engine is built to support it.)*

## 7. Contingency & legal risk mitigation
Text-and-stat profiles only. Original stylized portraits. No franchise branding. Clear non-affiliation disclaimer. Parody/commentary framing. Per-character kill switch. Keep everything the user *sees* yours; keep franchise presence to unprotectable facts (names, who-they-are).

## 8. Repository structure
See the actual tree in this repo. `/data` seed JSON, `/skills` skill contracts, `/src` app (components, state, lib, styles), Next.js route handlers under `src/app/api`.

## 9. CLAUDE.md
See CLAUDE.md at repo root (agent operating contract).

## 10. Skill file contracts
Full contracts live in `/skills`: `arena-engine.md`, `verdict-prompt.md`, `share-card.md`.

## 11. Build milestones (phased)
- **M1** — Core loop, no polish: arena engine → prompt builder → real streamed verdict as JSON. Wire verdict caching.
- **M2** — Three-layer results view: banner + categorical breakdown + radar + collapsible narrative. Seed roster/arenas. First design-system pass.
- **M3** — Selection experience: CharacterGrid, arena cards, TaleOfTheTape, lock-in micro-interaction, verdict seam-flood. Full design pass.
- **M4** — Share to Debate: client-side card generation, `/battle/:id` permalinks, per-surface copy, counter-verdict affordance.
- **M5** — Dashboard, Trending & Suggested Duels (+ rate limiting / circuit breaker). *(Out of scope for this build.)*
- **M6** — Category abstraction (Wisdom/Intrigue). *(Out of scope for this build.)*

## 12. Open decisions
1. **Confidence semantics** — RESOLVED: "probability winnerId wins this matchup in this arena," integer 1–99. UI label reads as a probability.
2. Narrative length/tone — short, two paragraphs, irreverent.
3. Roster sourcing — hand-curated 12 (Appendix A).
4–6. (Relevant to M5+ / out of scope here.)

## 13. Analytics & event taxonomy
Events: session_start, duel_tapped, matchup_built, verdict_requested, matchup_completed, narrative_expanded, counter_verdict, card_generated, share_clicked, rankings_viewed. Two ratios that matter: matchup_completed ÷ session_start (activation) and card_generated ÷ matchup_completed (virality).

## 14. Cost, caching & abuse control
Caching is the single biggest lever: a verdict is a pure function of `(fighterA, fighterB, arena, model, promptVersion)` — cache it. `promptVersion` constant invalidates the cache. Per-IP rate limiting on uncached calls + a global circuit breaker. Validate ids against the roster server-side (closed set → bounded input space → no free-text reaches the model).

---

## Appendix A — Seed roster (`/data/characters.json`)

| Fighter | Universe | Archetype | Tier | Signature (high / low) | Avg |
|---|---|---|---|---|---|
| Jaime Lannister | Game of Thrones | warrior | S | combat 88 / willpower 68 | 75 |
| Jon Snow | Game of Thrones | warrior | A | willpower 88 / intelligence 66 | 77 |
| Tommy Shelby | Peaky Blinders | tactician | A | intelligence 92 / strength 58 | 75 |
| Lincoln Burrows | Prison Break | bruiser | B | strength 82 / intelligence 60 | 72 |
| Geralt of Rivia | The Witcher | mystic | S | combat 92 / intelligence 78 | 86 |
| Walter White | Breaking Bad | mastermind | C | intelligence 98 / combat 30 | 62 |
| Beatrix Kiddo | Kill Bill | warrior | S | willpower 96 / strength 70 | 83 |
| Arya Stark | Game of Thrones | tactician | B | adaptability 90 / strength 52 | 76 |
| Omar Little | The Wire | survivor | B | adaptability 84 / durability 66 | 75 |
| The T-800 | The Terminator | bruiser | S | durability 99 / adaptability 50 | 81 |
| Furiosa | Mad Max | survivor | B | willpower 92 / strength 68 | 79 |
| Hannibal Lecter | Silence of the Lambs | mastermind | B | intelligence 99 / durability 60 | 79 |

## Appendix B — Seed arenas (`/data/arenas.json`)

| Arena | Boosts | Suppresses | Who it favors |
|---|---|---|---|
| Gladiator Pit | strength, combat | intelligence, adaptability | Raw fighters |
| Gotham Alleyways | intelligence, +combat for stealth | speed | Cunning & stealth |
| 48-Hour Prep Time | intelligence, adaptability | combat | Masterminds |
| Frozen Tundra | willpower, durability | speed | Survivors & the unkillable |
| Crowded Marketplace | adaptability, intelligence | strength | Improvisers |

The design target: every arena can flip at least one matchup.

---

*End of PRD v1.2 (committed copy; see the original brief for full prose of §5–§14.)*
