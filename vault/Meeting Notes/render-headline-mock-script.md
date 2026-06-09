# scripts/render_headline_mock.js

## Overview
Node.js CLI that renders a candidate headline into a small preview strip (PNG) so the orchestrator can show each Gate-3 option as a **visual mock** — the line set in the brand colour on the brand background — instead of plain text. Args: `--text` (required), `--out` (required), `--primary` (default `#0A4C8B`), `--bg` (default `#FFFFFF`), `--width` (620), `--height` (200), `--font` (Arial). Renders via `sharp`'s built-in **Pango** text engine (RTL-aware automatically — no SVG, no foreign-character word rendering, consistent with the RTL invariant). Composites the text centred over a solid brand-colour background. Includes a **WCAG contrast guard**: if the brand colour barely contrasts with the background (ratio < 3:1) it flips the text to black or white, whichever reads better, so the mock stays legible. Emits a single JSON line `{ok:true,path,dimensions}` on stdout; `{ok:false,error}` + non-zero exit on failure. Requires `npm install sharp`. Called by [[banner-orchestrator-agent]] at Phase 3 step 2c.

## Open Questions
- Whether AskUserQuestion renders the mock PNG inline as a `preview` is environment-dependent — unverified end-to-end. The path always shows as a fallback.

## Session Log

### 2026-06-09 — Created for Gate-3 visual previews [shipped]
- **What was done:** Authored the script to back the new Gate-3 headline mocks. Verified live on this Windows machine (sharp 0.34.5 / vips 8.17.3): Hebrew RTL renders correctly with font Arial, and the contrast guard correctly flipped yellow-on-cream to dark text.
- **Decisions:** Use the Pango text path (not SVG) because it is RTL-aware out of the box and handles Hebrew font fallback reliably; render the brand background as a solid colour rather than pulling a real banner background (the mock is about the *copy*, kept cheap and dependency-free). Never block the gate on a render failure — orchestrator falls back to text.
- **Notes / Caveats:** sharp's text input rejects passing both `dpi` and `height`; this script uses `width`+`height` box-fit with `align:center`, no `dpi`.
- **Related:** [[banner-orchestrator-agent]], [[copywriter-agent]], [[resize-script]], [[image-enhancement-scripts]]
