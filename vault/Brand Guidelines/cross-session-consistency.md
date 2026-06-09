# Cross-Session Brand Consistency

## Overview
How EzGo keeps every venue's banner feeling **distinct** while each individual brand stays **internally consistent** — without anyone maintaining a manual brand bible. The mechanism is the SQLite registry ([[sqlite-brand-registry]]) that the agents read and write during every `/banner-create` run. This doc is the **policy** (what we promise + the thresholds); the registry doc is the **implementation**.

Two consistency goals, sometimes in tension:
1. **Within a client** — the same venue, across sessions, should reuse its palette, fonts, and voice (same slug → `get-client-history`).
2. **Across clients** — two *different* venues should not end up looking or sounding the same. This is the cross-session **distinctiveness** guard.

## The two guards

### Palette distinctiveness (color)
- After the brand-researcher extracts a primary color, it queries `find-similar-palette` (CIE-LAB **ΔE76**). Any earlier client within **ΔE 10** is written to `brand_profile.similar_clients`.
- The orchestrator surfaces this at the brand-confirm gate: *"the palette is very close to {client} (ΔE {x})."*
- To stay distinct, canva-designer applies [[advanced-color-theory-skill]] §5 — shift the palette **≥10 ΔE** (usually a 20–40° hue rotation).
- Why ΔE76 and not hex distance: ΔE is *perceptual*. `#E9DEDE` and `#EAD8D8` look identical (ΔE ≈ 3) even though their hex differs.

### Headline distinctiveness (copy)
- At the headline gate, the orchestrator runs `find-duplicate-headline` (**Jaccard** token overlap) against prior headlines **in the same vertical**.
- A candidate scoring **≥ 0.7** is flagged `duplicate_risk`, with the existing headline shown, so the user picks with eyes open.
- Jaccard is language-agnostic — it tokenises Hebrew as happily as English.

## Thresholds (single source of truth)

| Guard | Metric | Threshold | Where |
|-------|--------|-----------|-------|
| Palette too similar | ΔE76 | < 10 | `find-similar-palette` |
| Headline too similar | Jaccard | ≥ 0.7 | `find-duplicate-headline` |
| Move-away target when distinct | ΔE76 | ≥ 10 | [[advanced-color-theory-skill]] §5 |

These may need per-vertical tuning once 5+ clients exist (a spa market is more crowded in soft pinks than a marine market is in navy).

## What gets remembered
On every completed run the orchestrator records: the client (+ `business_type`), its palette (primary / secondary), the chosen headline (+ style / language), and the exported assets. Aborted runs are marked `aborted`. Legacy session folders are back-filled by `migrate_existing_sessions.js`.

## Boundaries
- **Advisory, never blocking** — the user always decides; an empty registry simply means no warnings.
- The registry is local + gitignored (`output/brands.db`) — each operator has their own brand memory. Shared brand intelligence across a team would be a future Postgres / Supabase decision.

## Related
[[sqlite-brand-registry]] (implementation) · [[advanced-color-theory-skill]] (ΔE move-away) · [[brand-researcher-agent]] · [[copywriter-agent]] · [[banner-orchestrator-agent]]
