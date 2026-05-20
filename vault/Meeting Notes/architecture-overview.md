# Architecture Overview

## Overview
EzGo banner generation system: a multi-agent Claude Code project that produces a 310×600 side banner + 1366×200 header per new hospitality venue. Architecture is **1 orchestrator + 3 stateless sub-agents + 3 brand-knowledge skills + helper scripts + a SQLite cross-session brand registry**, glued by a single slash command. Sub-agents return JSON envelopes; the orchestrator owns all human-approval gates and the single `session_state.json`. RTL Hebrew is solved by splitting image generation (no text — gpt-image) from text composition (Canva native, RTL-aware). The SQLite layer (see [[sqlite-brand-registry]]) gives the system long-term brand memory across clients — perceptual palette similarity (CIE LAB ΔE76) and headline duplicate detection (Jaccard) — wired into the agents in Phase C5.

## Open Questions
- D2 — Does Canva `upload-asset-from-url` accept `file://` URIs, or do we need a local HTTP server fallback?
- D3 — Custom dimensions in Canva: prefer `generate-design-structured` first, with `resize-design` as fallback?
- D4 — Generic background-color filter (sky/ocean blue) — accept in v1 with user gate, or build filter?
- D5 — OpenAI cost guardrail — soft-prompt at 30 calls per session?

## Session Log

### 2026-05-08 — Vault initialization [shipped]
- **What was done:** Created the project documentation vault — `vault/Meeting Notes/` and `vault/Brand Guidelines/` with `_index.md` in each. One topic file per project artifact (agents, scripts, commands, configs, skills).
- **Decisions:** One file per artifact rather than grouped by domain — keeps each topic small and discoverable. Brand-related skills live in Brand Guidelines (they ARE the project's brand voice); code-side skills (Obsidian) live in Meeting Notes as reference.
- **Notes / Caveats:** Vault was empty before this session. No prior topic files to merge with. All entries are `[shipped]` because the underlying code artifacts are already on `main`.
- **Related:** [[claude-md]], [[banner-orchestrator-agent]], [[brand-researcher-agent]], [[copywriter-agent]], [[canva-designer-agent]], [[banner-create-command]], [[openai-image-script]], [[resize-script]], [[marketing-thinking-skill]], [[hospitality-copywriting-skill]], [[visual-design-principles-skill]]

### 2026-05-20 — Phase A: SQLite brand registry layer added [shipped]
- **What was done:** Extended the system with a cross-session brand memory layer (see [[sqlite-brand-registry]]). Overview updated to name the new layer explicitly. Two new scripts (`brand_db.js`, `migrate_existing_sessions.js`) and `.claude/settings.json` landed in commit `dbf56c5`. The agents themselves are untouched in Phase A — wiring is in Phase C5.
- **Decisions:** Treat the SQLite registry as a peer architectural component, not "just another helper script". Reasoning: it crosses session boundaries, the agents will query it, and it changes how brand consistency is enforced. Documenting it at the architecture level (not only as a script doc) makes that role visible.
- **Notes / Caveats:** This is the first ship in the 4-phase quality upgrade plan ([[../plans/eager-mixing-mountain]] external). Open Questions D2–D5 in this file pre-date the upgrade and are still open.
- **Related:** [[sqlite-brand-registry]], [[claude-settings]], [[env-example]]

### 2026-05-20 — Phase B3+B4: rembg + Real-ESRGAN pipeline added [shipped]
- **What was done:** Added two local image-enhancement scripts (see [[image-enhancement-scripts]]) — `scripts/remove_bg.js` (rembg) and `scripts/upscale.js` (Real-ESRGAN). Both run locally with no API keys; both verified end-to-end against the spa-ben-ami logo. Commit `75a09ca`. The brand-researcher and canva-designer agents will start calling these in Phase B6 / B7.
- **Decisions:** Canonical pipeline order is rembg FIRST, upscale SECOND. Reversing the order erases the subject (Real-ESRGAN's smoothing confuses rembg's segmentation — verified at 92.4% over-removal on the spa logo). Locked this in the wrapper script headers and the topic doc so future maintainers see it before they get burned.
- **Notes / Caveats:** Real-ESRGAN binary lives in `tools/realesrgan/` (now gitignored — added in this commit). rembg uses a `python -c` invocation because Python 3.14 dropped support for `python -m rembg`; we'll be able to simplify if rembg ever adds a `__main__`. Replicate / Unsplash / Figma MCPs (the rest of Phase B) are blocked on user tokens.
- **Related:** [[image-enhancement-scripts]], [[brand-researcher-agent]], [[canva-designer-agent]]
