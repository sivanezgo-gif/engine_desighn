# format-multiplier Agent

## Overview
Optional **Phase 5** fan-out agent. After the user approves the banner+header (Gate 4c/4d), it produces the rest of the EzGo asset set — social square `1080×1080`, story `1080×1920`, coupon `800×400`, product card `600×400` — by **reusing** the already-uploaded background, logo, headline, and palette (no new OpenAI calls, no re-upload). This is the bridge from "single banner+header" to the full branded set named in `CLAUDE.md`. RTL strategy is unchanged: backgrounds carry no text; Canva native composition adds Hebrew on top. Tools: the full Canva editing set (`resize-design`, `generate-design-structured`, transaction lifecycle, `export-design`, `get-design`) + `Read`/`Write`/`Bash`. Created in the 2026-05-25 architecture refactor.

## Open Questions
- Format registry (4 entries) is a v1 guess — confirm which formats EzGo actually consumes.
- Re-crop strategy (tall banner bg → wide coupon) is specified but untested; may need per-format background variants.

## Session Log

### 2026-05-25 — Created in architecture refactor [wip]
- **What was done:** Authored `.claude/agents/format-multiplier.md`. Defined a format registry (dimensions + logo/text/bg-source per format), a per-format procedure (create → compose reusing assets → export+assert), and partial-success semantics (`ok` if ≥1 format succeeds).
- **Decisions:** Reuse assets, never regenerate — keeps the set visually consistent and avoids OpenAI cost. Gated behind an optional Phase 5 prompt so the base flow stays a banner+header.
- **Notes / Caveats:** Wired into [[banner-orchestrator-agent]] as Phase 5. Untested live.
- **Related:** [[architecture-overview]], [[banner-orchestrator-agent]], [[canva-mcp-operations-skill]], [[visual-design-principles-skill]]
