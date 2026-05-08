# visual-design-principles skill

## Overview
Brand-knowledge skill at `.claude/skills/visual-design-principles.md`. Loaded by [[canva-designer-agent]] across all 4 phases (`directions`, `backgrounds`, `compose`, `abort`). Sections: §1 Format constraints (310×600 banner zones; 1366×200 header zones with crop awareness), §2 Color theory + WCAG AA contrast rules + 6 hospitality contrast pairs + the "generic blue" warning, §3 Visual Direction archetypes (Immersive Scene / Color Block / Gradient Atmosphere), §4 OpenAI image prompt construction (with the **mandatory** central-third sentence for all header prompts), §5 Typography guidelines (font selection by vertical, size hierarchy), §6 Logo placement rules (size limits 60–120px, top zone, RTL/LTR alignment), §7 Visual quality gates checklist, §8 Canva editing operations order, §9 common design mistakes table.

## Open Questions
- D2 — local file upload to Canva (also relevant here for the resized backgrounds).
- D3 — `generate-design-structured` for custom dimensions.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Skill was authored in prior sessions.
- **Decisions:** §4's central-third sentence is **mandatory verbatim** in every header gpt-image prompt — this is a hard contract with [[resize-script]] which crops top:137 from the 474px-tall intermediate.
- **Notes / Caveats:** §7 quality gates must all pass before `phase=compose` returns `status:"ok"`. §8 ordering (bg → text → logo → commit) is non-negotiable.
- **Related:** [[canva-designer-agent]], [[openai-image-script]], [[resize-script]], [[marketing-thinking-skill]], [[hospitality-copywriting-skill]]
