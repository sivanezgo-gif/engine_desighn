# scripts/resize.js

## Overview
Node.js CLI that resizes/crops gpt-image outputs to final banner/header dimensions using `sharp`. Args: `--input`, `--kind banner|header`, `--output`. Banner: 1024×1984 → 310×600 via pure `fit:'fill'` resize (matching aspect ratios). Header: 2304×800 → resize width to 1366 (preserving aspect → 1366×474) → center-crop top:137, height:200 → final 1366×200. Asserts final dimensions via `sharp(output).metadata()` and exits non-zero on `DIM_MISMATCH`. Requires `npm install sharp`. Called by [[canva-designer-agent]] during `phase=compose`.

## Open Questions
- none

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Script itself was authored in prior sessions.
- **Decisions:** Crop-from-top:137 for header is fixed (mid-third of 474 → 200) — this is why the header gpt-image prompt **must** concentrate visual interest in the central horizontal third (see [[visual-design-principles-skill]] §4).
- **Notes / Caveats:** sharp metadata assertion is the last quality gate before Canva upload — never skip.
- **Related:** [[canva-designer-agent]], [[openai-image-script]], [[visual-design-principles-skill]]
