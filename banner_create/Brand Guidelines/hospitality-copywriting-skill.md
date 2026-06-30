# hospitality-copywriting skill

## Overview
Brand-knowledge skill at `.claude/skills/hospitality-copywriting.md`. Loaded exclusively by [[copywriter-agent]] during `mode=generate`. Sections: §1 the 3 required styles with deep examples in Hebrew + English (direct / emotional / adventurous), §2 Hebrew RTL writing rules (word order, count targets 3–6, register by audience), §3 quality checklist, §4 internal headline prompt template, §5 forbidden phrases list (ברוכים הבאים, "unforgettable experience", etc.), §6 regeneration logic (don't repeat, shift angle), §7 `chosen_copy.json` output format.

## Open Questions
- Forbidden phrases list — should grow over time based on real run feedback; currently ~10 entries.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Skill was authored in prior sessions.
- **Decisions:** Hebrew word-count target distinct from English (3–6 vs 4–8) — this is enforced as a quality-gate check, not a soft suggestion.
- **Notes / Caveats:** §5 forbidden phrases are the strongest filter — every generated headline is checked against this list before being returned to the orchestrator.
- **Related:** [[copywriter-agent]], [[marketing-thinking-skill]], [[visual-design-principles-skill]]
