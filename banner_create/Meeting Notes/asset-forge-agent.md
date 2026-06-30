# asset-forge Agent

## Overview
Sole owner of logo/asset preparation. Takes a **raw** logo path (from [[brand-researcher-agent]] Branch A download or Branch B generation), runs the canonical `rembg → upscale → normalize` pipeline (EXIF disclosure stamp when `generated:true`), and uploads the clean PNG to Canva — returning `clean_logo_path` + `logo_asset_id`. Consolidates logo prep that previously would have leaked into both brand-researcher and canva-designer (scope-creep removal). Tools: `Read`, `Write`, `Bash` (`scripts/remove_bg.js`, `scripts/upscale.js`), `upload-asset-from-url`, `get-design-thumbnail`. Created in the 2026-05-25 architecture refactor.

## Open Questions
- `scripts/remove_bg.js` + `scripts/upscale.js` are referenced but **absent in the main working tree** — only `openai_image.js` + `resize.js` exist. They are documented in [[image-enhancement-scripts]] (commit `75a09ca`); need to be landed before this agent can run.
- rembg over-removal fallback (upload normalized raw instead) is specified but untested in this agent.

## Session Log

### 2026-05-25 — Created in architecture refactor [wip]
- **What was done:** Authored `.claude/agents/asset-forge.md`. Pipeline locked to **rembg FIRST, upscale SECOND** (reversing erases the subject — 92.4% over-removal, per [[image-enhancement-scripts]]). Steps: rembg → upscale → normalize (ensureAlpha, ≥200px) → EXIF (if generated) → Canva upload (via [[canva-mcp-operations-skill]] §1).
- **Decisions:** One owner for all logo prep. The orchestrator invokes it in Phase 2 **after** the user approves the logo choice at Gate 2A/2B; brand-researcher now returns only a `raw_logo_path` and no longer holds the `upload-asset-from-url` tool.
- **Notes / Caveats:** Blocked on D6 (missing scripts). Edge cases: missing scripts → skip+normalize+upload; over-removal → upload raw; low-res → flag.
- **Related:** [[architecture-overview]], [[brand-researcher-agent]], [[banner-orchestrator-agent]], [[image-enhancement-scripts]], [[canva-mcp-operations-skill]]
