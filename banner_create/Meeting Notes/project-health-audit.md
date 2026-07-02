# Project Health Audit

## Overview
Periodic whole-project review: git/branch hygiene, config drift, script health, vault/doc accuracy, and open upgrade items. Each session log entry is a dated audit snapshot with findings ranked by severity. Findings that become work items move to `TODO.md`; this file records what was checked and what was found.

## Open Questions
- Broken symlink `.claude/skills/brainstorming` (points to the pre-"New folder" path) — delete or recreate? Is the tracked `.agents/skills/brainstorming` used at all?
- Should `.claude/settings.local.json` be untracked (`git rm --cached` + gitignore)? It carries stale absolute-path allow rules from the old project location.
- Unused deps in `package.json` (`@anthropic-ai/sdk`, `headroom-ai`) — remove or is something planned for them?
- וילה סוליס session interrupted mid-profile (host restart, 2026-07-02) — resume `output/vylh-svlys-20260701-165322/` or start fresh?

## Session Log

### 2026-07-02 — full project audit [debug]
- **What was done:** Reviewed git state (branches, sync vs origin, worktrees), `.claude/settings*.json`, `package.json`, `.env.example`, `.gitignore`, all scripts (headers + `gemini_image.js` in full), recent `output/` sessions, brand registry contents, and vault doc accuracy. No code changed — findings-only audit.
- **Decisions:** none (report delivered to Sivan; fixes await her call).
- **Notes / Caveats (findings, high→low):**
  - **User-blocked (already in TODO):** `main` ahead of `origin/main` by 8 commits — manual `git push origin main` pending; `gemini_image.js` allow-rule still missing from `settings.json`.
  - **New — broken symlink:** `.claude/skills/brainstorming` → old absolute path (project moved into `New folder/`); causes the `could not open directory` git warning on every command.
  - **New — interrupted client:** two וילה סוליס sessions (2026-07-01) stuck `in_progress`; the later one lost its brand-researcher dispatch to a host restart (log 2026-07-02T06:32Z). Undocumented in vault.
  - **Cleanup:** stale worktree leftovers `.claude/worktrees/objective-bassi-3b3072` (~70 MB, branch already merged); local branches `claude/objective-bassi-3b3072` + `nano-banana` both merged into main; `.claude/settings.local.json` tracked in git with dead old-path rules; unused deps `@anthropic-ai/sdk` + `headroom-ai`; `settings.json` allows nonexistent `replicate_image.js`.
  - **Doc drift:** [[architecture-overview]] Overview still says gpt-image default / 3 sub-agents / RTL-split (reality: Nano Banana full-design, 6 sub-agents); `CLAUDE.md` says "5 sub-agents + 5 skills" (actual 6 + 7) and its scripts list omits `compose_banner.js` + `migrate_existing_sessions.js`; wikilink `[[gemini-image-script]]` used in [[nano-banana-d4-test]] but no such topic file exists; `sync_vault.js` header comments still say `vault/` (code correctly uses `banner_create/`); TODO item "merge objective-bassi branch" already done.
  - **Healthy:** brand registry (3 clients), `gemini_image.js` (retries/backoff/cleanExit all sound), resize/validate pipeline, vault sync repointed correctly, `.gitignore` covers secrets/output/tools.
- **Related:** [[nano-banana-d4-test]], [[architecture-overview]], [[claude-settings]], [[claude-md]], [[vault-sync-hook]], [[sqlite-brand-registry]]
