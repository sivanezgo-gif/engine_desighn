# obsidian-vault-workflow skill

## Overview
Procedural skill at `.claude/skills/obsidian-vault-workflow/SKILL.md`. Defines the **mandatory** vault read/write protocol: at task start, identify the topic, read its existing topic file (Overview + Open Questions + every Session Log entry) plus 2–3 recent Meeting Notes plus relevant Content Briefs / Brand Guidelines; at task end, append a dated `### YYYY-MM-DD — title [status]` entry to the topic file's Session Log with What was done / Decisions / Notes / Related (`[[wikilinks]]`), update Overview only if scope/status changed, update `## Open Questions`, and add the topic to its folder's `_index.md`. This is the protocol that produced this entire vault.

## Open Questions
- none — protocol is followed as authored.

## Session Log

### 2026-05-08 — Initial vault creation [shipped]
- **What was done:** Invoked this skill to bootstrap the project vault from zero. Created `vault/Meeting Notes/` and `vault/Brand Guidelines/` with `_index.md` in each, plus one topic file per project artifact.
- **Decisions:** All 16 project artifacts get a topic file; brand-related skills go to Brand Guidelines, everything else to Meeting Notes. All entries tagged `[shipped]` because the underlying code is on `main`.
- **Notes / Caveats:** No prior vault state — first session for every topic. Wikilinks point at filenames (without `.md`).
- **Related:** [[obsidian-markdown-skill]], [[obsidian-bases-skill]], [[architecture-overview]]
