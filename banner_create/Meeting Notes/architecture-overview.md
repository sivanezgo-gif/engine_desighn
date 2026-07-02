# Architecture Overview

## Overview
EzGo banner generation system: a multi-agent Claude Code project that produces **3 final 310×600 banner variants + a 1366×200 header** per new hospitality venue. Architecture is **1 orchestrator + 6 stateless sub-agents (brand-researcher, asset-forge, copywriter, canva-designer, design-qa, format-multiplier) + 7 brand/design skills + helper scripts + a SQLite cross-session brand registry**, glued by a single slash command. Since F1 (2026-07-01) the orchestration protocol runs on the **main thread** (the `/banner-create` command follows `banner-orchestrator.md` as a playbook and dispatches only the workers as sub-agents). Sub-agents return JSON envelopes; the main thread owns all human-approval gates (with visual thumbnail previews) and the single `session_state.json`. RTL Hebrew has **two paths** controlled by `design_mode`: **full (default)** — Gemini "Nano Banana" renders the complete design *including* the Hebrew text, verified visually by `design-qa`; **background (fallback)** — text-free image + Canva native RTL composition.

The default image engine is **Gemini Nano Banana** ([[gemini-image-script]], model `gemini-3-pro-image-preview`) which composes full designs from reference images (logo + `examples/`); **gpt-image** ([[openai-image-script]]) remains a legacy background-only fallback, and Replicate (Flux / Recraft / Ideogram) stays token-blocked. Logos are generated via Nano Banana too (F2 — the Canva Branch-B path was broken) and auto-enhanced (rembg → conditional upscale, see [[image-enhancement-scripts]]). Every export passes an automated **quality gate** ([[validate-export-script]]: dimensions, blank, WCAG contrast, logo size, legibility) — both as an explicit compose step and as a PostToolUse safety-net hook. The **SQLite registry** ([[sqlite-brand-registry]]) gives long-term brand memory across clients — perceptual palette similarity (CIE LAB ΔE76) and headline duplicate detection (Jaccard) — wired **live** (C4): the orchestrator records each session and warns when a new venue's palette or headline is too close to an existing one. A registered **Figma MCP** (official OAuth connector; see [[figma-mcp]]) can anchor brand design-system data (dormant until a design-system file exists). Vault docs live in `banner_create/` and auto-sync to Obsidian via a Stop/SessionEnd hook ([[vault-sync-hook]]).

## Open Questions
- ~~D2 — Does Canva `upload-asset-from-url` accept `file://`?~~ Handled: agents fall back to a local `python3 -m http.server 8765` if `file://` is rejected.
- ~~D3 — Custom dimensions in Canva?~~ Resolved: `generate-design-structured` first, `resize-design` as fallback (canva-designer compose Step 5c).
- D4 — Generic background-color filter (sky/ocean blue) — currently handled by the brand-researcher `needs_user_confirmation` flag + user gate; a hardcoded filter list remains optional.
- ~~D5 — OpenAI cost guardrail?~~ Implemented: Phase 4b soft-prompt at 30 calls/session.
- **Live-verification debts:** the PostToolUse validation hook and AskUserQuestion image `preview` rendering are wired but **unverified end-to-end** (Canva MCP was offline during the build) — confirm on the next `/banner-create` run after a restart.

## Session Log

### 2026-05-08 — Vault initialization [shipped]
- **What was done:** Created the project documentation vault — `vault/Meeting Notes/` and `vault/Brand Guidelines/` with `_index.md` in each. One topic file per project artifact (agents, scripts, commands, configs, skills).
- **Decisions:** One file per artifact rather than grouped by domain — keeps each topic small and discoverable. Brand-related skills live in Brand Guidelines (they ARE the project's brand voice); code-side skills (Obsidian) live in Meeting Notes as reference.
- **Notes / Caveats:** Vault was empty before this session. No prior topic files to merge with. All entries are `[shipped]` because the underlying code artifacts are already on `main`.
- **Related:** [[claude-md]], [[banner-orchestrator-agent]], [[brand-researcher-agent]], [[copywriter-agent]], [[canva-designer-agent]], [[banner-create-command]], [[openai-image-script]], [[resize-script]], [[marketing-thinking-skill]], [[hospitality-copywriting-skill]], [[visual-design-principles-skill]]

### 2026-05-20 — Phase A: SQLite brand registry layer added [shipped]
- **What was done:** Extended the system with a cross-session brand memory layer (see [[sqlite-brand-registry]]). Overview updated to name the new layer explicitly. Two new scripts (`brand_db.js`, `migrate_existing_sessions.js`) and `.claude/settings.json` landed in commit `dbf56c5`. The agents themselves are untouched in Phase A — wiring is in Phase C5.
- **Decisions:** Treat the SQLite registry as a peer architectural component, not "just another helper script". Reasoning: it crosses session boundaries, the agents will query it, and it changes how brand consistency is enforced. Documenting it at the architecture level (not only as a script doc) makes that role visible.
- **Notes / Caveats:** This is the first ship in the 4-phase quality upgrade plan ([[../plans/eager-mixing-mountain]] external). Open Questions D2–D5 in this file pre-date the upgrade and are still open.
- **Related:** [[sqlite-brand-registry]], [[claude-settings]], [[env-example]]

### 2026-05-20 — Phase B3+B4: rembg + Real-ESRGAN pipeline added [shipped]
- **What was done:** Added two local image-enhancement scripts (see [[image-enhancement-scripts]]) — `scripts/remove_bg.js` (rembg) and `scripts/upscale.js` (Real-ESRGAN). Both run locally with no API keys; both verified end-to-end against the spa-ben-ami logo. Commit `75a09ca`. The brand-researcher and canva-designer agents will start calling these in Phase B6 / B7.
- **Decisions:** Canonical pipeline order is rembg FIRST, upscale SECOND. Reversing the order erases the subject (Real-ESRGAN's smoothing confuses rembg's segmentation — verified at 92.4% over-removal on the spa logo). Locked this in the wrapper script headers and the topic doc so future maintainers see it before they get burned.
- **Notes / Caveats:** Real-ESRGAN binary lives in `tools/realesrgan/` (now gitignored — added in this commit). rembg uses a `python -c` invocation because Python 3.14 dropped support for `python -m rembg`; we'll be able to simplify if rembg ever adds a `__main__`. Replicate / Unsplash / Figma MCPs (the rest of Phase B) are blocked on user tokens.
- **Related:** [[image-enhancement-scripts]], [[brand-researcher-agent]], [[canva-designer-agent]]

### 2026-05-25 — A4 + Phase B Stage 2 [shipped]
- **What was done:** Added the Obsidian auto-sync hook ([[vault-sync-hook]]; commits `de27d94`/`be903cb`). Wired image enhancement + the `image_model` multi-model field into the agents and added token placeholders to `.env.example` (`608421b`). Registered a Figma MCP server in `.mcp.json` with an opt-in brand-researcher hook (`5b6314a`).
- **Decisions:** Logo enhancement lives in `brand-researcher` Branch A (the local file exists only there, pre-upload), not canva-designer. MCP servers live in `.mcp.json`, not `settings.json`; no `enabledMcpjsonServers` (manual approval kept).
- **Notes / Caveats:** Replicate (B1) + Unsplash (B2) remain token-blocked. Figma was later verified live as the **official OAuth connector** (`8b96343`), not the Framelink server we registered — that stays a dormant PAT fallback.
- **Related:** [[vault-sync-hook]], [[figma-mcp]], [[image-enhancement-scripts]], [[canva-designer-agent]]

### 2026-06-04 — Phase C: quality & consistency systems [shipped]
- **What was done:** Four quality systems. **C1** export validation gate ([[validate-export-script]] + PostToolUse hook + compose step). **C2** three banner variants (`v1_balanced`/`v2_bold`/`v3_minimal`) with a new orchestrator selection gate (4d). **C3** visual thumbnail previews on the logo/background/variant gates. **C4** live cross-session consistency — the orchestrator records to the registry and surfaces palette-reuse (ΔE<10) + duplicate-headline warnings. Commits `b9e5a08` (C1+C4), `dff39bb` (C2+C3).
- **Decisions:** Hard checks (dimensions/blank) block; soft checks (contrast/logo/legibility) surface to the user. Duplicate-headline check sits in the orchestrator (keeps copywriter pure). Separate Canva design per variant (per-variant edit URL, no element stacking).
- **Notes / Caveats:** `session_state` gained `similar_clients`, `validation_results`, `variants_generated`, `chosen_variant`. The hook + preview rendering are unverified live (see Open Questions).
- **Related:** [[validate-export-script]], [[sqlite-brand-registry]], [[canva-designer-agent]], [[banner-orchestrator-agent]]

### 2026-06-04 — Phase D: skills + documentation [shipped]
- **What was done:** Added two design skills — [[advanced-color-theory-skill]] and [[photography-composition-skill]] — taking the system from 3 to 5 brand-knowledge skills, wired into canva-designer. Updated this overview, [[cross-session-consistency]], and `CLAUDE.md` (stack + integrations). Commit `91992e8` (skills).
- **Decisions:** The new skills **extend** [[visual-design-principles-skill]] (§2 color, §4 prompts) rather than duplicate it, and tie explicitly into the C-phase automated checks (ΔE distinctiveness, contrast, legibility).
- **Notes / Caveats:** End-to-end `/banner-create` validation (D4) is deferred until the Canva MCP reconnects + a restart.
- **Related:** [[advanced-color-theory-skill]], [[photography-composition-skill]], [[visual-design-principles-skill]], [[claude-md]]

### 2026-07-02 — Overview refreshed to Nano Banana reality [shipped]
- **What was done:** Rewrote the stale Overview as part of the [[project-health-audit]] fix pass: 3→6 sub-agents, 5→7 skills, main-thread orchestration (F1), dual-path RTL (`design_mode` full/background), Nano Banana as default engine with gpt-image demoted to fallback, vault path `banner_create/`. Same-day: `CLAUDE.md` counts/scripts list fixed, new [[gemini-image-script]] topic file created.
- **Decisions:** Kept the C-phase / registry / Figma paragraphs intact — still accurate; only the engine + agent-topology claims were wrong.
- **Notes / Caveats:** none.
- **Related:** [[project-health-audit]], [[gemini-image-script]], [[nano-banana-d4-test]], [[claude-md]]
