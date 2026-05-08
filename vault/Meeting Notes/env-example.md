# .env.example

## Overview
Environment variable template that must be copied to `.env` before running the banner pipeline. Defines `OPENAI_API_KEY` (required for gpt-image-2 background generation), `OPENAI_IMAGE_MODEL` (default `gpt-image-2`), `OPENAI_IMAGE_QUALITY` (default `medium`), and an optional `OPENAI_CALL_SOFT_CAP` (default 30) controlling when the orchestrator soft-prompts the user about cost.

## Open Questions
- D5 — Final default for `OPENAI_CALL_SOFT_CAP` — 30 is reasonable but unverified in production.

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The `.env.example` itself was created at project init.
- **Decisions:** Keep template gitignored is wrong — the **example** is committed; only `.env` (with real values) is gitignored. This file's purpose is to onboard new developers/operators.
- **Notes / Caveats:** Read by `scripts/openai_image.js` via a minimal in-script `.env` loader (no `dotenv` dependency).
- **Related:** [[gitignore-config]], [[openai-image-script]], [[canva-designer-agent]]
