# Meeting Notes — Index

Technical documentation for every code, agent, command, script, and config file in the project. One topic file per project artifact, plus the architectural overview.

## Topics

### Architecture
- [[architecture-overview]] — high-level system map: orchestrator + 3 sub-agents + 3 skills + 2 scripts

### Root configuration
- [[claude-md]] — project-level Claude Code instructions (CLAUDE.md)
- [[gitignore-config]] — .gitignore rules (secrets, output, deps)
- [[env-example]] — environment variable template (.env.example)

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

### Built-in skill docs (`.claude/skills/obsidian-*`)
- [[obsidian-markdown-skill]] — Obsidian Flavored Markdown reference
- [[obsidian-bases-skill]] — Obsidian Bases (.base files) reference
- [[obsidian-vault-workflow-skill]] — vault read/write protocol (this protocol)
