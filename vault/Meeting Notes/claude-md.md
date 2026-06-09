# CLAUDE.md (project root)

## Overview
Project-level instructions file at the repo root — the first file Claude Code reads when working in this codebase. Describes the system's purpose ("מערכת מיתוג ללקוחות לעיצובים גרפיים עבור מנוע הזמנות אונליין"), **documents the actual stack** (the system is a Claude Code multi-agent automation, not a web app: Node 22 + sharp + built-in `node:sqlite`; Canva + Figma MCP; OpenAI gpt-image / Replicate; rembg + Real-ESRGAN), the integrations, the `.claude/{agents,skills,commands}/` structure, and a pointer to the Obsidian vault. Hebrew with English code/path tokens.

## Open Questions
- ~~Stack TBD~~ **Resolved (2026-06-04, D3):** filled with the actual agent-system stack. A *customer-facing web app* (frontend/backend/auth/storage) — if ever built — remains TBD; there are still no formal build/test/lint commands (scripts run directly).

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file as part of the initial vault build.
- **Decisions:** This file is the canonical entry point for any new Claude Code session — agents and slash commands extend its scope but do not replace it.
- **Notes / Caveats:** Currently has a TBD section (tech stack); when filled in, the orchestrator and other agents may need updates.
- **Related:** [[architecture-overview]], [[banner-orchestrator-agent]], [[banner-create-command]]

### 2026-06-04 — D3: filled the stack + integrations [shipped]
- **What was done:** Replaced the TBD stack blockquote with the real stack (Node 22 / sharp / `node:sqlite` / Python; gpt-image + Replicate; rembg + Real-ESRGAN; Canva + Figma MCP), expanded the integrations list, updated the `.claude/` structure examples to the actual agents / skills / commands, and added an Obsidian-vault pointer section.
- **Decisions:** Framed the system honestly as a **Claude Code multi-agent automation, not a web app** — the original frontend/backend/auth TBD belonged to a customer-facing app that was never the thing built. That app stays TBD.
- **Related:** [[architecture-overview]], [[canva-designer-agent]], [[sqlite-brand-registry]]
