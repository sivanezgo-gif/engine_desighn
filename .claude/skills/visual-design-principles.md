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

## 4. Image Prompt Construction

> **Mode note:** the **default** engine is now Nano Banana in **full-design mode** — it renders the Hebrew headline + logo INTO the image, using the full-design prompt templates in `canva-designer` (Phase backgrounds) and `examples/` as style references. The "no text / no logos" templates **below apply only to `design_mode: "background"`** (the gpt-image / Replicate fallback, where Canva adds the Hebrew afterward).

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
- [ ] **Text handling per mode:** *full mode* → the rendered Hebrew is correct (spelling, RTL, intact letters); *background mode* → image prompt included "no text, no signs" and carries no baked text
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

## 9. Style Guide — מהדוגמאות של סיון (examples/)

> נגזר מניתוח `examples/banner/` + `examples/header/` + `examples/general/` (תצוגות deployment) —
> זהו הסגנון המועדף על הלקוח. כשיש התנגשות בין הנחיה כאן לבין הנחיה כללית בסקשן אחר — עדיפות לסקשן הזה.

### 9.0 Quick Checklist — verify before every generation

Scan this first; the subsections explain each item.

- [ ] **Palette leads with the venue's own brand colors** (§9.2). Fallback tendencies only if brand colors are missing/weak. Caesarea navy ≠ system default.
- [ ] **Photography is real & place-specific** (§9.1) — Israeli venue, no generic stock, no people/faces, no text baked in. Aerial/drone angle is a favorite.
- [ ] **Composition pattern chosen by brand tone** (§9.3) — Editorial Split / Nature Full-Bleed / Minimal Type / Bottom Scrim Stack.
- [ ] **Booking CTA present — always** (§9.4, copywriting §0). "הזמינו אונליין" / "שריינו את המקום שלכם" is mandatory on every banner; EzGo has no awareness-only asset.
- [ ] **CTA coordinated with venue palette + themeable platform** (§9.2, §9.7), and legible over the photo behind it.
- [ ] **Banner:** logo baked top-corner with breathing room (§9.5); bottom dark scrim if full-bleed; enough internal contrast not to dissolve into the light-grey page.
- [ ] **Header:** NO baked logo — EzGo injects it **top-left** (§9.6). Keep the left clear; headline + CTA go right/center-right; minimal text; lots of negative space.
- [ ] **Headline weight matches intent** (§9.4) — bold for transactional, light/regular for refined/mood.
- [ ] **Banner + header coordinated but not identical** (§9.7) — same brand/palette/photo family, different crop and copy.
- [ ] **Final dimensions exact** — banner 310×600, header 1366×200 (§1, validated via sharp).

### 9.1 Photography & Backgrounds

- **Real, aspirational photography** — not generic stock. Vineyards, gardens, pools, desert landscapes, beaches, Sea of Galilee, Caesarea coastline. The photo must feel like it belongs to a specific place in Israel.
- **Aerial / drone angle is a strong favorite** — bird's-eye coastal and landscape shots (Caesarea sea-front) read as premium and distinctive. Mix overhead/aerial with eye-level; don't default to eye-level only.
- **Nature-forward:** water, greenery, stone, sand, sky — these are the dominant visual languages. Architecture appears as supporting context, not the hero.
- **Light:** soft natural daylight or hazy golden warmth. Avoid dramatic/moody night scenes unless the venue is explicitly nightlife.
- **No faces, no people.** (Already a system rule, but this client's examples reinforce it.)
- **Headers are often pure photography, no text, no overlay.** When text does appear it is sparse — a short white headline + CTA placed on the right / center-right, leaving the top-left clear for the EzGo-injected logo (full header rules in §9.6).

### 9.2 Color Palette Character

> **Per-venue branding always comes first.** This is a per-venue system: each venue's own
> extracted brand colors (`brand_profile.colors.primary` / `.secondary`) ARE the palette.
> The values below are *fallback tendencies* (when brand colors are missing or weak) and a
> description of the client's recurring taste — **not a fixed house palette to impose on every venue.**
> A desert venue leads with sand/earth, a vineyard with greens, a marine venue (like Caesarea) with navy.

Use these tendencies as defaults only when brand profile colors are missing or unconfirmed:

| Category | Values | Use |
|----------|--------|-----|
| Naturals | sand `#D4B896`, warm beige `#F0E6D0`, sage green `#7A8C6E`, sage muted `#9BA98A` | background zones, texture |
| Accents | gold `#B8936A`, wine/burgundy `#6B2D3E`, deep teal `#2A5C6E` | text, logo frames, buttons |
| Neutrals | clean white `#FFFFFF`, off-white `#FAF8F4`, cream `#F5F0E8` | text zones, white-band layouts |
| Sky/Water | hazy blue `#A8C4D4`, pool turquoise `#5BACD6`, sea turquoise `#3E8FA8` | backgrounds, headers |
| Deep Marine | navy `#14315C`, deep sea blue `#1B3A6B`, midnight `#0E1F3D` | premium coastal backgrounds, header base, bottom scrims |

**The booking CTA button — one coordinated system with the platform.** The EzGo platform buttons
are **themeable** (their color is configured per venue — they are not fixed navy). So the asset CTA
and the platform buttons should be set to **the same venue palette** and read as one branded system,
not compete. Across the client's portfolio the CTA leans to a warm gold/tan button
(`#B8936A`, range `#A88A5C`–`#C2A06E`) with dark text — gold is the venue's *warm accent* sitting on
top of a cooler primary (navy for Caesarea).
- Pick the CTA color from the venue's palette — typically the **warm accent**, so it stays a high-affordance focal point against the background photo.
- Coordinate it with the platform button theme (see §9.7) so the whole page feels like one brand.
- The CTA still needs clear button affordance and contrast **against the photo behind it** — that legibility requirement is separate from, and survives, any platform theming.
- **Finish: glossy/metallic, not flat.** Client preference (confirmed live, 2026-07-02) — give the CTA button a subtle glossy/metallic sheen (a bright specular highlight streak across the top, soft reflective shine, premium polished-metal look) rather than a flat matte fill. Applies to every banner CTA by default, in full-design (Nano Banana) mode.

**Avoid:** bright saturated primaries (electric blue, fire red), gradients from one vivid color to another. (Note: a bottom-edge dark scrim for text legibility — see Pattern 4 — is fine and may exceed 40% locally; the 40% cap applies to overlays across the *whole* image.)

### 9.3 Composition Archetypes (Sivan's Preferred Patterns)

Beyond the generic archetypes in §3, these are the specific patterns visible in the examples:

**Pattern 1 — "Editorial Split"** *(Bar's Suites style — Banner7)*
Top half: clean white/cream zone with logo + Hebrew CTA.
Bottom half: lifestyle photography (food, wine, amenity close-up).
No overlay needed — white zone IS the text background.
```
use when: brand is premium boutique; logo is ornate/detailed
top_zone_height: 45–55% of banner
photo_subject: lifestyle detail (wine, coffee, linens, spa) not wide landscape
```

**Pattern 2 — "Nature Full-Bleed + Framed Logo"** *(חוות נועם / הגפן style)*
Full-bleed nature/landscape photo fills the banner.
Logo sits in a rounded-rectangle or circle frame (white or semi-transparent) at top.
Hebrew CTA in a distinct button or colored band.
```
use when: venue has strong nature/landscape identity
logo_frame: rounded rect, 8px radius, white fill, 8px padding
cta_placement: middle or lower-middle band
```

**Pattern 3 — "Minimal Type on Light Photo"** *(HYGGE style — Banner3)*
Bright, airy photography (indoor or outdoor, low saturation).
Large, light-weight headline dominates — minimal supporting text.
**Still keeps the booking CTA** (the EzGo asset always drives a booking — see copywriting §0); the
minimalism is in the *visual treatment*, not in dropping the call-to-action.
Logo either absent or very small and subtle.
```
use when: refined / mood-forward brand (wellness, boutique) — softer visual register, same booking goal
headline_weight: light or regular (not bold)
headline_size: 36–44px on banner
cta: present but understated (e.g. a slim gold/outline button or a quiet text link), not absent
color_palette: near-monochrome whites and light greys + the venue's warm accent for the CTA
```

**Pattern 4 — "Bottom Scrim Stack"** *(Caesarea style — Banner.png — a client favorite)*
Full-bleed aerial/landscape photo fills the whole banner.
Logo in the top corner (top-left is fine even in RTL — see §9.5).
A dark gradient scrim along the **bottom third** holds a stacked text block:
bold white headline → lighter white subtitle → gold CTA button.
```
use when: strong scenic photo + a clear booking call-to-action (transactional)
photo: full-bleed, aerial or wide landscape, the hero of the design
scrim: linear gradient, transparent at top → ~70% dark navy/black at very bottom
text_stack (bottom→up reading order): CTA button, subtitle (1 line), headline (1–2 lines)
headline_weight: BOLD white  ·  subtitle: regular, smaller, slightly muted white
cta: gold button (#B8936A) full-width or near-full-width, dark text, ~8px radius
```

> Patterns 3 and 4 differ in **visual register, not in goal** — both drive an online booking
> (the CTA is always present, per copywriting §0). **3 = soft/refined** (light type, understated CTA),
> **4 = bold/transactional** (bold type, prominent gold CTA). Pick by brand tone, never by "do we
> need a CTA" — the answer to that is always yes.

### 9.4 Typography Character

- **Mix of registers:** large/bold headline + small/light subtitle. The contrast between them creates hierarchy. Avoid flat, same-size text stacks.
- **Script accents are welcome** for warmth (handwritten taglines, "time to" style), but only as a small secondary element — never for the main headline.
- **English brand names** sit naturally alongside Hebrew — do not try to force everything into Hebrew. Pattern: Hebrew CTA + English brand name = standard.
- **"הזמינו אונליין"** (or a venue-fitting variant — "שריינו את המקום שלכם", "הזמינו עכשיו") is a **mandatory CTA element on every banner**. EzGo is a booking engine; there is no awareness-only banner (copywriting §0). It may be understated stylistically, but it is always present.
- **Headline weight is intent-driven, not fixed:**
  - *Mood / awareness* designs (Pattern 3) → **Regular or Light**, refined, not shouting.
  - *Transactional / booking* designs with a CTA (Pattern 4) → **Bold** white headline, for punch and legibility over photography.
- When a headline sits on photography without a white zone behind it, pair it with a scrim (Pattern 4) — never bold white text directly on a busy mid-tone photo.

### 9.5 Logo Treatment Observed

- Ornate, detailed logos (circular emblems, botanical illustrations) are common in this client's portfolio.
- Such logos need **breathing room** — a white or light frame/background under them, not placed directly on a busy photo.
- Logo size: medium — not dominant. The venue name (wordmark below the emblem) often appears separately as supporting text.
- **Top-corner placement, either side:** the client's examples place the emblem in a top corner — including **top-left even in RTL Hebrew designs** (Caesarea banner). The §6 default of "RTL → top-right" is a guideline, not a rule; top-left is acceptable and used here, especially with a circular emblem and a bottom-scrim text block.

### 9.6 Header Tendencies

Two header modes, both valid — pick by whether the header needs to drive a booking:

- **Mode A — Pure / minimal photo** (Header.jpg, Header6.png, Header3.jpeg): mostly photography, no text or a very sparse 2–4 word white headline, with generous empty sky/water/ground around it. Centered or off-center.
- **Mode B — Headline + gold CTA** (Header.png — Caesarea, a client favorite): deep-navy aerial sea photo; **right-aligned** bold white headline (RTL) + gold CTA button (`#B8936A`, "הזמינו אונליין") beneath it, both on the **right / center-right** (the left is left clear for the EzGo-injected logo); a soft **radial light bloom** balances the composition and gives the eye room to breathe.
- Either way — never crowd the header with a lot of text; the panoramic feel depends on negative space.
- The radial light-bloom trick (a soft bright glow on the empty side) is a reusable device to keep a wide, dark header from feeling heavy.

**⚠️ Do NOT bake a logo into the header.** EzGo injects the venue logo automatically (from the
venue's platform settings) and renders it in the **top-LEFT** corner of the header — confirmed across
4 live venues (HAKEREM, Caesarea, Zen, Omsta), logo top-left every time. Designing a logo into the
header would collide/duplicate. Therefore:
- The header carries **background + headline + CTA only** (this confirms the §2 / §6 "no logo on header" rule).
- **Keep the header's left zone clear and visually calm** — no critical headline text there — so the platform-injected logo on the left reads cleanly.
- Place the headline + CTA on the **right / center-right** (natural for RTL Hebrew, and away from the left-side injected logo).
- The logo *is* baked into the **banner** (designer adds it) — the no-bake rule is header-only.

### 9.7 Deployment Context — how assets sit inside the EzGo booking engine

Confirmed from a live final-result screenshot of the Caesarea venue. Design *for this frame*, not in isolation:

- **The platform chrome is themeable per venue** — confirmed across 4 live venues, each with a totally different theme: **HAKEREM** gold/champagne (luxury), **Caesarea** navy (marine), **Zen** teal + wine, **Omsta** green (spa). The search bar, date pickers, tabs, "בדוק זמינות" buttons and headings all take the venue's theme color. Navy was Caesarea's choice, not a platform constant. The page sits on a light-grey (`~#EFEFEF`) ground with white content cards.
- **Outcome 1 — asset + platform are one coordinated system.** Set the platform button theme and the asset CTA to the **same venue palette** so the whole page reads as a single brand. Don't design the asset CTA to fight the platform — tune them together (Caesarea: navy platform + navy/gold assets + gold CTA = unified).
- **Outcome 2 — the banner needs internal contrast against the light-grey page.** It sits in a narrow column on `~#EFEFEF`; the bottom dark scrim (Pattern 4) gives it a defined edge so it doesn't dissolve. (This is independent of theming — it's about the photo vs the page.)
- Caesarea happened to be navy + gold — fitting for a *marine* venue — but that is one venue's palette, not the system default. A desert or vineyard venue themes its platform and assets to its own earth/green colors and satisfies the same two outcomes above.
- **Header** renders as a **full-width top strip above a light content area** → a themed header anchors the top with strong contrast. **The venue logo on the header is injected by EzGo (from venue settings) in the top-LEFT corner — it is NOT part of the designed asset** (see §9.6). Leave the left zone clear; never bake a header logo.
- **Banner** renders in a **narrow left sidebar column (~310px wide)** beside white listing cards on the light-grey page → the banner needs *internal* contrast so it doesn't dissolve into the page. The bottom dark scrim (Pattern 4) does double duty here: it both holds the text and gives the banner a defined lower edge against the light background.
- **Header and banner appear together on the same screen** → keep them coordinated (same logo, palette, photo family) but **not identical** — vary the crop and the headline copy (the live pair uses "קיסריה, להתעורר מול הים…" on the header vs "לישון מול הים, להתעורר בתוך היסטוריה." on the banner).
- A faint **"Powered By: EzGo"** mark sits in the page footer — the venue assets carry the *venue's* brand, never EzGo's.

---

## 10. Common Design Mistakes to Avoid

| Mistake | Why it fails | Fix |
|---------|-------------|-----|
| Text placed directly on busy photography | Legibility loss at small sizes | Add semi-transparent overlay behind text |
| Logo + text compete for top zone | Visual hierarchy collapses | Separate logo to top 20%, headline to middle 30% |
| Using 4+ colors in one design | Visual noise, looks amateur | Stick to 2-3 colors max per design |
| Generic stock-looking background | Brand feels forgettable | Write more specific, venue-anchored prompt |
| Both banner and header use identical crop | Repetitive look | Use different angle or time of day in prompt |
| Hebrew text left-aligned | Unnatural RTL reading | Always right-align Hebrew elements |
| Logo at full bleed width | Looks stretched/unprofessional | Cap logo width at 35% of banner width |
