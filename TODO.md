# TODO — EzGo Branding System

פיצ'רים ומשימות עתידיות. נוסף כשמשהו עולה תוך כדי עבודה ולא קריטי לעצור בשבילו.

---

## ממתין לביצוע

### חוסם עכשיו / עדיפות גבוהה

- [x] [2026-06-04] Canva: כל פעולות ה-compose אומתו חי ✅
  - הקשר: כל זרימת ה-compose אומתה מקצה-לקצה: generate-design → create-design-from-candidate → resize(310×600) → replace_text (עברית RTL) → format_text → **update_fill** (רקע) → **insert_fill** (לוגו) → commit → export → validate — הכול עבר, כולל `logo_size`. נותר רק: ריצת `/banner-create` אינטראקטיבית מלאה (פריט D4 נפרד למטה). ידוע: `font_family` לא ניתן להגדרה דרך ה-API (יורשים מהמועמד); כותרת ארוכה גולשת ועלולה לחפוף.
- [ ] [2026-06-30] Infra: להוסיף הרשאה ל-`gemini_image.js` ב-`.claude/settings.json` (פעולת משתמשת)
  - הקשר: צריך `"Bash(node scripts/gemini_image.js:*)"` ב-allow-list (ליד `openai_image.js`). ה-auto-classifier חסם ל-Claude לערוך הרשאות, אז זה ידני. בלי זה canva-designer יקבל prompt הרשאה בכל ריצת ננו בננה. הסקריפט עצמו רץ תקין.
  - עדיפות: גבוהה
- [x] [2026-07-01] Infra: למזג/לדחוף את `nano-banana` → `main` ב-GitHub ✅ בוצע
  - הקשר: סיון דחפה ידנית `git push origin main` ב-2026-07-02 — origin/main מסונכרן (607a4fc). אפשר למחוק את `nano-banana` ב-GitHub (כבר ממוזג).
- [x] [2026-07-02] Infra: זוהתה + נפתרה בעיית הרשאות push ל-GitHub ✅ תוקן
  - הקשר: חשבון ה-git המקומי (`sivanwozner-cyber`) לא היה collaborator בריפו `sivanezgo-gif/engine_desighn` — זו הסיבה האמיתית לכישלון "must be a collaborator" ביצירת PR **וגם** ל-403 בדחיפה ישירה. סיון הוסיפה את `sivanwozner-cyber` כ-collaborator ב-GitHub (Settings → Collaborators) — דחיפת ענף `fix-fabricated-building` הצליחה מיד אחרי. **מצביע לעתיד:** אם push/PR נכשל שוב עם שגיאת הרשאות, לבדוק קודם collaborator status, לא רק את מבנה הענפים.
- [x] [2026-07-02] Banner: מבנים בדויים (AI-invented buildings) נאסרו במצב full ✅ תוקן
  - הקשר: סיון זיהתה שהבאנר וההדר הראשונים של המושבה כללו מבנה אבן פוטוריאליסטי מומצא — עלול להטעות גולש לגבי איך המקום נראה באמת. **תוקן:** תבניות ה-prompt המלאות ב-`canva-designer` אוסרות מפורשות המצאת מבנים/בתים/גגות אלא אם `background_keywords` מציין בפירוש מבנה **מאומת** של הלקוח; גם נאסרה שכפול אלמנטי טקסט (תוקן גם bug של CTA כפול). `design-qa` קיבל בדיקה **H — No fabricated building** (blocking, `fabricated_building`) + `duplicate_text_element` (minor) בבדיקה G. הסט הסופי של המושבה חודש (נוף בלבד) ואומת. נדחף לענף `fix-fabricated-building` — ממתין ל-PR merge.
- [~] [2026-07-01] Banner: D4 — ריצת `/banner-create` מלאה עם **ננו בננה (מצב full)** — **הזרימה עובדת**, נותרו תיקוני אינטגרציה
  - הקשר: הורץ חי מקצה-לקצה על לקוח "המושבה" (main-thread orchestration): מחקר → לוגו → כותרת → כיוון → **עיצוב מלא (עברית+לוגו+CTA)** → resize → validate = **pass**. הפלט ברמת סטודיו, עברית מושלמת. נותר: (א) ריצה אוטומטית דרך ה-orchestrator (ראה ממצא F1 למטה — כרגע חייב main-thread), (ב) יצירת 3 וריאציות אוטומטית ב-canva-designer, (ג) `design-qa` אוטומטי.
  - עדיפות: גבוהה
- [x] [2026-07-01] F1 — ה-orchestrator חייב לרוץ מה-thread הראשי ✅ תוקן
  - הקשר: הפקודה `/banner-create` דיפצ'תה את `banner-orchestrator` כ-subagent, אבל sub-agent לא יכול לפתוח שערים למשתמש ולא לקנן sub-agents. **תוקן:** שוכתבה `banner-create.md` כך שהסוכן הראשי מריץ את פרוטוקול ה-orchestration ישירות (מדפצ'ת רק את 3 ה-workers), + הבהרת "מודל הרצה" בראש `banner-orchestrator.md`. נותר לאמת ב-`/banner-create` אמיתי.
- [x] [2026-07-01] F2 — יצירת לוגו הועברה מ-Canva לננו בננה ✅ תוקן
  - הקשר: מסלול Canva ל-Branch B היה שבור (חסרים כלי export). **תוקן:** `brand-researcher` Branch B משוכתב להשתמש ב-`gemini_image.js` (3 סגנונות → נתיבים מקומיים, בלי URLs שפגים) + rembg לשקיפות + EXIF disclosure. אומת חי (סמל המושבה).
- [x] [2026-07-01] F3 — `gemini_image.js` exit crash (libuv/Windows) ✅ תוקן
  - הקשר: `process.exit(0)` אחרי fetch הפעיל assertion של libuv לסירוגין. **תוקן:** `cleanExit()` — מגדיר `exitCode` ונותן ל-event loop להתנקז טבעית; timer מושהה (unref) יוצא רק אחרי חלון שקט. נבדק (exit 0, בלי crash, בלי hang). קוראים חדשים מסתמכים על שורת ה-JSON.
- [ ] [2026-06-04] Canva: ה-MCP מתנתק לסירוגין
  - הקשר: שרת העיצוב (`a51234ff…`) התנתק פעמיים במהלך העבודה (כולל אחרי restart — חזר רק בריענון נוסף). לעקוב; אם חוזר, לבדוק את הגדרת ה-connector.
  - עדיפות: בינונית

### חסום בטוקן (פעולת משתמשת)

- [ ] [2026-06-04] Infra: B1 — Replicate (מודלי תמונה נוספים)
  - הקשר: לכתוב `scripts/replicate_image.js` (אותו ממשק `--prompt/--size/--out` כמו openai_image.js, כולל אותו fallback ל-`.env` הראשי) + לרשום Replicate MCP, כדי להפעיל flux/recraft/ideogram. **דורג מטה (2026-06-30):** ננו בננה (Gemini) הוא עכשיו מנוע ברירת המחדל ובעל יכולת עיצוב-מלא, כך ש-Replicate הפך לתוספת אופציונלית בלבד — לא נחוץ לזרימה. חסום עד פתיחת חשבון Replicate + `REPLICATE_API_TOKEN`.
  - עדיפות: נמוכה
- [ ] [2026-06-04] Infra: B2 — Unsplash (תמונות סטוק)
  - הקשר: Unsplash MCP לתמונות reference בכיווני העיצוב ול-fallback כשאין og:image. חסום עד פתיחת חשבון + `UNSPLASH_ACCESS_KEY`.
  - עדיפות: בינונית

### לא חסום — אפשר מתי שנרצה

- [ ] [2026-06-04] Brand: לבנות קובץ design-system ב-Figma
  - הקשר: ה-Figma MCP מאומת חי אבל הקובץ `EzGo-Brand-System` ריק. ה-anchor האופציונלי ב-brand-researcher נשאר רדום עד שיהיו שם פלטות / טיפוגרפיה / קומפוננטות. (חשבון View/Starter — ייתכן שיגביל קריאות Dev-Mode.)
  - עדיפות: בינונית
- [x] [2026-06-04] Infra: למזג את הענף `claude/objective-bassi-3b3072` ל-main ✅ בוצע
  - הקשר: אומת 2026-07-02 — הענף כבר ממוזג במלואו ל-main המקומי; הענף המקומי ושאריות ה-worktree (~70MB) נוקו.
- [ ] [2026-06-04] Brand: כיול ספי ΔE / Jaccard לפי vertical
  - הקשר: ספי ה-cross-session (פלטה ΔE<10, כותרת Jaccard≥0.7) הם ברירת מחדל גלובלית; ייתכן שיצטרכו כוונון פר-תחום כשיהיו 5+ לקוחות (ראה `cross-session-consistency`).
  - עדיפות: נמוכה
- [ ] [2026-06-04] DX: סקריפט עזר `scripts/color.js` (hex↔HSL, סיבוב גוון, ניגודיות)
  - הקשר: skill ה-advanced-color-theory עושה חישובי HSL/ΔE ידנית; helper ייעודי יוסיף דיוק אם זה יהפוך למטריד. לא דחוף.
  - עדיפות: נמוכה
- [ ] [2026-06-04] Brand: פילטר צבע גנרי (כחול שמיים/אוקיינוס) — אופציונלי
  - הקשר: כרגע מטופל ע"י הדגל `needs_user_confirmation` + שער משתמש; רשימת פילטר קשיחה היא שיפור אופציונלי (architecture-overview שאלה D4).
  - עדיפות: נמוכה
- [ ] [2026-06-30] DX: לשנות שם `openai_call_count` → שם גנרי (`image_call_count`)
  - הקשר: המונה סופר עכשיו קריאות ננו בננה אבל עדיין נושא שם OpenAI. נגיעה ב-`banner-orchestrator` + `orchestration-protocol` (state shape + state_patch). קוסמטי בלבד.
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

### 2026-06-30 — הגירה לננו בננה (Gemini) במקום gpt-image

- [x] **מנוע**: `scripts/gemini_image.js` חדש (Nano Banana Pro, `gemini-3-pro-image-preview`) — תומך `--ref` (תמונות-ייחוס) ומיפוי `--size`→aspect. החליף את gpt-image כברירת מחדל. **נבדק חי** — רינדור עברית תקין (RTL, איות).
- [x] **מצב full**: `canva-designer` מרנדר עיצוב שלם כולל עברית; `design_mode:"background"` (gpt-image+Canva) נשאר fallback. invariant #1 (RTL) נכתב מחדש; `design-qa` מאמת עברית בתמונה (`hebrew_render_bad`).
- [x] **`resize.js`**: באנר → `fit:'cover'` (לא מעוות טקסט צרוב); הדר → crop ממורכז דינמי. אומת חי על פלט ננו בננה.
- [x] **לוגו**: ה-orchestrator שומר `logo_local_path` ומעביר אותו כ-`--ref` ל-canva-designer.
- [x] **vault**: הזיכרון עבר ל-`banner_create/` ונכנס ל-git (ללא `.obsidian/`); `CLAUDE.md` + `sync_vault.js` + סקיל + `.gitignore` מצביעים אליו.
- נדחף לענף `nano-banana` (PR ל-main).
