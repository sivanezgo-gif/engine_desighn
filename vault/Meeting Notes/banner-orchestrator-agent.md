# banner-orchestrator agent

## Overview
Main agent at `.claude/agents/banner-orchestrator.md`. Owns the full banner-generation workflow: session init (slug + timestamp folder), resume detection, dispatch to 3 sub-agents via the Task tool, all 6 human-approval gates via `AskUserQuestion`, single-writer of `session_state.json`, abort/cleanup protocol, and final delivery summary. It also drives the cross-session brand registry (C4): seeds it at init and records palette / headline / assets at each gate, surfacing palette-reuse + duplicate-headline warnings (see [[sqlite-brand-registry]]). Tools: `Bash, Read, Write, Edit, Glob, Grep, Task, AskUserQuestion`. Model: sonnet.

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
