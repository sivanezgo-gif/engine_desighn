---
name: hospitality-copywriting
description: >
  Headline formulas, emotional triggers, and RTL/Hebrew writing guidelines for EzGo banner copy.
  Use this skill when generating or evaluating headline options for a hospitality venue banner.
  Covers 3 required styles (direct / emotional / adventurous), Hebrew RTL rules, word count
  constraints, and quality checklist.
---

# Hospitality Copywriting — Banner & Header Headlines

This skill guides the generation of short, high-impact headlines (4–8 words) for EzGo Hospitality
banners and headers. Apply it inside the `copywriter` agent when operating in `mode=generate`.

---

## 1. The 3 Required Styles — Explained

Every generation round produces exactly one headline per style.

### Style 1 — Direct
**What it is:** Factual, action-oriented, conversion-focused. Tells the user exactly what to do or get.
**Register:** Confident, imperative or declarative.
**Structure patterns:**
- `[Verb] + [Object]` → "הזמינו חוויה ימית"
- `[Adjective] + [Experience] + [CTA]` → "Book your perfect getaway"
- `[The best] + [X] + [in Y]` — avoid unless brand explicitly positions on ranking

**Hebrew examples (RTL):**
- "הזמינו חוויה בלתי נשכחת" ✓
- "גלו את הים מקרוב" ✓
- "הפלגות יוקרה — הזמינו עכשיו" ✓

**English examples:**
- "Book your sea adventure today" ✓
- "Sail, explore, remember" ✓

**Avoid:** Exclamation marks, superlatives without proof, vague CTAs ("click here", "learn more")

---

### Style 2 — Emotional
**What it is:** Evocative, sensory, creates a feeling before the user commits to anything.
**Register:** Warm, inviting, present-tense or second-person.
**Structure patterns:**
- `[Sensation/feeling] + [awaits]` → "הרגשה שחוזרת אליך"
- `[The place where] + [emotion]` → "Where the sea meets calm"
- `[Possessive invitation]` → "הים שלך מחכה"

**Hebrew examples (RTL):**
- "הים מחכה לכם" ✓
- "רגעים שנשארים לנצח" ✓
- "הרגישו את החופש האמיתי" ✓
- "שם שהלב יודע" ✓

**English examples:**
- "Where the horizon is yours" ✓
- "Feel the pull of open water" ✓

**Avoid:** Clichés ("magical moments", "unforgettable memories" without specificity), passive voice

---

### Style 3 — Adventurous
**What it is:** Bold, energetic, motion-forward. Appeals to identity — the kind of person who DOES this.
**Register:** Punchy, sometimes fragmented, high energy.
**Structure patterns:**
- `[Verb]. [Verb]. [Verb].` → "Sail. Discover. Repeat."
- `[Challenge]` → "Not your average getaway"
- `[Identity statement]` → "ימי ים. זה מי שאתם."

**Hebrew examples (RTL):**
- "לחוות. לצאת לדרך. לחזור." ✓
- "ימי ים. רגעים שחוזרים אליך." ✓
- "צאו למסע. עכשיו." ✓

**English examples:**
- "Set sail. Make it count." ✓
- "The sea doesn't wait." ✓
- "Go beyond the shore." ✓

**Avoid:** Generic action words that fit any brand ("explore", "discover" alone with no context)

---

## 2. Hebrew RTL Writing Rules

When `brand_profile.language == "he"` or `direction == "rtl"`:

### Word Order
- Hebrew headline word order follows the **noun phrase structure** — adjective after noun in many cases
- Avoid direct translation from English — re-compose in natural Hebrew
- ❌ "בלתי נשכחת חוויה" (awkward) → ✓ "חוויה בלתי נשכחת"

### Word Count in Hebrew
- Hebrew words carry more meaning per word than English
- **4 Hebrew words ≈ 6–7 English words** in impact
- Target 3–6 Hebrew words (not 4–8 as in English) for equal visual weight

### Vowels and Clarity
- Avoid words that are ambiguous without nikud (vowel marks) — Canva renders unvowelized Hebrew
- Test mentally: can this be misread? If yes, choose a less ambiguous synonym

### Formal vs. Informal Register
| Audience | Register | Example |
|----------|---------|---------|
| Family, general public | Informal plural (אתם) | "בואו לחוות" |
| Luxury / boutique | Formal | "מוזמנים לגלות" |
| Young adults / adventure | Casual | "יוצאים לדרך?" |
| Business travelers | Neutral formal | "חוויה עסקית מושלמת" |

Use `brand_profile.target_audience` and `tone` to choose register.

---

## 3. Headline Quality Checklist

Before returning options to the orchestrator, verify each headline:

- [ ] **Word count:** 4–8 words (English) / 3–6 words (Hebrew)
- [ ] **No punctuation** except minimal commas — no exclamation marks, no ellipsis (unless adventurous style)
- [ ] **Specific to the venue's vertical** — could not apply to any random hotel
- [ ] **Respects tone** from `brand_profile.tone`
- [ ] **Language matches** `brand_profile.language` — no code-switching unless brand explicitly is bilingual
- [ ] **Style is distinct** from the other two options — if two feel similar, regenerate one
- [ ] **Passes the "say it aloud" test** — it should sound natural when spoken

---

## 4. Headline Prompt Template (Internal)

Use this structure when generating headlines internally:

```
Business: {business_name} — {business_type}
Vertical: {vertical_inferred from business_type}
Language: {language} ({direction})
Tone: {tone}
Target audience: {target_audience}
Primary color feel: {extracted color — warm/cool/neutral}

Generate 3 headlines:
1. DIRECT style — action-oriented, 4-8 words, in {language}
2. EMOTIONAL style — evocative, sensory, 4-8 words, in {language}
3. ADVENTUROUS style — bold, energetic, 4-8 words, in {language}

Rules:
- No punctuation except commas
- No clichés (see forbidden list)
- Each style must feel distinctly different
- Hebrew: use natural word order, avoid ambiguous unvowelized words
```

---

## 5. Forbidden Phrases List

These are overused in hospitality and should be avoided unless the brand explicitly uses them:

**Hebrew:**
- ברוכים הבאים (too generic)
- חוויה בלתי נשכחת (cliché)
- מושלם לכל המשפחה (bland)
- הטוב ביותר (unprovable without context)
- נופש מושלם (flat)

**English:**
- "Unforgettable experience" (cliché)
- "World class" (no proof)
- "The best of" (superlative without anchor)
- "Welcome to" (dead opener)
- "Where memories are made" (extremely overused)
- "Experience luxury" (vague)

---

## 6. Regeneration Logic

When the user selects "הצג 3 חדשות" (regenerate):

1. **Do not repeat** any headline from the previous round
2. **Shift the angle** — if previous round focused on the activity, shift to the feeling; if on the place, shift to the person
3. **Increase specificity** — use more concrete sensory language or location-specific details from `brand_profile`
4. **Maximum 3 regeneration rounds** — after the 3rd refusal, flag to orchestrator: brand profile may need refinement

---

## 7. chosen_copy.json Output Format

After the user selects a headline, the copywriter writes:

```json
{
  "schema_version": "1.0",
  "session_id": "{session_id}",
  "headline": "{selected headline, exact text}",
  "language": "he | en",
  "direction": "rtl | ltr",
  "style": "direct | emotional | adventurous",
  "rejected_alternatives": ["{option 2 text}", "{option 3 text}"]
}
```

The `direction` field is consumed by `canva-designer` for RTL/LTR text placement.
