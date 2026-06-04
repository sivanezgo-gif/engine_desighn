# canva-designer agent

## Overview
Sub-agent 3 at `.claude/agents/canva-designer.md`. Four phases: `directions` (3 visual directions, no API calls — pure LLM); `backgrounds` (3 image pairs of banner 1024×1984 + header 2304×800, with the mandatory central-third sentence for header prompts; the per-direction `image_model` field selects the generator — `gpt-image` via `scripts/openai_image.js` by default, or `flux`/`recraft`/`ideogram` via `scripts/replicate_image.js` once the Replicate token lands, falling back to gpt-image meanwhile); `compose` (sharp resize via `scripts/resize.js` → Canva upload → editing transactions → export → validate via `scripts/validate_export.js`, see [[validate-export-script]]); `abort` (cancels open Canva editing transactions). Stateless. Reads [[visual-design-principles-skill]] and [[marketing-thinking-skill]] before each phase. Tools: 10 Canva MCP tools + `Read, Write, Bash`.

## Open Questions
- D2 — local file upload to Canva (see [[brand-researcher-agent]]).
- D3 — `generate-design-structured` for custom 310×600 / 1366×200 dimensions, with `resize-design` as fallback.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Agent and skill wiring were authored previously.
- **Decisions:** RTL strategy = gpt-image generates **pure imagery, no text**; Canva native composition adds Hebrew text on top (`perform-editing-operations`). This avoids the v2.0 PRD's placeholder/find-and-replace hack.
- **Notes / Caveats:** Header prompt must contain the exact "central horizontal third" sentence — `resize.js` crops top:137 from the 1366×474 intermediate, anything in outer thirds is lost. Quality gates §7 of [[visual-design-principles-skill]] must pass before returning `status:"ok"` from `compose`.
- **Related:** [[banner-orchestrator-agent]], [[visual-design-principles-skill]], [[marketing-thinking-skill]], [[openai-image-script]], [[resize-script]], [[copywriter-agent]]

### 2026-05-25 — B7: image_model multi-model selection [shipped]
- **What was done:** Added the `image_model` field (`gpt-image` | `flux` | `recraft` | `ideogram`) to each direction — in the directions schema, the directions return envelope, and the `selected_direction` input contract. Phase backgrounds now routes by `image_model`: `gpt-image` → `openai_image.js` (unchanged); the other three → `replicate_image.js` (Phase B1, not yet built).
- **Decisions:** **Mandatory gpt-image fallback.** Until the Replicate token + `replicate_image.js` exist, the directions phase always emits `gpt-image`, and backgrounds falls back to gpt-image (noting it in `summary`) if `replicate_image.js` is missing or `REPLICATE_API_TOKEN` is unset — the pipeline can never break over an unavailable model.
- **Notes / Caveats:** `replicate_image.js` will mirror `openai_image.js`'s `--prompt`/`--size`/`--out` interface, so routing is a one-line script swap. Logo upscale was *not* added here — it lives in [[brand-researcher-agent]] Branch A (corrected in Stage-2 review).
- **Related:** [[brand-researcher-agent]], [[image-enhancement-scripts]], [[openai-image-script]], [[banner-orchestrator-agent]]

### 2026-06-04 — C1: compose validation gate [shipped]
- **What was done:** `compose` Step 5e.1 now runs `scripts/validate_export.js` on each downloaded final (replacing the old inline `node -e` dimension check), passing the headline colour + approximate text/logo regions + `--large-text`. The return envelope gained a `validation` object (checks + warnings) so the orchestrator can surface soft issues at Gate 4c.
- **Decisions:** Hard failures (wrong dimensions / blank export) → `status:"fail"` (recompose). Soft failures (contrast / busy bg / logo size) → surfaced, not blocked. The rich checks live here because only this agent knows the text colour and placement; a PostToolUse hook on `export-design` is a metadata-free safety net only.
- **Related:** [[validate-export-script]], [[banner-orchestrator-agent]]
