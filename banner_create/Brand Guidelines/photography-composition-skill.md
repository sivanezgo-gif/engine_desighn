# photography-composition skill

## Overview
Brand-knowledge skill at `.claude/skills/photography-composition.md`. Loaded by [[canva-designer-agent]] in `backgrounds` (composing the AI image prompts) and `compose` (placing text in the calm zone). **Extends** [[visual-design-principles-skill]] §4 (the prompt skeleton) with compositional reasoning. The throughline: compose imagery that leaves a **text-safe** home for the Hebrew headline and survives the header center-crop. Sections: §1 Rule of thirds + focal placement, §2 Negative space = the text zone (the key rule; ties to [[validate-export-script]]'s legibility / busy-background check), §3 Leading lines & depth, §4 Horizon placement per aspect ratio (banner low/high horizon; header within the central third for [[resize-script]]'s crop), §5 Viewpoint & framing per mood, §6 Light & time of day (ties to [[advanced-color-theory-skill]] temperature), §7 drop-in composition prompt patterns, §8 composition checklist.

## Open Questions
- The text-safe zone coordinates are heuristics that mirror the `validate_export.js` text-region defaults; if those region boxes are tightened later (real Canva geometry), keep the two in sync.

## Session Log

### 2026-06-04 — D1: created [shipped]
- **What was done:** Authored the skill and wired it into [[canva-designer-agent]] `backgrounds` (§2 text-safe space, §4 horizon, §7 prompt patterns).
- **Decisions:** Framed around the two automated checks it must satisfy — the legibility / busy-background check (compose negative space on purpose) and the header central-third crop. Pairs with [[advanced-color-theory-skill]] on light / temperature consistency.
- **Related:** [[visual-design-principles-skill]], [[canva-designer-agent]], [[validate-export-script]], [[resize-script]], [[advanced-color-theory-skill]]
