# Skill: Share Card

## Purpose
Render the verdict as a single, on-brand, instantly-shareable image, fully
client-side. No diffusion, no server render, deterministic, copyright-safe.

## Tech
HTML/CSS node -> PNG via html-to-image (or canvas). Two export sizes:
- Social square/landscape (Reddit/X): 1200x675
- Vertical (TikTok/Reels still): 1080x1920
Optional: capture the 3s seam-flood reveal as a short clip for vertical.

## Anatomy (must include, in the §3.2 design system)
- Deep Ink ground (#0B0A1A).
- VS split: fighter A territory (Plasma / accentHint) left, fighter B (Pyre)
  right, charged diagonal seam between. Winner's color dominates more of the
  card (took ground).
- Both fighters: OWN stylized portrait (never franchise art) + displayName in
  compressed display face.
- Arena name as a small constraint badge.
- Verdict tagline stamped large in Verdict Gold (#FFE600) — the hero element.
- Winner crown + confidence % in mono.
- Footer: `versusai` wordmark + short permalink (/battle/:id).

## Per-surface copy (returned alongside the image)
- reddit: { title: "<A> beats <B> in <arena> — <confidence>%. Fight me.",
           body: "<permalink>" }
- x:      "<tagline> — <A> over <B>. Settle it: <permalink>"
- tiktok: caption with 2-3 fight/fandom hashtags + permalink

## Rules
- Tagline text must fit one or two lines; auto-shrink to fit, never truncate
  the punchline.
- Never place copyrighted imagery or franchise logos on the card.
- The card must be readable at thumbnail size — that's where the scroll-stop
  happens. Test at 25% scale.
