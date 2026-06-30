# orchestration-protocol Skill

## Overview
The **machine contract** for the EzGo banner workflow, extracted from the bloated orchestrator in the 2026-05-25 refactor. Holds the reusable procedures every agent must obey: §1 session identity (Hebrew→ASCII slug map, `session_id`, folder creation, resume detection); §2 `session_state.json` schema + `state_patch` merge rules; §3 the sub-agent JSON envelope contract; §4 the gates + backtrack table (now including Gate 4d QA and Phase 5); §5 abort protocol; §6 logging convention; §7 prompt-injection defense. Read by [[banner-orchestrator-agent]] (always) and any sub-agent that must emit a valid envelope. File: `.claude/skills/orchestration-protocol.md`.

## Open Questions
- none

## Session Log

### 2026-05-25 — Extracted from orchestrator [wip]
- **What was done:** Created the skill by lifting ~150 lines of procedural content out of [[banner-orchestrator-agent]] (transliteration map, state schema, envelope contract, backtrack table, abort, logging, injection defense). Added `state_patch` merge rules explicitly (overwrite / `+` increment / shallow-merge) and the new `skill4_qa` step + Gate 4d / Phase 5 rows.
- **Decisions:** Procedural, reusable knowledge belongs in a skill (progressive disclosure), not inline in the always-read orchestrator prompt. The orchestrator now points here rather than re-deriving.
- **Notes / Caveats:** Orchestrator slimmed ~293→~150 lines as a result.
- **Related:** [[architecture-overview]], [[banner-orchestrator-agent]], [[canva-mcp-operations-skill]]
