# brand-researcher agent

## Overview
Sub-agent 1 at `.claude/agents/brand-researcher.md`. Two modes: `mode=profile` runs the website→Facebook→Instagram→manual-interview waterfall and writes `brand_profile.json` (extracts colors via colorthief, fonts, logo URL, language, tone); `mode=logo` resolves the logo via Branch A (download + convert + upload to Canva) or Branch B (generate 3 Canva candidates with EXIF disclosure). Branch A also runs local image enhancement before the Canva upload — `remove_bg.js` (rembg) to strip stray backgrounds, plus a conditional `upscale.js` ×2 for sub-200px logos (B6; see [[image-enhancement-scripts]]). Stateless. Returns JSON envelopes — never asks the user directly. Uses [[marketing-thinking-skill]] for vertical identification and gap analysis. Tools include `WebFetch`, `WebSearch`, `Bash`, and 4 Canva MCP tools.

## Open Questions
- D2 — Does `upload-asset-from-url` accept `file://`? If not, Branch A needs a local HTTP server fallback (`python3 -m http.server`).
- Q1 (PRD) — Generic background color filter: currently relies on user gate; may need a hardcoded filter list.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The agent and the marketing-thinking skill linkage were authored in prior sessions.
- **Decisions:** Profile + logo merged into a single dual-mode agent (rather than two agents) — both are research/extraction tasks with shared context (colors, business name).
- **Notes / Caveats:** Scraped HTML must be wrapped in `<UNTRUSTED_DATA>` tags before being interpolated into the LLM prompt — prompt-injection defense.
- **Related:** [[banner-orchestrator-agent]], [[marketing-thinking-skill]], [[architecture-overview]]

### 2026-05-25 — B6: logo enhancement in Branch A [shipped]
- **What was done:** mode=logo Branch A now runs `remove_bg.js` (rembg) after PNG conversion and before the Canva upload, then a conditional `upscale.js --scale 2` when the working logo's width < 200px. Branch B (generated logos) got a rembg safety-net for outputs that lack a real alpha channel. `brand_profile.json` gains `logo.cleaned` / `logo.upscaled` booleans.
- **Decisions:** rembg adopts the cleaned PNG only when `ok:true` and `warnings` is empty — otherwise the original is kept (a wrongly-erased logo is worse than an un-cleaned one). Both steps never block: any failure falls back to the prior file. Placement is here (not [[canva-designer-agent]]) because the local logo file exists only in Branch A *before* upload — canva-designer only ever sees `logo_asset_id`.
- **Notes / Caveats:** Both tools are token-free (local Python / native binary), so they run even from the worktree. Full pipeline rationale (rembg→upscale order) in [[image-enhancement-scripts]].
- **Related:** [[image-enhancement-scripts]], [[canva-designer-agent]], [[banner-orchestrator-agent]]
