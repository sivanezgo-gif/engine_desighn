# Nano Banana D4 — first full-flow test (המושבה)

## Overview
First end-to-end run of the Nano Banana **full-design** pipeline, on client **"המושבה"** (boutique heritage hotel, Kfar Tavor). Driven from the **main thread** (the orchestrator can't run as a background sub-agent — see F1). Result: the flow **works** and produces studio-quality output — a `310×600` banner and `1366×200` header with **correct Hebrew, the logo, and a CTA baked in**, validated (`validate_export.js` pass). Session: `output/hamoshava-20260630-144128/`. See [[canva-designer-agent]], [[gemini-image-script]].

## Open Questions
- `settings.json` allow-rule for `gemini_image.js` still pending (user action; classifier blocks self-edit — re-confirmed 2026-07-02).
- Remaining D4 integration debt: fully automated `/banner-create` run (auto 3 variants in canva-designer + auto design-qa) not yet verified end-to-end.

## Session Log

### 2026-07-01 — D4 full-flow test on המושבה [shipped, flow verified]
- **What was done:** Ran the whole pipeline manually as the orchestrator: brand-researcher (profile → terracotta `#745239` / cream `#f4d5ba`, tone warm/pastoral/heritage, no logo on site) → **logo via Nano Banana** (circular heritage badge with «המושבה», one call) → copywriter (chose "משפחה שלמה, חופשה כפרית אחת") → direction a "Pastoral Golden Hour" → **full-design banner + header via `gemini_image.js`** (headline + logo `--ref` + CTA baked in) → `resize.js` (cover / center-crop) → `validate_export.js` = **pass**. Hebrew rendered perfectly in every asset.
- **Decisions / new brand rules (embedded in `canva-designer` full-design templates):** (1) **Banner** — a booking **CTA is mandatory** (e.g. הזמינו אונליין), rounded button near the bottom. (2) **Header** — brand name/headline goes on the **RIGHT**; keep the **LEFT third clear** (no text, no logo) because a logo is injected on the left downstream; header takes **no logo `--ref`**. (Both already implied by visual-design §9.6 Mode B; now wired into the prompt templates.) Also: **generate the logo with Nano Banana, not Canva** (F2).
- **Notes / Caveats (findings):** **F1** the orchestrator can't gate or nest sub-agents when itself dispatched as a background sub-agent — must be main-thread. **F2** brand-researcher Branch B created a Canva design (`DAHOIaxtJn8`) but couldn't export it (no `export-design`/`start-editing-transaction` in its toolset) — Canva logo path is broken; Nano Banana replaced it cleanly. **F3** `gemini_image.js` intermittently hits a libuv `UV_HANDLE_CLOSING` assertion on `process.exit(0)` *after* writing the file (output fine, exit code 127). Canva thumbnail URLs expire (~5h) — regenerate if a gate is revisited later.
- **Related:** [[canva-designer-agent]], [[banner-orchestrator-agent]], [[brand-researcher-agent]], [[gemini-image-script]], [[resize-script]], [[completed-client-hamoshava]]
