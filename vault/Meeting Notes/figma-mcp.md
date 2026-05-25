# Figma MCP Server (.mcp.json)

## Overview
Registers the **Framelink Figma MCP** server (`figma-developer-mcp`, launched via `npx -y figma-developer-mcp --stdio`) so the agents can read Figma files — published color styles, text styles, and node data — using a Figma Personal Access Token. Declared in `.mcp.json` at the repo root (B5, 2026-05-25). The server reads its token from the `FIGMA_API_KEY` env var, which `.mcp.json` maps from `${FIGMA_TOKEN}` (the variable the user stores). Project MCP servers in this repo live in `.mcp.json` (NOT in `.claude/settings.json`) — this resolves the long-standing "settings.json vs .mcp.json" question noted in [[claude-settings]].

**Status:** registered, **not yet activated**. Activation needs (1) `FIGMA_TOKEN` as a *real* environment variable and (2) a Claude Code restart, at which point Claude Code prompts to approve the new project MCP server. Not yet verified live; no per-vertical design-system Figma file exists yet, so the `brand-researcher` opt-in hook is dormant.

## Open Questions
- **Token delivery to the MCP.** `.mcp.json` expands `${FIGMA_TOKEN}` from the *real* environment, not from the project `.env` (MCP servers don't read `.env`). On Windows the user runs `setx FIGMA_TOKEN "..."` then restarts. If `${...}` expansion turns out unsupported in the installed Claude Code build, fall back to the gitignored `.claude/settings.local.json` `env` block, or pass `--figma-api-key=...` directly (avoid — would risk committing the secret).
- **Auto-enable vs manual approval.** We deliberately do **not** set `enabledMcpjsonServers: ["figma"]`. The auto-mode guard (correctly) treats auto-enabling an `npx`-launched server as widening permissions past the user's approval gate, and blocked the edit. The user approves the server manually on first restart. Revisit only if the friction proves annoying.
- **Tool wiring + design-system file.** The exact Figma MCP tool names aren't pinned until the server runs, so the `brand-researcher` `tools:` frontmatter and concrete calls are finalized post-verification. A dedicated per-vertical design-system Figma file (palettes / typography / components) is the real unlock — TBD.

## Session Log

### 2026-05-25 — B5: Figma MCP registered [registered, not activated]
- **What was done:** Created `.mcp.json` declaring the `figma` server (`npx -y figma-developer-mcp --stdio`, `env.FIGMA_API_KEY = ${FIGMA_TOKEN}`). Added an opt-in, dormant Figma-reference block + a `figma_reference_file_key` payload field to `brand-researcher` mode=profile. Token placeholders (`FIGMA_TOKEN`, `REPLICATE_API_TOKEN`, `UNSPLASH_ACCESS_KEY`) were added to `.env.example` in the prior commit (`608421b`).
- **Decisions:**
  - **MCP servers live in `.mcp.json`, not `settings.json`.** Resolves the open question from [[claude-settings]]: project-scoped server definitions belong in `.mcp.json`; `settings.json` would only reference/enable them.
  - **No `enabledMcpjsonServers` auto-enable.** The auto-mode classifier blocked auto-enabling the `npx`-launched server as a permission-widening self-modification — the correct security posture. Manual approval on restart is the path.
  - **Framelink `figma-developer-mcp`** chosen because it authenticates with a Personal Access Token (matches the user's already-issued token), unlike Figma's official Dev-Mode server which talks to a running desktop app and uses no PAT.
  - **Opt-in + dormant `brand-researcher` hook.** The Figma-anchor step runs only when a `figma_reference_file_key` is supplied (the orchestrator doesn't yet), so the profile waterfall is unchanged and nothing breaks pre-activation.
- **Notes / Caveats:** Not verified live (needs the restart + approval). `${FIGMA_TOKEN}` must be a real env var — `.env` alone won't feed the MCP. Replicate (B1) + Unsplash (B2) MCPs remain token-blocked and unregistered.
- **Related:** [[claude-settings]], [[brand-researcher-agent]], [[architecture-overview]], [[vault-sync-hook]]
