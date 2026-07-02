# Gemini Image Script (Nano Banana)

## Overview
`scripts/gemini_image.js` — the system's **primary image engine** (replaced [[openai-image-script]] as default, 2026-06-30). Calls Google Gemini image models (default `gemini-3-pro-image-preview` = Nano Banana Pro, overridable via `--model` / `GEMINI_IMAGE_MODEL`) through the REST `generateContent` endpoint with `responseModalities: ["TEXT","IMAGE"]`. Unlike gpt-image it renders **Hebrew text correctly** and composes a **full design conditioned on reference images** — the repeatable `--ref` flag (logo + `examples/`) is what enables `design_mode:"full"`. CLI: `--prompt --out [--size WxH | --aspect W:H] [--ref img]... [--model] [--retries]`. Maps a target WxH to the nearest Gemini-supported aspect ratio; output dims are approximate, so `resize.js` must always run afterward. Reads `GEMINI_API_KEY` from env / cwd `.env` / main-repo-root `.env` (worktree-safe, same strategy as openai_image.js). Emits a one-line JSON envelope `{ok, path, bytes, attempt, model}` — callers key off the JSON line.

## Open Questions
- `gemini-3-pro-image-preview` is a **preview** model — expect deprecation/rename eventually; `GEMINI_IMAGE_MODEL` env var is the escape hatch.
- Allow-rule in `.claude/settings.json` still pending (user action; classifier blocks self-edit).

## Session Log

### 2026-06-30 — script created, replaces gpt-image as default [shipped]
- **What was done:** New engine script with `--ref` reference-image support, size→aspect mapping, 429/503 exponential backoff (3 retries), safety-block and empty-candidate handling, and a <1KB sanity check on the returned image. Verified live: Hebrew renders correctly (RTL, spelling). Commit `5cc3967`.
- **Decisions:** REST fetch with zero external deps (no SDK) — same pattern as openai_image.js. Callers must parse the JSON envelope, not the exit code.
- **Notes / Caveats:** Output size is aspect-approximate; `resize.js` (cover / center-crop) enforces exact 310×600 / 1366×200.
- **Related:** [[openai-image-script]], [[resize-script]], [[canva-designer-agent]]

### 2026-07-01 — F3 libuv exit crash hardened [shipped]
- **What was done:** Fixed intermittent Windows crash `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` fired by `process.exit(0)` racing undici's keep-alive TLS socket close. New `cleanExit()`: sets `process.exitCode`, lets the loop drain naturally, unref'd 150ms timer force-exits after a quiet window. Commit `5d918a0`.
- **Decisions:** JSON envelope prints *before* exit handling, so callers stay correct even if an exotic exit path recurs.
- **Notes / Caveats:** Tested — exit 0, no crash, no hang.
- **Related:** [[nano-banana-d4-test]]

### 2026-07-02 — dedicated topic file created [shipped]
- **What was done:** Created this topic file during the [[project-health-audit]] fix pass — the `[[gemini-image-script]]` wikilink was already referenced from [[nano-banana-d4-test]] and [[architecture-overview]] but the file didn't exist. Content back-filled from git history + code.
- **Decisions:** none.
- **Notes / Caveats:** none.
- **Related:** [[project-health-audit]], [[architecture-overview]]
