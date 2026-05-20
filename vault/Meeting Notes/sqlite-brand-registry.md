# SQLite Brand Registry

## Overview
A single SQLite file (`output/brands.db`, accessed via Node's built-in `node:sqlite`) is the cross-session brand memory for the EzGo banner generator. It stores clients, sessions, palettes (with perceptual color similarity via CIE LAB ΔE76), headlines (with Jaccard token similarity), and exported assets. Two scripts compose the layer: `scripts/brand_db.js` (10-subcommand CLI returning single-line JSON) and `scripts/migrate_existing_sessions.js` (idempotent importer for legacy `output/{session_id}/` folders). The orchestrator and sub-agents will query this registry in Phase C5 to warn about palette reuse across clients and detect duplicate headlines — raising overall brand consistency without manually maintaining a brand bible.

Status: foundation shipped 2026-05-20 (commit `dbf56c5`). Wiring into `brand-researcher` and `copywriter` agents is deferred to Phase C5.

## Open Questions
- ΔE76 threshold for "this palette is too similar to an existing client" — current default 10, may need vertical-specific tuning (spa vs marine vs adventure).
- Jaccard threshold for headline duplication — current default 0.7; needs real-world calibration once 5+ clients exist.
- Should `/banner-create` itself insert into `brand_db.js` at end of each successful session (live registration), eliminating the manual `migrate_existing_sessions.js` step entirely? Deferred to Phase C5.
- `output/brands.db` is gitignored — each dev has their own local registry. If the team ever wants shared brand intelligence, this becomes a Supabase/Postgres decision later.

## Session Log

### 2026-05-20 — Foundation: schema + CLI + migration [shipped]
- **What was done:** Built the SQLite layer end-to-end. `scripts/brand_db.js` exposes 10 CLI subcommands (`init`, `insert-client`, `insert-session`, `finish-session`, `insert-palette`, `insert-headline`, `insert-asset`, `find-similar-palette`, `find-duplicate-headline`, `get-client-history`, `list-clients`) and returns single-line JSON to stdout for easy piping. Color similarity uses true CIE LAB ΔE76 (sRGB → linear → XYZ D65 → LAB). Headline similarity uses Jaccard on whitespace-and-punctuation tokens (language-agnostic, works for Hebrew). `scripts/migrate_existing_sessions.js` reads `brand_profile.json` + `chosen_copy.json` + `session_state.json` from each session folder and imports idempotently. `.claude/settings.json` was created with permissions allowlist for all current and planned scripts; hooks section reserved for Phase C2 validation hook.
- **Decisions:**
  - Used `node:sqlite` (Node 22+ built-in) instead of `better-sqlite3`. Reasoning: zero native compilation, same synchronous API surface, available out of the box on Node 24.15. Trade-off: project now requires Node ≥22. Acceptable.
  - `palettes` table uses a `role` enum (primary / secondary / accent / background / text). Migration extracts all five from `brand_profile.colors` when present. Reasoning: comparing two "primary" colors is more meaningful than comparing across roles.
  - `find-similar-palette` returns matches sorted by ΔE ascending, with original `recorded_at` timestamp. The orchestrator decides threshold and how to present the warning — the script never gates.
  - Migration is idempotent: clients/sessions use `ON CONFLICT DO UPDATE`; palettes use composite `UNIQUE(client_slug, color_hex, role)`. Headlines and assets are insert-only (no dedup at DB level — query for duplicates instead).
- **Notes / Caveats:**
  - `output/brands.db` is gitignored (entire `output/` is). Migration script supports `--root <path>` for cross-checkout imports; used during testing to import the main repo's existing `spa-ben-ami-20260510-133633` session (5 palettes, 1 headline, 3 assets imported cleanly).
  - Verified: `find-similar-palette --hex "#EAD8D8"` returns the existing `#E9DEDE` at ΔE=3.04 (visually very close, as expected — pinkish-beige neighbors). `find-duplicate-headline` returns Jaccard 1.0 for exact match and 0.5 for "פנקי עצמך היום" vs "פנקי את עצמך" (3 of 5 unique tokens overlap).
  - `better-sqlite3` was initially in the plan; install failed locally for lack of Visual Studio Build Tools. Switched to `node:sqlite` mid-implementation — same API, zero deps.
- **Related:** [[architecture-overview]], [[env-example]], [[openai-image-script]], [[resize-script]], [[brand-researcher-agent]], [[copywriter-agent]]
