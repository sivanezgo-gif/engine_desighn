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
- **Google Gemini "ננו בננה"** (ברירת מחדל) דרך `scripts/gemini_image.js` — מודל `gemini-3-pro-image-preview` (Nano Banana Pro). מרנדר **עיצוב מלא כולל טקסט עברי** ומחבר מתמונות-ייחוס (לוגו + `examples/`) דרך `--ref`. דורש `GEMINI_API_KEY`.
- **OpenAI gpt-image** — `scripts/openai_image.js`, fallback legacy (רקעים ללא טקסט בלבד).
- **Replicate** (Flux / Recraft / Ideogram) — *חסום בטוקן*.

**שיפור תמונה (מקומי, ללא API)**
- **Real-ESRGAN** (`realesrgan-ncnn-vulkan`) — upscaling. **rembg** — הסרת רקע ללוגו. צינור נעול: rembg → upscale.

**עיצוב & MCP**
- **Canva MCP** — יצירת designs, editing transactions, export. **Figma MCP** (OAuth connector) — anchor ל-design-system (רדום עד שייווצר קובץ).

**פקודות:** אין build/test/lint פורמליים. בדיקת script בודד: `node scripts/<name>.js --help`. בדיקת end-to-end: `/banner-create`.

---

## Invariants קשיחים (מחייבים כל סוכן)

1. **אסטרטגיית RTL** — שני מסלולים, נשלטים ב-`design_mode`:
   - **full (ברירת מחדל, ננו בננה)** — Gemini מרנדר את העיצוב **השלם כולל הטקסט בעברית בתוך התמונה**, מותנה בלוגו + דוגמאות `examples/` כתמונות-ייחוס. אין שלב טקסט ב-Canva. **חובה לאמת ויזואלית** שהעברית תקינה (כיוון RTL, איות, שלמות אותיות) — `design-qa` הוא ה-gate לכך.
   - **background (fallback)** — אם רינדור העברית נשבר: המודל מייצר רקע **ללא טקסט**, והעברית נוספת ב-Canva native composition (RTL-aware), כמו במסלול הישן עם gpt-image.
2. **מידות סופיות קבועות** — באנר `310×600`, הדר `1366×200`. כל פלט נבדק מול אלה (sharp) לפני החזרת `ok`.
3. **שפה** — עברית מול המשתמש; אנגלית בקוד, JSON, data, ושמות קבצים.
4. **הפרדת אחריות:**
   - האורקסטרטור (`banner-orchestrator`) הוא **הכותב היחיד** של `session_state.json` ו**בעל כל ה-gates**.
   - תתי-הסוכנים **stateless**, מחזירים JSON envelope בלבד, ו**לעולם לא פונים למשתמש** (אין `AskUserQuestion`).
   - האורקסטרטור **לא** קורא ישירות ל-`WebFetch`/`WebSearch`/OpenAI/Canva — רק דרך `Task`.
5. **סודות** — מפתחות API ב-`.env` בלבד (ראה `.env.example`). לעולם לא ב-git.

---

## מפת ארכיטקטורה

`1 orchestrator + 6 sub-agents + 7 skills + scripts + SQLite registry`, מודבקים ב-slash command יחיד.

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
- `advanced-color-theory` — הרמוניות צבע, ΔE, נגישות (מרחיב את visual-design §2)
- `photography-composition` — קומפוזיציה צילומית ל-prompts (מרחיב את visual-design §4)
- (+ `obsidian-*` — עבודה מול ה-vault)

**Slash command (`.claude/commands/`):** `/banner-create [business_name] [url]` — invoker דק לאורקסטרטור.

---

## מפת ספריות

```
output/{session_id}/        # תוצרי סשן: logo/ backgrounds/ chosen_set/ final/ + session_state.json, session.log
scripts/                    # gemini_image.js (ננו בננה, ברירת מחדל), openai_image.js (fallback), resize.js, compose_banner.js, brand_db.js, migrate_existing_sessions.js, validate_export.js, remove_bg.js, upscale.js, render_headline_mock.js, sync_vault.js
.claude/{agents,skills,commands}/
banner_create/                      # זיכרון ארוך-טווח (Meeting Notes / Brand Guidelines / ...)
.env                        # סודות (לא ב-git)
```

---

## מצביעים

- **זיכרון ארוך-טווח** — ה-`banner_create/` הוא הזיכרון של הפרויקט. חובה לפעול לפי skill `obsidian-vault-workflow`
  בתחילת ובסוף כל משימה. ה-vault מסונכרן אוטומטית דרך hook — ראה `banner_create/Meeting Notes/vault-sync-hook.md`.
- **החוזה התפעולי המלא** — skill `orchestration-protocol` (לא משוכפל כאן).
- **זיכרון מותג חוצה-סשנים** — SQLite registry; ראה `banner_create/Meeting Notes/sqlite-brand-registry.md`
  (דמיון פלטה ΔE76, זיהוי כותרות כפולות Jaccard).
- **אינטגרציית Canva** — MCP server פעיל בסביבה; המכניקה ב-skill `canva-mcp-operations`.
- **תיעוד טכני** — `banner_create/` (נפתח ב-Obsidian). נקודות כניסה: `banner_create/Meeting Notes/_index.md`, `banner_create/Brand Guidelines/_index.md`, [[architecture-overview]].
- **סגנון מועדף על הלקוח** — `examples/` מכיל עיצובים שסיון בחרה כהשראה. הדפוסים שחולצו מהם חיים ב-§9 של skill `visual-design-principles` (Pattern 1–3, פלטת צבעים, טיפוגרפיה). **בכל יצירת עיצוב — §9 גובר על ברירות המחדל הגנריות.**
