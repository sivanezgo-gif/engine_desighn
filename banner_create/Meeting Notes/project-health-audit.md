# Project Health Audit

## Overview
Periodic whole-project review: git/branch hygiene, config drift, script health, vault/doc accuracy, and open upgrade items. Each session log entry is a dated audit snapshot with findings ranked by severity. Findings that become work items move to `TODO.md`; this file records what was checked and what was found.

## Open Questions
- וילה סוליס session interrupted mid-profile (host restart, 2026-07-02) — resume `output/vylh-svlys-20260701-165322/` or start fresh?
- `.claude/settings.local.json` still holds stale old-path allow rules — classifier blocks Claude from rewriting permission files; user can prune manually (keep only the `Skill(banner-create)` entries).
- `.agents/skills/brainstorming` is tracked but unreferenced (its `.claude/skills/` symlink was broken since the folder move and got removed) — keep, re-link (needs admin for symlinks), or drop from git?

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

### 2026-07-02 — fix pass: cleanup + doc-drift repairs [shipped]
- **What was done:** Applied every fix Sivan approved from the audit. **Cleanup:** removed the broken `.claude/skills/brainstorming` symlink (killed the per-command git warning; native symlink re-creation needs admin, so it stays removed), deleted stale worktree leftovers `objective-bassi-3b3072` (~70 MB) + both merged local branches, untracked `.claude/settings.local.json` (`git rm --cached`) and gitignored it, dropped unused deps `@anthropic-ai/sdk` + `headroom-ai` from `package.json`. **Doc drift:** [[architecture-overview]] Overview rewritten to Nano Banana reality; `CLAUDE.md` counts (6 sub-agents / 7 skills) + scripts list fixed; new [[gemini-image-script]] topic file (dangling wikilink resolved) + index lines; `sync_vault.js` header comments repointed `vault/`→`banner_create/`; stale TODO item marked done.
- **Decisions:** Blocked twice by the auto-classifier on permission-file writes (`settings.json` allow-rule for gemini_image.js, `settings.local.json` prune) — both handed to Sivan as manual paste-ins rather than worked around. Left `Bash(node scripts/replicate_image.js:*)` allow rule in place (B1 is still planned). וילה סוליס resume left for Sivan's call.
- **Notes / Caveats:** `git push origin main` still pending (user-only). Brainstorming skill content intact at `.agents/skills/brainstorming` if she ever wants it re-linked/copied.
- **Related:** [[claude-settings]], [[architecture-overview]], [[gemini-image-script]], [[claude-md]], [[nano-banana-d4-test]]
