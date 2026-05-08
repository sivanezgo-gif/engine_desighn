# banner-orchestrator agent

## Overview
Main agent at `.claude/agents/banner-orchestrator.md`. Owns the full banner-generation workflow: session init (slug + timestamp folder), resume detection, dispatch to 3 sub-agents via the Task tool, all 6 human-approval gates via `AskUserQuestion`, single-writer of `session_state.json`, abort/cleanup protocol, and final delivery summary. Tools: `Bash, Read, Write, Edit, Glob, Grep, Task, AskUserQuestion`. Model: sonnet.

## Open Questions
- Resume protocol's UX — start-new vs resume vs abort-old: currently 3-option AskUserQuestion; may need fourth option (delete old folder).

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The agent itself was authored during the initial implementation phase.
- **Decisions:** Orchestrator is the **only** writer to `session_state.json`; sub-agents return `state_patch` in their envelope, orchestrator merges. This avoids race conditions and keeps the state model simple.
- **Notes / Caveats:** Sub-agents are stateless — every Task call passes `session_dir` so they can read prior artifacts. Backtrack table (PRD §7) governs how `last_completed_step` rewinds when a user clicks "back" on a gate.
- **Related:** [[architecture-overview]], [[brand-researcher-agent]], [[copywriter-agent]], [[canva-designer-agent]], [[banner-create-command]], [[claude-md]]
