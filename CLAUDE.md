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
scripts/                    # openai_image.js, resize.js (+ remove_bg.js, upscale.js — צינור הלוגו)
.claude/{agents,skills,commands}/
vault/                      # זיכרון ארוך-טווח (Meeting Notes / Brand Guidelines / ...)
.env                        # סודות (לא ב-git)
```

---

## מצביעים

- **זיכרון ארוך-טווח** — ה-`vault/` הוא הזיכרון של הפרויקט. חובה לפעול לפי skill `obsidian-vault-workflow`
  בתחילת ובסוף כל משימה.
- **החוזה התפעולי המלא** — skill `orchestration-protocol` (לא משוכפל כאן).
- **זיכרון מותג חוצה-סשנים** — SQLite registry; ראה `vault/Meeting Notes/sqlite-brand-registry.md`
  (דמיון פלטה ΔE76, זיהוי כותרות כפולות Jaccard).
- **אינטגרציית Canva** — MCP server פעיל בסביבה; המכניקה ב-skill `canva-mcp-operations`.
