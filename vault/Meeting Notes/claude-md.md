# CLAUDE.md (project root)

## Overview
Project-level instructions file at the repo root — the first file Claude Code reads when working in this codebase. Describes the system's purpose ("מערכת מיתוג ללקוחות לעיצובים גרפיים עבור מנוע הזמנות אונליין"), notes that the technical stack is TBD, documents the active Canva MCP integration, and lists the `.claude/{agents,skills,commands}/` structure. Hebrew with English code/path tokens.

## Open Questions
- Stack still TBD — when chosen, this file must be updated with build/test/lint commands.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file as part of the initial vault build.
- **Decisions:** This file is the canonical entry point for any new Claude Code session — agents and slash commands extend its scope but do not replace it.
- **Notes / Caveats:** Currently has a TBD section (tech stack); when filled in, the orchestrator and other agents may need updates.
- **Related:** [[architecture-overview]], [[banner-orchestrator-agent]], [[banner-create-command]]
