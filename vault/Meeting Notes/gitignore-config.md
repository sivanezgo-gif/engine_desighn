# .gitignore

## Overview
Git ignore rules at the repo root. Excludes: secrets (`.env`, `.env.local`, `.env.*.local`), generated per-customer artifacts (`output/`), Node and Python build/dep artifacts (`node_modules/`, `__pycache__/`, `.venv/`, lockfiles), OS/editor cruft (`.DS_Store`, `.vscode/`, `.idea/`, `*.swp`), and temp files. Critical for ensuring no API keys or per-customer outputs ever land in git.

## Open Questions
- none

## Session Log

### 2026-05-08 — Documented in vault [shipped]
- **What was done:** Created this topic file. The `.gitignore` itself was created at project init.
- **Decisions:** `output/` is gitignored because every banner session writes to `./output/{slug}-{timestamp}/` — these are per-customer artifacts, not source.
- **Notes / Caveats:** `package-lock.json` and `yarn.lock` are ignored — if multi-developer reproducibility becomes important, reconsider.
- **Related:** [[env-example]], [[architecture-overview]]
