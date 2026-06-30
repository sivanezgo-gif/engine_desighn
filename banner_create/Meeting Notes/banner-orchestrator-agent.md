# banner-orchestrator agent

## Overview
Main agent at `.claude/agents/banner-orchestrator.md`. Owns the full banner-generation workflow: session init (slug + timestamp folder), resume detection, dispatch to 3 sub-agents via the Task tool, all human-approval gates via `AskUserQuestion` — now with **visual previews** (C3) on every gate where the final look is decided: brand (Gate 1 — logo + palette swatches), cleaned logo (2A), headline mocks (3, via [[render-headline-mock-script]]), backgrounds (4b), variants (4d) — and a new **final variant-selection gate** (4d, C2) — single-writer of `session_state.json`, abort/cleanup protocol, and final delivery summary. It also drives the cross-session brand registry (C4): seeds it at init and records palette / headline / assets at each gate, surfacing palette-reuse + duplicate-headline warnings (see [[sqlite-brand-registry]]). Tools: `Bash, Read, Write, Edit, Glob, Grep, Task, AskUserQuestion`. Model: sonnet.

## Open Questions
- Resume protocol's UX — start-new vs resume vs abort-old: currently 3-option AskUserQuestion; may need fourth option (delete old folder).

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The agent itself was authored during the initial implementation phase.
- **Decisions:** Orchestrator is the **only** writer to `session_state.json`; sub-agents return `state_patch` in their envelope, orchestrator merges. This avoids race conditions and keeps the state model simple.
- **Notes / Caveats:** Sub-agents are stateless — every Task call passes `session_dir` so they can read prior artifacts. Backtrack table (PRD §7) governs how `last_completed_step` rewinds when a user clicks "back" on a gate.
- **Related:** [[architecture-overview]], [[brand-researcher-agent]], [[copywriter-agent]], [[canva-designer-agent]], [[banner-create-command]], [[claude-md]]

### 2026-06-04 — C1+C4: validation surfacing + registry wiring [shipped]
- **What was done:** (C4) Phase 0 seeds the registry (`init` + `insert-client` + `insert-session active`); Gate 1 surfaces the `similar_clients` palette warning and records `business_type` + palette; Gate 3 runs `find-duplicate-headline` on the 3 candidates and marks `duplicate_risk`, then `insert-headline` on finalize; Gate 4c records assets + `finish-session completed`; abort → `finish-session aborted`. `session_state` gained `similar_clients` + `validation_results`. (C1) Gate 4c surfaces the soft `validation` warnings returned by canva-designer.
- **Decisions:** The duplicate-headline lookup lives here (not in copywriter) so copywriter stays a pure `Read,Write` agent; warnings surface exactly at the gates where the user chooses. All registry reads tolerate an empty DB.
- **Related:** [[sqlite-brand-registry]], [[validate-export-script]], [[brand-researcher-agent]], [[copywriter-agent]]

### 2026-06-04 — C2+C3: variant gate + visual previews [shipped]
- **What was done:** (C2) Split Phase 4c into **4c compose** (canva-designer returns 3 banner variants + header) and a new **Gate 4d** where the user picks the final variant; the chosen file is copied to `final/banner_310x600.png` (via `node -e fs.copyFileSync`) and recorded. `session_state` gained `variants_generated` + `chosen_variant`; backtrack table, Phase-4 header, and final summary updated for 4d. (C3) Added image `preview`s to the gates where a visual exists — logo (2A local / 2B thumbnail URLs), background (4b local PNGs), variant (4d). Directions (4a) shows palette swatches; headline (3) stays textual.
- **Decisions:** Prefer http `thumbnail_url`s in previews (render most reliably); fall back to absolute file paths, with graceful degradation if the client doesn't render images inline. The variant copy uses `node -e fs.copyFileSync` (allowlisted, cross-platform) rather than `cp`.
- **Notes / Caveats:** Whether AskUserQuestion `preview` renders local PNGs inline is environment-dependent — **unverified live**; the path/URL always shows as a fallback. Confirm in the next end-to-end run.
- **Related:** [[canva-designer-agent]], [[validate-export-script]], [[sqlite-brand-registry]]

### 2026-06-09 — Extend visual previews to brand / logo / headline gates [shipped]
- **What was done:** Closed the gaps left by C3 (which had said "headline stays textual; directions stays swatches"). **Gate 1** now attaches a `preview` to the approve option — the found logo (`brand_profile.logo.local_path`) plus palette colour-swatch lines. **Gate 2A** preview now shows the **cleaned** logo (`artifacts.logo_path`, the post-rembg/upscale working file) instead of the raw `source.png`; brand-researcher Branch A return was changed to put the actual working file in `logo_path` (was hardcoded to `source.png`). **Gate 3** now renders each candidate headline as an image mock via the new [[render-headline-mock-script]] and attaches it as the option `preview`. Phase 0 scaffold gained `copy_mocks/`. CLAUDE.md scripts list + the Phase-2 C3 convention note updated to list all preview-bearing gates (1, 2A, 3, 4b, 4d).
- **Decisions:** Chose the **low-risk path** for the "clean logo thumbnail" — surface the local cleaned file that brand-researcher already produces, rather than wiring `asset-forge` into the flow or round-tripping Canva `get-design-thumbnail`. `asset-forge` remains dormant/unwired; proper wiring is a separate follow-up. Gate 4a stays palette-swatch only (no image exists pre-generation).
- **Notes / Caveats:** Headline mock rendering uses sharp's Pango text engine (RTL-aware, no SVG) — verified live rendering Hebrew correctly on this Windows machine (sharp 0.34.5 / vips 8.17.3, font Arial). Mock includes a WCAG contrast guard that flips text to black/white when the brand colour barely contrasts with the background. Inline-`preview` rendering in AskUserQuestion still unverified end-to-end.
- **Related:** [[render-headline-mock-script]], [[brand-researcher-agent]], [[asset-forge-agent]], [[copywriter-agent]]

### 2026-06-30 — wire logo_local_path → canva-designer (Nano Banana --ref) [shipped]
- **What was done:** With Nano Banana full-design mode now the default engine, the orchestrator passes the cleaned logo to canva-designer as a reference image. Added `logo_local_path` to the `session_state.canva_assets` shape; Phase 2 step 3 now stores it from the logo envelope's `artifacts.logo_path` (the post-rembg/upscale PNG); Phase 4b (now "Design Generation") passes `design_mode:"full"` + `logo_local_path` to canva-designer, which feeds it as `--ref` so Nano Banana places the real logo in the design. The 4b cost-guard prompt now names Nano Banana Pro.
- **Decisions:** Reused the existing `artifacts.logo_path` (already produced by brand-researcher logo mode) rather than wiring asset-forge in — same low-risk choice as the 2026-06-09 preview work. `logo_local_path` is null when the logo is skipped; canva-designer omits the logo `--ref` then. The soft-cap counter stays `openai_call_count` (generic; rename tracked in TODO).
- **Notes / Caveats:** Not yet verified in a full interactive `/banner-create` run (tracked in TODO D4). The image engine + resize were verified live standalone 2026-06-30.
- **Related:** [[canva-designer-agent]], [[gemini-image-script]], [[brand-researcher-agent]], [[asset-forge-agent]]
