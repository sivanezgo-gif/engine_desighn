# scripts/resize.js

## Overview
Node.js CLI that resizes/crops image outputs to final banner/header dimensions using `sharp`. Args: `--input`, `--kind banner|header`, `--output`. **Banner**: any portrait source → 310×600 via aspect-preserving `fit:'cover'` (crop, never stretch) — protects text/logos baked in by Nano Banana full-design mode. **Header**: any wide source → resize width to 1366 (preserve aspect) → center-crop a 1366×200 band, with the crop offset computed from the ACTUAL resized height so it self-centers for any source aspect. Asserts final dimensions via `sharp(output).metadata()` and exits non-zero on `DIM_MISMATCH`. Requires `npm install sharp`. Called by [[canva-designer-agent]] during `phase=compose`.

## Open Questions
- none

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Script itself was authored in prior sessions.
- **Decisions:** Crop-from-top:137 for header is fixed (mid-third of 474 → 200) — this is why the header gpt-image prompt **must** concentrate visual interest in the central horizontal third (see [[visual-design-principles-skill]] §4).
- **Notes / Caveats:** sharp metadata assertion is the last quality gate before Canva upload — never skip.
- **Related:** [[canva-designer-agent]], [[openai-image-script]], [[visual-design-principles-skill]]

### 2026-06-30 — cover-crop + dynamic header center for Nano Banana [shipped]
- **What was done:** Banner switched from `fit:'fill'` to `fit:'cover'` (aspect-preserving crop) so Nano Banana full-design output (Hebrew text + logo baked into the pixels) isn't stretched. The header crop offset is now derived from the actual resized height instead of the hardcoded `top:137`, self-centering for any source aspect (gpt-image 2304×800 → ~137; Nano Banana 21:9 → ~190).
- **Decisions:** `cover` is safe for both engines — the old near-square gpt-image ratio loses ~nothing; a 9:16 Nano Banana source gets a small symmetric crop instead of a vertical squish. Header reads the real intermediate height (buffer round-trip) to avoid a 1px extract overflow; falls back to a straight cover-crop if the source is too wide to yield a 200px band.
- **Notes / Caveats:** Verified live 2026-06-30 on real Nano Banana output — banner `חוף הזהב` (768×1376 → 310×600) and header `חוף הזהב` (1584×672 → 1366×200), Hebrew intact in both.
- **Related:** [[canva-designer-agent]], [[gemini-image-script]], [[visual-design-principles-skill]]
