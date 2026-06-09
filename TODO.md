# TODO — EzGo Branding System

פיצ'רים ומשימות עתידיות. נוסף כשמשהו עולה תוך כדי עבודה ולא קריטי לעצור בשבילו.

---

## ממתין לביצוע

### חוסם עכשיו / עדיפות גבוהה

- [x] [2026-06-04] Canva: כל פעולות ה-compose אומתו חי ✅
  - הקשר: כל זרימת ה-compose אומתה מקצה-לקצה: generate-design → create-design-from-candidate → resize(310×600) → replace_text (עברית RTL) → format_text → **update_fill** (רקע) → **insert_fill** (לוגו) → commit → export → validate — הכול עבר, כולל `logo_size`. נותר רק: ריצת `/banner-create` אינטראקטיבית מלאה (פריט D4 נפרד למטה). ידוע: `font_family` לא ניתן להגדרה דרך ה-API (יורשים מהמועמד); כותרת ארוכה גולשת ועלולה לחפוף.
- [ ] [2026-06-04] Canva: בדיקת end-to-end מלאה של `/banner-create` (D4)
  - הקשר: ה-PostToolUse hook **אומת חי** מול export אמיתי + הוקשח (✅ commit `15c5eff`). נותר לאמת חי (אחרי תיקון Step 5c): רינדור ה-`preview` בשערים, יצירת 3 הוריאציות, הולידציה המלאה (contrast/logo/legibility) על PNG אמיתי, ואזהרות ה-cross-session (C4).
  - עדיפות: גבוהה
- [ ] [2026-06-04] Canva: ה-MCP מתנתק לסירוגין
  - הקשר: שרת העיצוב (`a51234ff…`) התנתק פעמיים במהלך העבודה (כולל אחרי restart — חזר רק בריענון נוסף). לעקוב; אם חוזר, לבדוק את הגדרת ה-connector.
  - עדיפות: בינונית

### חסום בטוקן (פעולת משתמשת)

- [ ] [2026-06-04] Infra: B1 — Replicate (מודלי תמונה נוספים)
  - הקשר: לכתוב `scripts/replicate_image.js` (אותו ממשק `--prompt/--size/--out` כמו openai_image.js, כולל אותו fallback ל-`.env` הראשי) + לרשום Replicate MCP, כדי להפעיל flux/recraft/ideogram. כרגע canva-designer נופל ל-gpt-image. חסום עד פתיחת חשבון Replicate + `REPLICATE_API_TOKEN`.
  - עדיפות: בינונית
- [ ] [2026-06-04] Infra: B2 — Unsplash (תמונות סטוק)
  - הקשר: Unsplash MCP לתמונות reference בכיווני העיצוב ול-fallback כשאין og:image. חסום עד פתיחת חשבון + `UNSPLASH_ACCESS_KEY`.
  - עדיפות: בינונית

### לא חסום — אפשר מתי שנרצה

- [ ] [2026-06-04] Brand: לבנות קובץ design-system ב-Figma
  - הקשר: ה-Figma MCP מאומת חי אבל הקובץ `EzGo-Brand-System` ריק. ה-anchor האופציונלי ב-brand-researcher נשאר רדום עד שיהיו שם פלטות / טיפוגרפיה / קומפוננטות. (חשבון View/Starter — ייתכן שיגביל קריאות Dev-Mode.)
  - עדיפות: בינונית
- [ ] [2026-06-04] Infra: למזג את הענף `claude/objective-bassi-3b3072` ל-main
  - הקשר: כל עבודת Phase A–D יושבת על ה-feature branch (~15 קומיטים מעל origin/main). למזג / לפתוח PR אחרי שבדיקת D4 עוברת.
  - עדיפות: בינונית
- [ ] [2026-06-04] Brand: כיול ספי ΔE / Jaccard לפי vertical
  - הקשר: ספי ה-cross-session (פלטה ΔE<10, כותרת Jaccard≥0.7) הם ברירת מחדל גלובלית; ייתכן שיצטרכו כוונון פר-תחום כשיהיו 5+ לקוחות (ראה `cross-session-consistency`).
  - עדיפות: נמוכה
- [ ] [2026-06-04] DX: סקריפט עזר `scripts/color.js` (hex↔HSL, סיבוב גוון, ניגודיות)
  - הקשר: skill ה-advanced-color-theory עושה חישובי HSL/ΔE ידנית; helper ייעודי יוסיף דיוק אם זה יהפוך למטריד. לא דחוף.
  - עדיפות: נמוכה
- [ ] [2026-06-04] Brand: פילטר צבע גנרי (כחול שמיים/אוקיינוס) — אופציונלי
  - הקשר: כרגע מטופל ע"י הדגל `needs_user_confirmation` + שער משתמש; רשימת פילטר קשיחה היא שיפור אופציונלי (architecture-overview שאלה D4).
  - עדיפות: נמוכה

---

## פורמט להוספה

```
- [ ] [YYYY-MM-DD] קטגוריה: תיאור קצר
  - הקשר: למה זה עלה / מאיפה זה בא
  - עדיפות: גבוהה / בינונית / נמוכה
```

## קטגוריות מוצעות

- `Banner` — באנרים ועיצוב גרפי
- `Brand` — ניהול נכסי מותג
- `Infra` — תשתית, CI, סקריפטים
- `Canva` — אינטגרציה עם Canva
- `DX` — חווית פיתוח, tooling
- `Docs` — תיעוד

---

## הושלם

תכנית השדרוג בת 4 השלבים (`plans/eager-mixing-mountain`) — הושלמה פרט ל-D4 + חסומי-הטוקן שלמעלה:

- [x] [2026-06-04] **Phase A** — תשתית: SQLite brand registry (`brand_db.js`), migration, settings, Obsidian auto-sync hook (A4).
- [x] [2026-06-04] **Phase B (חלקי)** — rembg + Real-ESRGAN; image enhancement + `image_model` מחווטים ל-agents; Figma MCP רשום + מאומת חי (OAuth connector). *(B1 Replicate + B2 Unsplash חסומים בטוקן — למעלה.)*
- [x] [2026-06-04] **Phase C** — ולידציה אוטומטית (`validate_export.js` + PostToolUse hook); 3 וריאציות + שער בחירה (4d); שערים חזותיים; cross-session חי (אזהרות פלטה + כותרת).
- [x] [2026-06-04] **Phase D** — 2 skills (advanced-color-theory, photography-composition); עדכון architecture-overview + cross-session-consistency + CLAUDE.md (סטאק).
- [x] [2026-06-04] תיקון: `openai_image.js` נופל ל-`.env` של הריפו הראשי (עובד מה-worktree).
