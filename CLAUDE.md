# CLAUDE.md

הנחיות ל-Claude Code בעבודה במאגר הזה. **נטען לכל סשן** — נשמר רזה: invariants, מפה, ומצביעים בלבד. פרוצדורות מלאות חיות ב-skills.

---

# EzGo Banner System — מחולל באנרים לבתי עסק אירוח

## משימה ותוצרים

מערכת מולטי-אג'נט שמייצרת נכסי מיתוג למנוע ההזמנות של EzGo, פר venue חדש בתחום האירוח.
תוצרי הליבה:
- **באנר צד** — `310×600` px (portrait)
- **הדר** — `1366×200` px (landscape)

הרחבה אופציונלית (`format-multiplier`): סט נכסים מלא — social square, story, קופון, כרטיס מוצר.

המערכת במצבה הנוכחי היא **אוטומציית Claude Code מרובת-agents** (לא אפליקציית web) — orchestrator + sub-agents + scripts + שרתי MCP, המייצרת 3 וריאציות באנר 310×600 + הדר 1366×200 ללקוח.

## Stack טכנולוגי

**Runtime & core**
- **Node.js 22+** — כל ה-scripts (נבדק על 24.15); משתמש ב-`node:sqlite` המובנה.
- **sharp** — עיבוד תמונה: resize/crop לממדים הסופיים + ניתוח פיקסלים לוולידציה (`validate_export.js`).
- **SQLite** (`node:sqlite` מובנה, `output/brands.db`) — מסד מותג cross-session (פלטות ΔE76, כותרות Jaccard).
- **Python 3** — rembg (הסרת רקע, u2net), colorthief (חילוץ פלטה), cairosvg (המרת SVG).

**יצירת תמונות**
- **OpenAI gpt-image** (ברירת מחדל) דרך `scripts/openai_image.js`.
- **Replicate** (Flux / Recraft / Ideogram) — *חסום בטוקן*, נופל חזרה ל-gpt-image.

**שיפור תמונה (מקומי, ללא API)**
- **Real-ESRGAN** (`realesrgan-ncnn-vulkan`) — upscaling. **rembg** — הסרת רקע ללוגו. צינור נעול: rembg → upscale.

**עיצוב & MCP**
- **Canva MCP** — יצירת designs, editing transactions, export. **Figma MCP** (OAuth connector) — anchor ל-design-system (רדום עד שייווצר קובץ).

**פקודות:** אין build/test/lint פורמליים. בדיקת script בודד: `node scripts/<name>.js --help`. בדיקת end-to-end: `/banner-create`.

---

## Invariants קשיחים (מחייבים כל סוכן)

1. **אסטרטגיית RTL** — ההחלטה הארכיטקטונית המרכזית: `gpt-image` מייצר רקעים **ללא טקסט כלל**;
   הוספת הטקסט בעברית נעשית ב-Canva native composition (RTL-aware). לעולם לא לבקש מ-gpt-image לרנדר מילים.
2. **מידות סופיות קבועות** — באנר `310×600`, הדר `1366×200`. כל פלט נבדק מול אלה (sharp) לפני החזרת `ok`.
3. **שפה** — עברית מול המשתמש; אנגלית בקוד, JSON, data, ושמות קבצים.
4. **הפרדת אחריות:**
   - האורקסטרטור (`banner-orchestrator`) הוא **הכותב היחיד** של `session_state.json` ו**בעל כל ה-gates**.
   - תתי-הסוכנים **stateless**, מחזירים JSON envelope בלבד, ו**לעולם לא פונים למשתמש** (אין `AskUserQuestion`).
   - האורקסטרטור **לא** קורא ישירות ל-`WebFetch`/`WebSearch`/OpenAI/Canva — רק דרך `Task`.
5. **סודות** — מפתחות API ב-`.env` בלבד (ראה `.env.example`). לעולם לא ב-git.

---

## מפת ארכיטקטורה

`1 orchestrator + 5 sub-agents + 5 skills + scripts + SQLite registry`, מודבקים ב-slash command יחיד.

**Agents (`.claude/agents/`):**
- `banner-orchestrator` — control-flow, dispatch, gates, session state
- `brand-researcher` — מחקר פרופיל מותג + איתור/יצירת לוגו גולמי
- `asset-forge` — הכנת לוגו: `rembg → upscale → normalize → upload`
- `copywriter` — 3 כותרות ב-3 סגנונות
- `canva-designer` — directions / backgrounds / compose / abort
- `design-qa` — מבקר איכות עצמאי של הפלט (Gate 4d)
- `format-multiplier` — fan-out לסט נכסים מלא (Phase 5, אופציונלי)

**Skills (`.claude/skills/`):**
- `orchestration-protocol` — החוזה המכני: slug/state/envelope/gates/abort/logging/injection
- `canva-mcp-operations` — playbook ל-Canva MCP: upload/create/transaction/export
- `visual-design-principles` — עקרונות עיצוב (פורמט, צבע, טיפוגרפיה, quality gates)
- `marketing-thinking` — מיצוב מותג, verticals, tone→visual mapping
- `hospitality-copywriting` — כתיבת כותרות לאירוח
- (+ `obsidian-*` — עבודה מול ה-vault)

**Slash command (`.claude/commands/`):** `/banner-create [business_name] [url]` — invoker דק לאורקסטרטור.

---

## מפת ספריות

```
output/{session_id}/        # תוצרי סשן: logo/ backgrounds/ chosen_set/ final/ + session_state.json, session.log
scripts/                    # openai_image.js, resize.js, brand_db.js, validate_export.js, remove_bg.js, upscale.js, sync_vault.js
.claude/{agents,skills,commands}/
vault/                      # זיכרון ארוך-טווח (Meeting Notes / Brand Guidelines / ...)
.env                        # סודות (לא ב-git)
```

---

## מצביעים

- **זיכרון ארוך-טווח** — ה-`vault/` הוא הזיכרון של הפרויקט. חובה לפעול לפי skill `obsidian-vault-workflow`
  בתחילת ובסוף כל משימה. ה-vault מסונכרן אוטומטית דרך hook — ראה `vault/Meeting Notes/vault-sync-hook.md`.
- **החוזה התפעולי המלא** — skill `orchestration-protocol` (לא משוכפל כאן).
- **זיכרון מותג חוצה-סשנים** — SQLite registry; ראה `vault/Meeting Notes/sqlite-brand-registry.md`
  (דמיון פלטה ΔE76, זיהוי כותרות כפולות Jaccard).
- **אינטגרציית Canva** — MCP server פעיל בסביבה; המכניקה ב-skill `canva-mcp-operations`.
- **תיעוד טכני** — `vault/` (נפתח ב-Obsidian). נקודות כניסה: `vault/Meeting Notes/_index.md`, `vault/Brand Guidelines/_index.md`, [[architecture-overview]].
