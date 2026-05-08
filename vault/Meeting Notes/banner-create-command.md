# /banner-create slash command

## Overview
Slash command at `.claude/commands/banner-create.md`. Thin invoker — its only job is to dispatch to the [[banner-orchestrator-agent]] via the Task tool with payload `INPUT: {"business_name":"$1","url":"$2"}`. Usage: `/banner-create [business_name] [url]`. After the orchestrator completes, the command prints a Hebrew summary with PNG paths and Canva edit URLs. Allowed tools: `Task, Bash, Read, Write`.

## Open Questions
- Future entry points — `/abort`, `/resume` could share the same orchestrator pattern.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Command was authored in prior sessions.
- **Decisions:** Kept thin (~5 lines body) — all logic lives in the orchestrator. This makes it trivial to add programmatic entry points later that reuse the orchestrator.
- **Notes / Caveats:** The command's `argument-hint` shows `[business_name] [url]`, but `url` is optional — pass empty string if missing.
- **Related:** [[banner-orchestrator-agent]], [[architecture-overview]], [[claude-md]]
