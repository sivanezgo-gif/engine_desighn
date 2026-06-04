# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# מערכת מיתוג ללקוחות - מנוע הזמנות אונליין

## תיאור הפרויקט

מערכת מיתוג ללקוחות לעיצובים גרפיים עבור מנוע הזמנות אונליין.
המערכת מנהלת את נכסי המותג של כל לקוח (לוגו, פלטת צבעים, טיפוגרפיה, תבניות עיצוב)
ומייצרת עיצובים גרפיים מותאמים אישית עבור מנוע ההזמנות - באנרים, כרטיסי מוצר,
תבניות לקופונים, וכל נכס ויזואלי שדרוש למיתוג חוויית ההזמנה.

## סטאק טכנולוגי

המערכת במצבה הנוכחי היא **אוטומציית Claude Code מרובת-agents** (לא אפליקציית web) — orchestrator + 3 sub-agents + scripts + שרתי MCP, המייצרת 3 וריאציות באנר 310×600 + הדר 1366×200 ללקוח.

**Runtime & core**
- **Node.js 22+** — כל ה-scripts (נבדק על 24.15); משתמש ב-`node:sqlite` המובנה.
- **sharp** — עיבוד תמונה: resize/crop לממדים הסופיים + ניתוח פיקסלים לוולידציה (`validate_export.js`).
- **SQLite** (`node:sqlite` מובנה, `output/brands.db`) — מסד מותג cross-session (פלטות ΔE76, כותרות Jaccard). *נבחר על פני better-sqlite3 שדרש VS Build Tools.*
- **Python 3** — rembg (הסרת רקע, u2net), colorthief (חילוץ פלטה), cairosvg (המרת SVG).

**יצירת תמונות**
- **OpenAI gpt-image** (ברירת מחדל) דרך `scripts/openai_image.js`.
- **Replicate** (Flux / Recraft / Ideogram) דרך `scripts/replicate_image.js` — *חסום בטוקן*, נופל חזרה ל-gpt-image.

**שיפור תמונה (מקומי, ללא API)**
- **Real-ESRGAN** (`realesrgan-ncnn-vulkan`) — upscaling. **rembg** — הסרת רקע ללוגו. צינור נעול: rembg → upscale.

**עיצוב & MCP**
- **Canva MCP** — יצירת designs, editing transactions, export. **Figma MCP** (OAuth connector) — anchor ל-design-system (רדום עד שייווצר קובץ).

**אפליקציית לקוח עתידית (אם תיבנה):** Frontend / Backend / Auth / Storage — עדיין TBD.

**פקודות:** אין build/test/lint פורמליים עדיין. בדיקת script בודד: `node scripts/<name>.js --help`-style args. בדיקת end-to-end: הרצת `/banner-create`.

## אינטגרציות

- **Canva** (MCP) — יצירה ועריכה של designs: editing transactions, export ל-PNG, ניהול תיקיות/brand kits, העלאת assets, פעולות עריכה תוכניתיות.
- **OpenAI** — gpt-image לרקעים (ללא טקסט; הטקסט מתווסף ב-Canva native לתמיכת RTL).
- **Replicate** (MCP/CLI) — מודלי תמונה נוספים (Flux / Recraft / Ideogram). *חסום בטוקן — נופל חזרה ל-gpt-image.*
- **Figma** (MCP, official OAuth connector) — anchor ל-design-system per-vertical. רשום + מאומת חי; רדום עד שייווצר קובץ design-system.
- **rembg** + **Real-ESRGAN** — שיפור לוגו מקומי (ללא API).
- *(מתוכנן, חסום בטוקן: **Unsplash** — סטוק images.)*

## מבנה `.claude/`

תחת `.claude/` יושבים agents, skills ו-slash commands מותאמים לפרויקט הזה:

- `.claude/agents/` — **banner-orchestrator** (ראשי) + **brand-researcher** + **copywriter** + **canva-designer**.
- `.claude/skills/` — visual-design-principles, advanced-color-theory, photography-composition, marketing-thinking, hospitality-copywriting (+ obsidian-* מובנים).
- `.claude/commands/` — `/banner-create`.

## תיעוד (Obsidian vault)

תיעוד טכני מלא יושב ב-`vault/` (נפתח ב-Obsidian) — קובץ topic לכל artifact, עם Overview + Session Log. נקודות כניסה: [[architecture-overview]] (מפת המערכת), `vault/Meeting Notes/_index.md`, `vault/Brand Guidelines/_index.md`. ה-vault מסונכרן אוטומטית דרך hook (ראה [[vault-sync-hook]]). **לעדכן את ה-vault אחרי כל שינוי קוד.**
