# canva-designer agent

## Overview
Sub-agent 3 at `.claude/agents/canva-designer.md`. Four phases: `directions` (3 visual directions, no API calls — pure LLM); `backgrounds` (3 OpenAI gpt-image pairs of banner 1024×1984 + header 2304×800 via `scripts/openai_image.js`, with mandatory central-third sentence for header prompts); `compose` (sharp resize via `scripts/resize.js` → Canva upload → editing transactions → export); `abort` (cancels open Canva editing transactions). Stateless. Reads [[visual-design-principles-skill]] and [[marketing-thinking-skill]] before each phase. Tools: 10 Canva MCP tools + `Read, Write, Bash`.

## Open Questions
- D2 — local file upload to Canva (see [[brand-researcher-agent]]).
- D3 — `generate-design-structured` for custom 310×600 / 1366×200 dimensions, with `resize-design` as fallback.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Agent and skill wiring were authored previously.
- **Decisions:** RTL strategy = gpt-image generates **pure imagery, no text**; Canva native composition adds Hebrew text on top (`perform-editing-operations`). This avoids the v2.0 PRD's placeholder/find-and-replace hack.
- **Notes / Caveats:** Header prompt must contain the exact "central horizontal third" sentence — `resize.js` crops top:137 from the 1366×474 intermediate, anything in outer thirds is lost. Quality gates §7 of [[visual-design-principles-skill]] must pass before returning `status:"ok"` from `compose`.
- **Related:** [[banner-orchestrator-agent]], [[visual-design-principles-skill]], [[marketing-thinking-skill]], [[openai-image-script]], [[resize-script]], [[copywriter-agent]]
