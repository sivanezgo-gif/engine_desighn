# Meeting Notes — Index

Technical documentation for every code, agent, command, script, and config file in the project. One topic file per project artifact, plus the architectural overview.

## Topics

### Completed clients
- [[completed-client-hamoshava]] — המושבה, session hamoshava-20260609-110009, completed 2026-06-10, v2_bold chosen

### Test runs & findings
- [[nano-banana-d4-test]] — first full-flow Nano Banana test (המושבה, 2026-07-01): flow works; findings F1 (orchestrator must be main-thread), F2 (logo→Nano Banana), F3 (libuv exit)
- [[project-health-audit]] — periodic whole-project review snapshots: git hygiene, config drift, doc accuracy, cleanup items

### Architecture
- [[architecture-overview]] — high-level system map: orchestrator + 3 sub-agents + 3 skills + scripts
- [[sqlite-brand-registry]] — cross-session brand memory: clients, palettes (ΔE76), headlines (Jaccard), assets

### Root configuration
- [[claude-md]] — project-level Claude Code instructions (CLAUDE.md)
- [[gitignore-config]] — .gitignore rules (secrets, output, deps)
- [[env-example]] — environment variable template (.env.example)
- [[claude-settings]] — `.claude/settings.json` permissions allowlist + Stop/SessionEnd vault-sync hooks
- [[figma-mcp]] — Figma MCP: official OAuth connector (live, verified 2026-06-04) + Framelink `.mcp.json` PAT fallback (dormant)

### Agents (`.claude/agents/`)
- [[banner-orchestrator-agent]] — main orchestrator, owns gates and session state
- [[brand-researcher-agent]] — Sub-1: brand profile + logo resolution
- [[copywriter-agent]] — Sub-2: 3-style headline generation
- [[canva-designer-agent]] — Sub-3: directions / backgrounds / compose / abort

### Slash commands (`.claude/commands/`)
- [[banner-create-command]] — `/banner-create [business_name] [url]` thin invoker

### Scripts (`scripts/`)
- [[openai-image-script]] — gpt-image-2 background generation CLI
- [[resize-script]] — sharp resize/crop to final banner/header dimensions
- [[render-headline-mock-script]] — sharp/Pango RTL headline mock for Gate-3 visual previews
- [[validate-export-script]] — C1 export quality gate (WCAG contrast / logo size / legibility / dimensions; CLI + PostToolUse hook)
- [[image-enhancement-scripts]] — rembg (background removal) + Real-ESRGAN (upscaling) pipeline for logos
- [[vault-sync-hook]] — Obsidian auto-sync: mirror worktree vault→main + auto-commit (Stop/SessionEnd hooks)

### Built-in skill docs (`.claude/skills/obsidian-*`)
- [[obsidian-markdown-skill]] — Obsidian Flavored Markdown reference
- [[obsidian-bases-skill]] — Obsidian Bases (.base files) reference
- [[obsidian-vault-workflow-skill]] — vault read/write protocol (this protocol)
