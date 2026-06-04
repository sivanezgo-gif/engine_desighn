# Claude Settings (.claude/settings.json)

## Overview
Project-level Claude Code settings. Currently holds two sections:

- **`permissions.allow`** — explicit allowlist for every Bash command the agents and orchestrator legitimately need (every `scripts/*.js`, the realesrgan-ncnn-vulkan binary, `npm install`, common read-only git/ls/mkdir). Reduces permission prompts to near zero during normal `/banner-create` runs without surrendering the safety net for arbitrary commands.
- **`hooks`** — three events registered: a **`Stop`** hook and a **`SessionEnd`** hook (A4, 2026-05-20), both running `node scripts/sync_vault.js` to mirror the worktree `vault/` into the main repo vault Obsidian opens and auto-commit vault changes (full mechanism in [[vault-sync-hook]]); and a **`PostToolUse`** hook (matcher `export-design`, C1 2026-06-04) running `node scripts/validate_export.js --hook` as a metadata-free safety net after every Canva export (see [[validate-export-script]]).

The user-level `.claude/settings.local.json` (gitignored) holds personal overrides — do not touch. **MCP servers are configured in a separate `.mcp.json` at the repo root, not here** (Figma registered there — see [[figma-mcp]]).

## Open Questions
- ~~Should we pre-register MCP servers (Replicate / Unsplash / Figma) here, or use a separate `.mcp.json`?~~ **Resolved (2026-05-25):** project MCP servers live in `.mcp.json` at the repo root (Figma registered there — see [[figma-mcp]]). `settings.json` does *not* define them, and we deliberately avoid `enabledMcpjsonServers` so the user keeps the manual approval gate for `npx`-launched servers.
- The realesrgan-ncnn-vulkan binary path is allowlisted by bare name — depends on PATH being set. May need to switch to an absolute-path pattern once installed.

## Session Log

### 2026-05-20 — Created with permissions allowlist [shipped]
- **What was done:** Initial creation alongside the SQLite brand registry. Listed every current and planned `scripts/*.js`, the `realesrgan-ncnn-vulkan` binary, `python scripts/remove_bg.py`, `npm install`/`npm run`, and a handful of read-only utilities (ls, mkdir, git status/log/diff). `hooks: {}` left empty pending Phase C2.
- **Decisions:** Whitelist by exact-script + `:*` arg pattern rather than `node *` blanket. Reasoning: keeps the prompt surface tight; an accidental `node -e "fs.rmSync('/')"` still triggers permission. The cost is one allowlist entry per script — cheap and self-documenting.
- **Notes / Caveats:** No hooks registered yet. The "MCP servers in settings.json vs .mcp.json" question is still open — picking one in Phase B.
- **Related:** [[sqlite-brand-registry]], [[brand-researcher-agent]], [[canva-designer-agent]]

### 2026-05-20 — A4: Stop + SessionEnd hooks for Obsidian sync [shipped]
- **What was done:** Filled the previously-empty `hooks` object with two events — `Stop` (runs `node scripts/sync_vault.js --trigger stop` after every turn) and `SessionEnd` (`--trigger session-end`, a final flush). Added `Bash(node scripts/sync_vault.js:*)` to `permissions.allow` for manual runs. The hooks keep the user's Obsidian vault current with worktree edits; full mechanism in [[vault-sync-hook]].
- **Decisions:** Registered **both** events per the user's request — `Stop` gives live updates, `SessionEnd` guarantees a final sync. Used the relative `node scripts/sync_vault.js` (hooks run with cwd = project root, so no `$CLAUDE_PROJECT_DIR` needed — keeps it cross-platform on Windows).
- **Notes / Caveats:** Hooks edited mid-session may only activate after a Claude Code restart; verified the script independently by running it manually. The script always exits 0, so a sync failure can never block the conversation. The Phase C2 `PostToolUse` validation hook is still pending.
- **Related:** [[vault-sync-hook]], [[architecture-overview]], [[sqlite-brand-registry]]

### 2026-06-04 — C1: PostToolUse validation hook [shipped]
- **What was done:** Registered the third hook event — `PostToolUse` with matcher `export-design` → `node scripts/validate_export.js --hook`. `validate_export.js` was already in the allowlist (added during Phase A planning), so no permissions change was needed.
- **Decisions:** Matcher is the bare substring `export-design` (regex), not the full `mcp__<uuid>__export-design`, so the hook keeps matching if the Canva connector's server id changes. The hook is a metadata-free safety net (dimensions + blank only); the rich contrast / logo / legibility checks run in the `canva-designer` compose step where the text colour + placement are known.
- **Notes / Caveats:** The hook script always exits 0 on an internal error (exit 2 only on a genuine hard failure), so it can't break the conversation. Live behaviour against a real Canva export still to be confirmed end-to-end (Canva MCP was offline during the build).
- **Related:** [[validate-export-script]], [[canva-designer-agent]], [[vault-sync-hook]]
