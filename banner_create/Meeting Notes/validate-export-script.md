# validate_export.js — Export Quality Gate (C1)

## Overview
`scripts/validate_export.js` is the **C1 quality gate**: it inspects a final banner/header PNG before it ships. It runs **two ways**:

- **CLI (rich, metadata-aware)** — `canva-designer` calls it explicitly in `compose` **Step 5e.1**, right after downloading each export, passing the text colour and the pixel regions where it placed the headline / logo. Checks:
  - `dimensions` — exact 310×600 (banner) / 1366×200 (header). **HARD**
  - `not_blank` — image is not one flat colour / empty (catches a black-on-black or empty export). **HARD**
  - `contrast` — WCAG AA contrast of the text colour vs the sampled background, per text region (≥4.5:1, or ≥3:1 with `--large-text`). **SOFT**
  - `logo_size` — ≤35% banner width / ≤200px header, and ≥60px min. **SOFT**
  - `legibility` — edge density of the background under the text < 30% ("busy background" heuristic). **SOFT**
- **Hook (`--hook`)** — registered as a **`PostToolUse`** hook on the Canva `export-design` MCP tool (matcher `export-design` in `.claude/settings.json`). Reads the hook JSON from stdin, resolves a PNG (a local `.png` path inside the tool response, else downloads an `http(s)` export URL), and runs only the metadata-free **HARD** checks. On a hard failure it exits **2** (Claude Code feeds the reason back to the orchestrator); otherwise exit 0. Any internal hiccup → exit 0, so a validation problem can **never** break the conversation.

**Severity model:** HARD failure → `pass:false`, exit **1** (CLI) / exit **2** (hook). SOFT failure → `pass:false`, exit **0** (surfaced to the user at Gate 4c, who decides whether to accept or recompose). All pass → `pass:true`, exit 0. Output is one JSON line: `{ok, pass, hardFail, kind, input, dimensions, checks:[{name,pass,severity,value,threshold,detail}], warnings:[]}`.

**Why split CLI vs hook:** only the agent knows the text colour and where it placed everything, so the rich contrast/logo/legibility checks live in the explicit compose step. `export-design` returns a *URL* (the agent then curls it to a local file), so a hook firing on that tool has neither the local file nor the placement metadata — it can only be a metadata-free safety net for catastrophic exports (wrong dimensions / blank).

## Open Questions
- **Text/logo regions are approximate.** The agent derives the `--text-region` / `--logo-region` boxes from position keywords (center / lower-third) + the 35% logo cap, not from exact Canva node geometry. Good enough for a heuristic gate; could be tightened later by reading the real bounding boxes via `get-design`.
- ~~**Hook response shape unverified live.**~~ **Verified (2026-06-04):** against a real Canva `export-design` response — the download URL sits in `job.urls[0]` as `…/0001-….png?X-Amz-…` (signed S3). The resolver's `/\.png(\?|$)/` matches it, the fetch returns 200, and validation runs. `readStdin` was also hardened to a synchronous fd-0 read after a `spawnSync`-style delivery silently missed the event-based read.
- **Thresholds** (contrast 4.5 / 3.0-large, legibility 30% edges, blank stdev 2.5, logo 35% / 200px / 60px) are constants at the top of the script — calibrate once we have real exports.

## Session Log

### 2026-06-04 — C1: validator built + wired [shipped]
- **What was done:** Wrote `scripts/validate_export.js` (dimensions + not_blank HARD; contrast + logo_size + legibility SOFT; plus `--hook` mode). Registered the `PostToolUse` hook (matcher `export-design`) in `.claude/settings.json`. Wired an explicit call into `canva-designer` compose **Step 5e.1** (replacing the old inline `node -e` dimension check) and added a `validation` field to the compose return envelope; the orchestrator surfaces soft warnings at Gate 4c.
- **Decisions:**
  - **Two run modes, honest split.** Rich metadata-aware checks in the agent step; metadata-free safety net in the hook (it can't see the text colour or the local file).
  - **Severity model.** HARD (dimensions, blank) blocks via exit 1/2; SOFT (contrast, logo, legibility) surfaces `pass:false` but exits 0 so the user decides — matches the plan's "show and ask whether to continue".
  - **Matcher `export-design`** (substring) rather than the full `mcp__<uuid>__export-design`, so the hook survives a Canva server-id change.
  - **Never breaks the session.** The hook wraps everything in try/catch → exit 0 on any error (same philosophy as [[vault-sync-hook]]).
  - **WCAG math + edge density implemented directly** — relative-luminance contrast ratio; background estimated by separating text-coloured pixels from the rest of the region; a cheap |dx|+|dy| luma gradient for the "busy background" heuristic.
- **Tested:** 10 synthetic fixtures — gradient (pass), solid (blank → exit 1), wrong-dim (exit 1), gray-on-gray (contrast 1.18:1 soft), noise (legibility 91.4% soft), logo 58% (fail) / 29% (pass), hook good (exit 0) / blank (exit 2) / no-png (exit 0), out-of-bounds region (clamped).
- **Related:** [[canva-designer-agent]], [[claude-settings]], [[banner-orchestrator-agent]], [[sqlite-brand-registry]]

### 2026-06-04 — hook verified live + readStdin hardened [shipped]
- **What was done:** With Canva reconnected, exported a real design and replayed the actual `export-design` response through `--hook`. Confirmed the resolver finds the signed `.png?…` URL in `job.urls[0]`, downloads it (200, real PNG), and validates. Fixed `readStdin` to read fd 0 synchronously (`fs.readFileSync(0)`) — a `spawnSync`-style delivery had silently missed the event-based read; now both a shell pipe and spawn-with-input work.
- **Decisions:** Synchronous stdin read is the robust choice for a short-lived hook (no event-timing race). Local CLI mode is unaffected (it doesn't read stdin).
- **Related:** [[canva-designer-agent]], [[claude-settings]]
