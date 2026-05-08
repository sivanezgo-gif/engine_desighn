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

> **טרם הוחלט (TBD)**
>
> הסטאק יוגדר בהמשך לאחר בחירת:
> - Frontend framework (Next.js / Remix / וכו')
> - Backend & API
> - Database (PostgreSQL / Supabase / וכו')
> - אחסון נכסים (Storage)
> - Authentication
>
> יש לעדכן סעיף זה ולהוסיף פקודות build / test / lint לאחר הקמת הפרויקט.

## אינטגרציות

- **Canva** — אינטגרציה ליצירה ועריכה של עיצובים גרפיים. קיים MCP server פעיל של Canva
  בסביבת הפיתוח, המאפשר אוטומציה מלאה: יצירת designs, ייצוא לפורמטים שונים, ניהול
  תיקיות ו-brand kits, העלאת assets, וביצוע פעולות עריכה תוכניתיות.

## מבנה `.claude/`

תחת `.claude/` יושבים agents, skills ו-slash commands מותאמים לפרויקט הזה:

- `.claude/agents/` — subagents ייעודיים (לדוגמה: agent ליצירת brand kit, agent לייצור גרפיקה אוטומטית).
- `.claude/skills/` — skills מותאמים (לדוגמה: skill לעבודה מול Canva MCP, skill לוולידציה של נכסי מותג).
- `.claude/commands/` — slash commands מותאמים (לדוגמה: `/new-brand`, `/generate-design`).
