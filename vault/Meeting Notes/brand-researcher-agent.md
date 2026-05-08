# brand-researcher agent

## Overview
Sub-agent 1 at `.claude/agents/brand-researcher.md`. Two modes: `mode=profile` runs the website→Facebook→Instagram→manual-interview waterfall and writes `brand_profile.json` (extracts colors via colorthief, fonts, logo URL, language, tone); `mode=logo` resolves the logo via Branch A (download + convert + upload to Canva) or Branch B (generate 3 Canva candidates with EXIF disclosure). Stateless. Returns JSON envelopes — never asks the user directly. Uses [[marketing-thinking-skill]] for vertical identification and gap analysis. Tools include `WebFetch`, `WebSearch`, `Bash`, and 4 Canva MCP tools.

## Open Questions
- D2 — Does `upload-asset-from-url` accept `file://`? If not, Branch A needs a local HTTP server fallback (`python3 -m http.server`).
- Q1 (PRD) — Generic background color filter: currently relies on user gate; may need a hardcoded filter list.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The agent and the marketing-thinking skill linkage were authored in prior sessions.
- **Decisions:** Profile + logo merged into a single dual-mode agent (rather than two agents) — both are research/extraction tasks with shared context (colors, business name).
- **Notes / Caveats:** Scraped HTML must be wrapped in `<UNTRUSTED_DATA>` tags before being interpolated into the LLM prompt — prompt-injection defense.
- **Related:** [[banner-orchestrator-agent]], [[marketing-thinking-skill]], [[architecture-overview]]
