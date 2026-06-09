# canva-mcp-operations Skill

## Overview
The **mechanical playbook** for driving the Canva MCP server, extracted from [[canva-designer-agent]] in the 2026-05-25 refactor. Covers: §1 asset upload (`file://` vs local `http.server` fallback — open question D2); §2 creating designs at custom dimensions (`generate-design-structured` first, `generate-design`+`resize-design` fallback — D3); §3 the editing-transaction lifecycle (start → perform → commit, cancel-on-failure); §4 export → re-download → sharp dimension assertion; §5 get edit URL; §6 abort/cleanup; §7 read-only ops (for [[design-qa-agent]]). This is the *how to call the API*; [[visual-design-principles-skill]] is the *what to design*. Read by canva-designer, asset-forge, format-multiplier, and design-qa. File: `.claude/skills/canva-mcp-operations.md`.

## Open Questions
- D2/D3 (inherited from [[architecture-overview]]) are documented here as the canonical procedure but still unconfirmed against the live MCP.

## Session Log

### 2026-05-25 — Extracted from canva-designer [wip]
- **What was done:** Created the skill from canva-designer Steps 5b–5f + the abort cancel logic. canva-designer now points here for upload/create/export/edit-url/abort, keeping only design-specific Steps 5a (sharp resize) and 5d (compose operations payload).
- **Decisions:** Separate the Canva *mechanics* from the design *principles* — both now reusable by every Canva-touching agent (canva-designer, asset-forge, format-multiplier, design-qa) without duplication.
- **Notes / Caveats:** §7 read-only subset exists specifically so design-qa can inspect without ever opening a transaction.
- **Related:** [[architecture-overview]], [[canva-designer-agent]], [[visual-design-principles-skill]], [[design-qa-agent]], [[asset-forge-agent]], [[format-multiplier-agent]]
