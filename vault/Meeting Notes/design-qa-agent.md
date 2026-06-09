# design-qa Agent

## Overview
Independent quality auditor for the final EzGo banner+header, invoked by the orchestrator at the new **Gate 4d** (after `compose`). Read-only on Canva — it inspects the exported PNGs against `brand_profile.json` and the `visual-design-principles §7` quality gates (dimensions, palette adherence, WCAG AA contrast, RTL alignment, logo clear-space, small-size legibility) and returns a pass/fail envelope with specific defects. It is a **sub-agent rather than a skill** by design: a fresh context window gives unbiased judgment that the designer (biased toward "it's fine") cannot. Tools: `Read`, `Bash`, and read-only Canva MCP (`get-design`, `get-design-thumbnail`, `export-design`). Created in the 2026-05-25 architecture refactor.

## Open Questions
- Contrast is estimated from sampled luminance of the headline band vs background — is pixel-sampling accurate enough, or should we pull text color via `get-design-content`?
- Not yet run against a real finished session.

## Session Log

### 2026-05-25 — Created in architecture refactor [wip]
- **What was done:** Authored `.claude/agents/design-qa.md`. Defined input/envelope contracts, a 7-check audit (A dimensions, B palette, C contrast, D RTL, E logo clear-space, F 50% legibility, G no baked-in text), and a severity model (blocking → `fail`, minor → `options`, none → `ok`).
- **Decisions:** Sub-agent not skill (fresh, unbiased context). Strictly read-only on Canva — never opens an editing transaction. Combines quantitative (sharp/node) with qualitative (reads the PNG as an image, being multimodal).
- **Notes / Caveats:** Wired into [[banner-orchestrator-agent]] as Gate 4d. Untested live.
- **Related:** [[architecture-overview]], [[banner-orchestrator-agent]], [[visual-design-principles-skill]], [[canva-mcp-operations-skill]]
