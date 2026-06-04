# advanced-color-theory skill

## Overview
Brand-knowledge skill at `.claude/skills/advanced-color-theory.md`. The **deep** color reference, loaded by [[canva-designer-agent]] in `directions` (palette + psychology) and `compose` (accessible pairs). **Extends** [[visual-design-principles-skill]] §2 (basic roles + contrast pairs) rather than duplicating it. Sections: §1 Color harmonies (mono / analogous / complementary / split-complement / triadic, with hue recipes + hospitality fit), §2 Deriving a full palette from one brand color (HSL math for secondary / accent / background tints + a worked example), §3 the 60-30-10 proportion rule (mapped onto the 3 C2 variants), §4 Accessible text/background pairs (auto-contrast decision, ties to [[validate-export-script]]'s WCAG check, fixing a failing accent), §5 Perceptual difference ΔE and cross-session distinctiveness (reads ΔE76 from [[sqlite-brand-registry]]; how to move ≥10 ΔE off a look-alike client), §6 Color psychology per hospitality vertical, §7 common color mistakes.

## Open Questions
- HSL conversions are done by reasoning / ad-hoc `node -e`. If precision becomes a pain, a tiny `scripts/color.js` helper (hex↔HSL, rotate, contrast) could back this skill — deferred until needed.
- ΔE distinctiveness is advisory at the direction stage; a future loop could auto-propose a shifted palette when `similar_clients` is non-empty.

## Session Log

### 2026-06-04 — D1: created [shipped]
- **What was done:** Authored the skill and wired it into [[canva-designer-agent]] (directions §1/§2/§6, compose §4/§3, plus a distinctiveness key-rule tied to `brand_profile.similar_clients`).
- **Decisions:** Deliberately **extends** visual-design §2 rather than duplicating — basic contrast pairs stay there; harmonies, HSL palette derivation, ΔE strategy, and vertical psychology live here. ΔE guidance is wired to the C4 cross-session warning (move ≥10 ΔE off a look-alike, usually a 20–40° hue rotation).
- **Related:** [[visual-design-principles-skill]], [[canva-designer-agent]], [[validate-export-script]], [[sqlite-brand-registry]], [[photography-composition-skill]]
