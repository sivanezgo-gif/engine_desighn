# banner-orchestrator agent

## Overview
Main agent at `.claude/agents/banner-orchestrator.md`. Owns the full banner-generation workflow: session init (slug + timestamp folder), resume detection, dispatch to 3 sub-agents via the Task tool, all human-approval gates via `AskUserQuestion` — now with **visual thumbnail previews** (C3) on the logo / background / variant gates and a new **final variant-selection gate** (4d, C2) — single-writer of `session_state.json`, abort/cleanup protocol, and final delivery summary. It also drives the cross-session brand registry (C4): seeds it at init and records palette / headline / assets at each gate, surfacing palette-reuse + duplicate-headline warnings (see [[sqlite-brand-registry]]). Tools: `Bash, Read, Write, Edit, Glob, Grep, Task, AskUserQuestion`. Model: sonnet.

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
