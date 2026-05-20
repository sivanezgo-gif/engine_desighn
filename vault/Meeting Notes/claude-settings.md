# Claude Settings (.claude/settings.json)

## Overview
Project-level Claude Code settings. Currently holds two sections:

- **`permissions.allow`** — explicit allowlist for every Bash command the agents and orchestrator legitimately need (every `scripts/*.js`, the realesrgan-ncnn-vulkan binary, `npm install`, common read-only git/ls/mkdir). Reduces permission prompts to near zero during normal `/banner-create` runs without surrendering the safety net for arbitrary commands.
- **`hooks`** — empty by design. Phase C2 will register a `PostToolUse` hook against the Canva `export-design` MCP tool to run [[validate-export-script]] automatically.

The user-level `.claude/settings.local.json` (gitignored) holds personal overrides — do not touch.

## Open Questions
- Should we also pre-register MCP servers (Replicate / Unsplash / Figma) here, or use a separate `.mcp.json`? Deferred until Phase B.
- The realesrgan-ncnn-vulkan binary path is allowlisted by bare name — depends on PATH being set. May need to switch to an absolute-path pattern once installed.

## Session Log

### 2026-05-20 — Created with permissions allowlist [shipped]
- **What was done:** Initial creation alongside the SQLite brand registry. Listed every current and planned `scripts/*.js`, the `realesrgan-ncnn-vulkan` binary, `python scripts/remove_bg.py`, `npm install`/`npm run`, and a handful of read-only utilities (ls, mkdir, git status/log/diff). `hooks: {}` left empty pending Phase C2.
- **Decisions:** Whitelist by exact-script + `:*` arg pattern rather than `node *` blanket. Reasoning: keeps the prompt surface tight; an accidental `node -e "fs.rmSync('/')"` still triggers permission. The cost is one allowlist entry per script — cheap and self-documenting.
- **Notes / Caveats:** No hooks registered yet. The "MCP servers in settings.json vs .mcp.json" question is still open — picking one in Phase B.
- **Related:** [[sqlite-brand-registry]], [[brand-researcher-agent]], [[canva-designer-agent]]
