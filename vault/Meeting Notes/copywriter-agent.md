# copywriter agent

## Overview
Sub-agent 2 at `.claude/agents/copywriter.md`. Two modes: `mode=generate` returns 3 headline options in 3 distinct styles (direct / emotional / adventurous), 4–8 words English or 3–6 Hebrew; `mode=finalize` writes `chosen_copy.json` with `{headline, language, direction, style, rejected_alternatives}`. Pure LLM agent — tools are `Read, Write` only. Reads [[marketing-thinking-skill]] for value-proposition lift and [[hospitality-copywriting-skill]] for style definitions, RTL rules, and the forbidden phrase list before generating.

## Open Questions
- Maximum regeneration rounds — currently 3 before falling back to brand-profile refinement; may need user-tuning.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Agent was authored in prior sessions and wired to both brand skills.
- **Decisions:** Stateless and pure LLM — no API calls — keeps it fast and easy to regenerate. `direction` field auto-derived from `language` (he→rtl, en→ltr) and consumed by the canva-designer for text element placement.
- **Notes / Caveats:** Hebrew word-count target is **3–6**, not 4–8 — Hebrew carries more meaning per word visually.
- **Related:** [[banner-orchestrator-agent]], [[hospitality-copywriting-skill]], [[marketing-thinking-skill]], [[canva-designer-agent]]
