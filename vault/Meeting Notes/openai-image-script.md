# scripts/openai_image.js

## Overview
Node.js CLI that generates a single image via OpenAI's `/v1/images/generations` endpoint. Args: `--prompt`, `--size WxH`, `--out`, `--model` (default `gpt-image-2`), `--quality` (default `medium`), `--retries` (default 3). Loads `.env` via a minimal built-in loader (no `dotenv` dependency) — checks `cwd/.env` first, then falls back to the **main repo root's `.env`** (resolved via git-common-dir) so it works when run from a worktree that has no `.env` of its own. Handles both `b64_json` and `url` response shapes. Exponential backoff on 429 (1s/2s/4s). Validates output buffer is at least 1024 bytes (rejects empty/corrupt responses). Called by [[canva-designer-agent]] during `phase=backgrounds` — 6 invocations per session (3 banner + 3 header).

## Open Questions
- D5 — soft-cap warning at 30 calls per session — currently driven by orchestrator, not this script.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Script itself was authored in prior sessions.
- **Decisions:** Standalone Node script (not a JS module) — invoked via `node scripts/openai_image.js ...` from the canva-designer's Bash tool. Keeps OpenAI logic out of the agent prompt.
- **Notes / Caveats:** Banner size is `1024x1984`; header size is `2304x800`. Both are intermediate resolutions before [[resize-script]] crops to final.
- **Related:** [[canva-designer-agent]], [[env-example]], [[resize-script]], [[visual-design-principles-skill]]

### 2026-06-04 — main-repo .env fallback [shipped]
- **What was done:** Extended the `.env` loader to fall back to the main repo root's `.env` (via `git rev-parse --git-common-dir`) when `cwd/.env` is absent — the git worktree has no `.env`, but the canonical one lives in the main checkout. Verified from the worktree: `OPENAI_API_KEY` now resolves (len 164). Values already in `process.env` still win.
- **Decisions:** Same root-resolution approach as [[vault-sync-hook]]. Only `openai_image.js` needed it (rembg / upscale are token-free; a future `replicate_image.js` will inherit the same pattern). Surfaced while prepping the D4 end-to-end test, where the worktree had no reachable `OPENAI_API_KEY`.
- **Related:** [[vault-sync-hook]], [[env-example]], [[canva-designer-agent]]
