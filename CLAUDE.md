# VersusAI — Agent Operating Contract

You are building VersusAI per PRD.md. PRD.md is the source of truth; this file is your standing rules.

## Build order
Follow the milestones in PRD.md §11. Ship each milestone as a runnable slice before the next.

## Hard contracts (never violate)
- The Arena engine (src/lib/arenaEngine.ts) is PURE and DETERMINISTIC. No LLM calls inside it.
- UI and Arena engine read ONLY the seven fixed `baseStats` keys. Never add an eighth axis without updating the radar, schema, and every category config together.
- The verdict prompt MUST forbid hedging. Every verdict commits to a winner and a confidence number. "It depends" is a bug.
- Stats are loaded and computed SERVER-SIDE. Never trust client-sent stats.
- Aggregates are updated with ATOMIC increments on every completed battle. Never read-modify-write the whole roster.
- Portraits map to OWN stylized assets only. Never reference, store, or fetch copyrighted franchise imagery.

## Design
- Match the frontend-design skill. The signature is the "Two Territories, One Seam" system (PRD §3.2): two opposing color territories meeting at a charged VS seam on deep ink, with a gold judgment color.
- Spend boldness on TWO moments only: fighter lock-in, and the verdict seam-flood. Keep everything else quiet.
- Do NOT drift to the generic single-neon-accent-on-black look. The two fighting colors ARE the brand.
- Respect prefers-reduced-motion, visible keyboard focus, full mobile responsiveness.

## Style
- Outcome-oriented: I give goals + constraints; you own implementation reasoning.
- Decompose into parallelizable, independently testable slices.
- Concrete over clever in all user-facing copy.

## When blocked
If an open decision in PRD.md §12 blocks you, STOP and surface it. Do not guess past an unresolved architectural decision.

## Stack notes (this build)
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. Zustand for state, Framer Motion for the two reveal moments.
- `/api/battle` is a Next.js route handler (Node runtime). LLM = Claude Sonnet via @anthropic-ai/sdk, with a deterministic mock fallback when ANTHROPIC_API_KEY is unset.
- Persistence = Firestore via firebase-admin, with an in-memory fallback when no service-account creds are configured. The app runs with zero env config.
