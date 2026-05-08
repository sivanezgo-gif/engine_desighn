# scripts/openai_image.js

## Overview
Node.js CLI that generates a single image via OpenAI's `/v1/images/generations` endpoint. Args: `--prompt`, `--size WxH`, `--out`, `--model` (default `gpt-image-2`), `--quality` (default `medium`), `--retries` (default 3). Loads `.env` via a minimal built-in loader (no `dotenv` dependency). Handles both `b64_json` and `url` response shapes. Exponential backoff on 429 (1s/2s/4s). Validates output buffer is at least 1024 bytes (rejects empty/corrupt responses). Called by [[canva-designer-agent]] during `phase=backgrounds` — 6 invocations per session (3 banner + 3 header).

## Open Questions
- D5 — soft-cap warning at 30 calls per session — currently driven by orchestrator, not this script.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. Script itself was authored in prior sessions.
- **Decisions:** Standalone Node script (not a JS module) — invoked via `node scripts/openai_image.js ...` from the canva-designer's Bash tool. Keeps OpenAI logic out of the agent prompt.
- **Notes / Caveats:** Banner size is `1024x1984`; header size is `2304x800`. Both are intermediate resolutions before [[resize-script]] crops to final.
- **Related:** [[canva-designer-agent]], [[env-example]], [[resize-script]], [[visual-design-principles-skill]]
