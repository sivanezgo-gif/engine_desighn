---
name: visual-design-principles
description: >
  Color theory, composition, typography, and banner/header design principles for hospitality.
  Use this skill when generating visual direction options, writing OpenAI image prompts,
  or composing Canva designs. Covers 310×600 banner constraints, 1366×200 header constraints,
  contrast rules, hierarchy, and common hospitality design patterns.
---

# Visual Design Principles — EzGo Banner & Header

This skill guides visual decision-making in the `canva-designer` agent across all phases:
directions, image prompts, and Canva composition. Apply it to produce designs that are
professional, brand-consistent, and legible at their final display size.

---

## 1. Format Constraints

### Banner — 310 × 600 px (portrait)
- **Aspect ratio:** ~0.52 — tall and narrow, like a smartphone screen
- **Primary real estate:** Top 40% (logo + headline), Middle 30% (supporting imagery), Bottom 30% (CTA or decoration)
- **Logo zone:** Top 15–20% — reserve clear space; logo should not exceed 40% of banner width
- **Text zone:** Never place text over busy imagery — use a semi-transparent overlay or solid band
- **Safe margin:** 12px on all sides minimum (EzGo UI padding)
- **Legibility test:** Headline must be readable at 50% zoom (≈155×300 px preview size)

### Header — 1366 × 200 px (landscape)
- **Aspect ratio:** ~6.83 — very wide and short
- **Primary challenge:** Most of the image will be seen only in the center-left 40%; right side fades to edge
- **Text zone:** Left-aligned (LTR) or right-aligned (RTL) — never centered in headers (too wide)
- **No logo** — header carries only headline + background
- **Crop awareness:** When generating the background (2304×800), important content must be in the **central horizontal third** — top and bottom thirds will be cropped after resize
- **Safe margin:** 24px top/bottom, 48px left/right

---

## 2. Color Theory for Hospitality Banners

### Color Roles
Every design needs 3 color assignments before Canva composition:

| Role | Description | Source |
|------|-------------|--------|
| **Background** | The dominant image/gradient color | `brand_profile.colors.primary` + context |
| **Accent** | Buttons, lines, highlights | `brand_profile.colors.secondary` |
| **Text** | Headline and supporting copy | Always high contrast against background |

### Contrast Rules (Accessibility Minimum)
- **Text on background:** WCAG AA = 4.5:1 minimum contrast ratio
- **Quick rule:** White text works on any color darker than `#595959`; black text works on any color lighter than `#767676`
- **Never use:** Yellow text on white, red on green, light grey on white

### Contrast Pairs That Work in Hospitality

| Background | Text color | Feel |
|-----------|-----------|------|
| Deep navy `#0A2342` | White `#FFFFFF` | Premium, marine |
| Forest green `#1A4D2E` | Cream `#F5F0E8` | Nature, eco |
| Sand `#D4B896` | Dark brown `#3E2723` | Desert, earth |
| Charcoal `#2C2C2C` | Gold `#C9A84C` | Luxury, city |
| Warm white `#FAF7F2` | Deep teal `#1A5276` | Clean, spa |
| Terracotta `#C25A3D` | Off-white `#FDF8F3` | Mediterranean, heritage |

### Common Mistake — "Generic Blue"
If `brand_profile.colors.needs_user_confirmation == true`, the extracted color is likely
a generic ocean/sky blue from the OG image background, not the actual brand color.
**Do not use this as the primary background.** Ask the orchestrator to confirm with the user.

---

## 3. Visual Direction Templates

When generating 3 directions in `phase=directions`, each direction must have:
- `name` — 2-3 words max
- `description` — 2 sentences, design intent
- `palette` — 2-3 hex colors
- `background_keywords` — 5-8 words for OpenAI image prompt

### Direction Archetypes for Hospitality

**Archetype A — "Immersive Scene"**
Full-bleed photorealistic background that places the viewer IN the experience.
Good for: marine, nature, outdoor, adventure.
```
palette: [primary_hex, white]
background_keywords: "dramatic [location], [time of day], wide angle, no people, cinematic"
text_treatment: white overlay with light shadow or semi-transparent dark band
```

**Archetype B — "Color Block + Accent"**
Bold solid color takes 60% of the banner; imagery or texture in remaining 40%.
Good for: luxury, wellness, cultural, modern brands.
```
palette: [primary_hex, secondary_hex, white]
background_keywords: "abstract [brand texture], minimal, geometric, [primary_color] tones"
text_treatment: high contrast text directly on solid color zone
```

**Archetype C — "Gradient Atmosphere"**
Soft gradient from primary to secondary color, possibly overlaid on a subtle texture.
Good for: romantic, family, accessible brands; safe fallback when brand imagery is weak.
```
palette: [primary_hex → secondary_hex gradient, white]
background_keywords: "soft gradient, [primary_color] to [secondary_color], subtle texture, abstract"
text_treatment: white text centered on gradient
```

---

## 4. OpenAI Image Prompt Construction

### Banner (1024 × 1984 px)
```
[SUBJECT]: {specific scene or mood — be concrete, not generic}
Style: professional hospitality photography, no text, no watermarks, no people's faces
Lighting: {golden hour | soft natural | dramatic | cool daylight}
Mood: {adventurous | serene | luxurious | warm | vibrant}
Colors: dominant {primary_hex description}, accent {secondary_hex description}
Composition: vertical portrait, key visual in upper-center third
Technical: high resolution, sharp details, 8k quality render
IMPORTANT: no text, no signs, no logos anywhere in the image
```

### Header (2304 × 800 px)
```
[SUBJECT]: {same scene as banner but wider, panoramic feel}
Style: professional hospitality photography, no text, no watermarks, no people's faces
Lighting: {same as banner for coherence}
Mood: {same as banner}
Colors: dominant {primary_hex description}, accent {secondary_hex description}
Composition: wide landscape panorama, IMPORTANT — main visual interest concentrated in the
             central horizontal third of the image; top and bottom thirds should be sky/ground/water
             that can be cropped without losing the key subject
Technical: high resolution, sharp details, 8k quality render
IMPORTANT: no text, no signs, no logos anywhere in the image
```

**Critical rule for header prompts:** The central-third concentration sentence is mandatory because
`scripts/resize.js` crops the header by taking `top: 137` pixels offset — anything in the outer thirds
will be cut. This must appear verbatim in every header prompt.

---

## 5. Typography Guidelines

Since Canva handles the actual font rendering, these are prompt/selection constraints:

### Font Selection from brand_profile
- If `brand_profile.fonts` contains Google Fonts names → pass the primary font name to Canva element
- If no fonts found → choose from safe defaults by vertical:

| Vertical | Hebrew font suggestion | English font suggestion |
|----------|----------------------|------------------------|
| Luxury / Premium | Frank Ruhl Libre, Noto Serif Hebrew | Playfair Display, Cormorant |
| Adventure / Sport | Rubik Bold, Heebo Bold | Montserrat Bold, Oswald |
| Family / Accessible | Assistant, Heebo | Nunito, Poppins |
| Wellness / Spa | Varela Round | Raleway, Quicksand |
| Marine / Outdoor | Rubik, Assistant | Bebas Neue, Raleway |

### Text Size Hierarchy on 310×600 Banner
- **Headline:** 28–36px (must be readable at half size)
- **Supporting text / tagline:** 14–18px (optional, keep to 1 line)
- **CTA button text:** 14–16px (if used)
- **Minimum text size:** 12px — never go below

### Text Size on 1366×200 Header
- **Headline:** 36–52px
- **Tagline:** 18–22px (optional)
- RTL: align text to the **right** edge with 48px margin
- LTR: align text to the **left** edge with 48px margin

---

## 6. Logo Placement on Banner

The logo appears **only on the banner** (not the header).

### Placement Rules
- **Position:** Top center or top-left (RTL: top-right)
- **Size:** 25–35% of banner width (78–109px wide on a 310px banner)
- **Background under logo:** If logo has no transparency, add a small white/light padding block (8px padding, rounded corners)
- **Clear space:** Equal to logo height on all sides — never let text or imagery crowd the logo
- **If logo is tall/narrow (wordmark):** Place at very top, full width, with bottom margin before headline

### Logo Sizing Sanity Check
- Minimum: 60px wide (below this it becomes unrecognizable)
- Maximum: 120px wide (above this it dominates the banner — reduce if needed)

---

## 7. Visual Quality Gates

Before returning composition to the orchestrator for Gate 4c, verify:

- [ ] **Dimensions correct:** banner exactly 310×600, header exactly 1366×200 (from sharp metadata)
- [ ] **No text in background image:** OpenAI prompt included "no text, no signs"
- [ ] **Text contrast passes:** Headline color contrasts sufficiently with background
- [ ] **Logo not clipping:** Logo fits within banner with safe margins
- [ ] **Header crop safe:** Key imagery is within central third of the background
- [ ] **RTL/LTR alignment correct:** Text element direction matches `chosen_copy.direction`
- [ ] **Brand colors used:** At least one of `primary` or `secondary` is visible in the design
- [ ] **Canva transaction committed:** No open `start-editing-transaction` without `commit` or `cancel`

---

## 8. Canva Editing Operations Order

For `phase=compose`, always follow this sequence inside the editing transaction:

1. **Set background** — upload background image asset, apply as page background
2. **Add text element** — headline with correct font, size, color, and RTL/LTR direction
3. **Add logo** — only on banner; position top zone; set size within limits
4. **Commit transaction** — only after all 3 operations succeed

If any operation fails:
- Log the error to `session.log`
- `cancel-editing-transaction` immediately
- Return error envelope to orchestrator for Gate 4c decision

---

## 9. Common Design Mistakes to Avoid

| Mistake | Why it fails | Fix |
|---------|-------------|-----|
| Text placed directly on busy photography | Legibility loss at small sizes | Add semi-transparent overlay behind text |
| Logo + text compete for top zone | Visual hierarchy collapses | Separate logo to top 20%, headline to middle 30% |
| Using 4+ colors in one design | Visual noise, looks amateur | Stick to 2-3 colors max per design |
| Generic stock-looking background | Brand feels forgettable | Write more specific, venue-anchored prompt |
| Both banner and header use identical crop | Repetitive look | Use different angle or time of day in prompt |
| Hebrew text left-aligned | Unnatural RTL reading | Always right-align Hebrew elements |
| Logo at full bleed width | Looks stretched/unprofessional | Cap logo width at 35% of banner width |
