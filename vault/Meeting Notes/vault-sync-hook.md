# Vault Sync Hook (scripts/sync_vault.js)

## Overview
`scripts/sync_vault.js` keeps the user's Obsidian vault current with vault edits made inside the git worktree. Work happens in a worktree (`.claude/worktrees/<id>/vault/`), but Obsidian opens the **main repo** vault (`<repo>/vault/`, where `.obsidian/` lives), so worktree edits were invisible in the app until a branch merge. On every turn (a `Stop` hook) and at session end (a `SessionEnd` hook) the script does two things: (1) **mirror** — copies the worktree `vault/` into the main repo `vault/` so updates appear live in Obsidian; (2) **auto-commit** — `git commit` of `vault/` changes on the worktree branch as a history safety-net. Registered in [[claude-settings]]. Shipped 2026-05-20.

## Open Questions
- v1 mirror is additive / overwrite-only — it does **not** delete files in the destination that were removed or renamed in the source. A renamed topic leaves a stale copy in the main vault until manually removed. Add an opt-in `--prune` mode if this bites.
- Hooks added mid-session may need a Claude Code restart to activate. Confirm whether the running CLI reloads `settings.json` live.
- Mirror is one-way (worktree → main; worktree is the source of truth). If the user edits notes directly in Obsidian (main), those edits are overwritten on the next sync. Left one-way deliberately — two-way risks clobbering. Revisit if the user wants to hand-edit in Obsidian.

## Session Log

### 2026-05-20 — Initial implementation [shipped]
- **What was done:** Wrote `scripts/sync_vault.js` and registered `Stop` + `SessionEnd` hooks in [[claude-settings]]. The script resolves the worktree root via `git rev-parse --show-toplevel` and the main repo root via `path.dirname(git rev-parse --path-format=absolute --git-common-dir)`; if the two are equal (running directly on main) the mirror is skipped. The mirror walks `vault/` recursively, skips `.obsidian/` and `.git/`, and copies a file only when it is missing / a different size / different bytes (`Buffer.compare`) — never rewriting identical files. The commit is scoped to the `vault/` pathspec (`git add -- vault` → `git commit -m "docs(vault): auto-sync <ISO>" -- vault`) so it never sweeps up staged code. The script always exits 0.
- **Decisions:**
  - **Content compare, not mtime.** A first test using an mtime heuristic copied 23 of ~24 files on a fresh checkout (worktree mtimes are newer), which would spam Obsidian's file watcher. Switched to a byte comparison so only genuinely-changed files are rewritten; a second run is a silent no-op.
  - **Both `Stop` and `SessionEnd`** per the user's choice — live updates after every turn plus a final flush at session end.
  - **Never touch `.obsidian/`** — the user's app config (workspace / appearance / graph) must survive the mirror untouched.
  - **Always exit 0** — a documentation-sync failure must never block the conversation; problems go to stderr only.
  - **Code commits stay manual.** The pathspec-scoped commit means per-phase code commits remain a deliberate human step, consistent with the "stop for commit + check between phases" workflow.
- **Notes / Caveats:** The first real mirror caught the main vault up by 23 files — confirming the whole session's prior vault work had never reached the user's Obsidian until now. v1 does not prune deletions (see Open Questions). Verified manually: temp marker mirrored into the main vault, `.obsidian/` left intact, second run silent (0 copies), temp files cleaned from both trees.
- **Related:** [[claude-settings]], [[architecture-overview]], [[obsidian-vault-workflow-skill]], [[image-enhancement-scripts]]
