---
name: marketing-thinking
description: >
  Brand positioning, competitive differentiation, and audience analysis for hospitality businesses.
  Use this skill when analyzing a brand profile, evaluating tone/voice, or assessing how a venue
  should be positioned for EzGo's booking platform. Covers hospitality verticals, value proposition
  frameworks, and audience segmentation.
---

# Marketing Thinking — Hospitality Brand Analysis

This skill provides structured marketing frameworks for analyzing and positioning hospitality venues
on the EzGo platform. Apply it when reading `brand_profile.json`, writing briefs, or choosing
visual/copy direction.

---

## 1. Brand Positioning Framework

Before generating copy or design direction, answer these 4 questions from the brand profile:

| Question | What to look for | Where to find it |
|----------|-----------------|-----------------|
| **Who is this for?** | Families, couples, adventure seekers, luxury travelers, locals | `target_audience`, `tone` |
| **What emotion does it sell?** | Safety, excitement, prestige, discovery, relaxation | `tone`, scraped headlines |
| **What is the core promise?** | Unique experience, best price, convenience, exclusivity | website tagline, FB bio |
| **What makes it different?** | Location, specialty activity, design, service, story | OG descriptions, images |

> If any of the 4 are unclear after research, the copywriter should **ask the user** before generating headlines.

---

## 2. Hospitality Verticals — Quick Reference

Each vertical has default emotional triggers and common pitfalls:

### 🌊 Marine / Water Activities
- **Triggers:** Freedom, adventure, unique memories, "once in a lifetime"
- **Colors tend toward:** Deep navy, turquoise, white, sand
- **Pitfall:** Generic "ocean blue" background can blend into every competitor — differentiate via the specific activity (diving vs. sailing vs. kayaking)
- **RTL note:** Short action verbs work well in Hebrew (הפלגה, צלילה, גלישה)

### 🏔️ Nature / Glamping / Outdoor
- **Triggers:** Escape, quiet, reconnection, off-grid luxury
- **Colors tend toward:** Forest green, terracotta, warm cream, dark wood tones
- **Pitfall:** "Nature" is overused — emphasize the specific landscape or the comfort angle ("glamping", not "camping")

### 🏖️ Beach / Resort
- **Triggers:** Relaxation, sun, family time, indulgence
- **Colors tend toward:** Coral, warm yellow, white, turquoise
- **Pitfall:** Overused stock imagery — look for brand-specific anchors (private beach, particular architecture)

### 🏛️ Cultural / Heritage / City
- **Triggers:** Discovery, authenticity, local pride, history
- **Colors tend toward:** Warm terracotta, ochre, dark charcoal, gold
- **Pitfall:** Too formal — balance "authentic" with "welcoming"

### 🍽️ Dining / Food Experience
- **Triggers:** Taste, social connection, celebration, indulgence
- **Colors tend toward:** Deep reds, warm orange, cream, olive
- **Pitfall:** Don't lead with "restaurant" — lead with the experience (family table, chef's story, local produce)

### 🧘 Wellness / Spa
- **Triggers:** Self-care, renewal, calm, premium quality
- **Colors tend toward:** Sage green, dusty rose, soft grey, white
- **Pitfall:** Too clinical — warmth and softness in copy matter more than features

---

## 3. Value Proposition Ladder

Use this to escalate from functional → emotional → identity-level positioning:

```
Level 1 — Functional:  "We offer [activity/service] in [location]."
Level 2 — Emotional:   "You will feel [emotion] when you [activity]."
Level 3 — Identity:    "You are the kind of person who [aspiration]."
```

**For EzGo banners, always aim for Level 2 minimum.**
Level 3 works best for adventure/glamping/wellness verticals.

Examples for marine venue:
- ❌ Level 1: "Boat tours in Caesarea harbor"
- ✓ Level 2: "הים מחכה לכם" / "Set sail on something unforgettable"
- ✓ Level 3: "ימי ים. רגעים שחוזרים אליך." / "You weren't made to stay on shore."

---

## 4. Tone Keywords → Visual Direction Mapping

The copywriter and designer should use consistent emotional language:

| Tone keyword (from brand_profile) | Visual direction hints | Copy register |
|-----------------------------------|----------------------|---------------|
| `adventurous` | Bold colors, motion, diagonal lines, dramatic skies | Verbs first, active voice, short punchy sentences |
| `family-friendly` | Warm palette, soft gradients, open space, people/groups | Inclusive "you" (plural), safety cues, warmth |
| `luxury / premium` | Dark rich backgrounds, gold accents, minimal text, elegant typography | Formal, aspirational, no discounts |
| `romantic` | Warm sunset tones, soft textures, blur effects | Sensory details, intimate "you" (singular) |
| `local / authentic` | Earthy tones, textured backgrounds, place-specific imagery | Storytelling voice, Hebrew preference for Israeli brands |
| `eco / sustainable` | Natural greens, textures, organic shapes | Soft mission language, values-forward |

---

## 5. Competitive Differentiation Checklist

Before finalizing the brand profile summary (Gate 1), verify:

- [ ] Does the headline avoid generic hospitality clichés? ("ברוכים הבאים", "experience luxury", "the best in…")
- [ ] Does the visual direction say something specific about THIS venue — not any beach/nature/hotel?
- [ ] Is the color palette derived from the brand's own identity (not just the OG image's background)?
- [ ] Does the logo (or generated visual) look distinct at 310×600 banner scale?
- [ ] Is the tone consistent with the target audience's self-image?

---

## 6. Brand Profile Gap Analysis

When reading `brand_profile.json`, flag to the orchestrator if:

- `tone` is null or too generic ("nice", "good", "quality") — ask the user for 2-3 describing words
- `target_audience` is null — infer from vertical, then confirm with user
- `colors.needs_user_confirmation: true` — never proceed to design with unconfirmed generic colors
- `business_type` is null — critical for prompt construction; must ask user
- `research_sources` contains only `"manual"` — lower confidence profile; add extra context to all downstream prompts
