---
name: advanced-color-theory
description: >
  Advanced color reasoning for hospitality banners — color harmonies, deriving a full
  palette from one brand color (HSL math), perceptual difference (ΔE) and how it ties to
  the cross-session registry, generating WCAG-accessible text/background pairs, and color
  psychology per hospitality vertical. Use in canva-designer (directions + compose) when
  choosing a palette, deriving an accent, or picking a text color. EXTENDS
  visual-design-principles §2 — do not duplicate its basic contrast pairs; go deeper here.
---

# Advanced Color Theory — EzGo Hospitality

This skill is the **deep** color reference. [[visual-design-principles]] §2 gives the basics
(color roles, the 4.5:1 rule, a table of safe pairs). Use **this** skill when you need to
*reason* about color: build a harmony, derive a missing accent, push a palette away from a
look-alike client, or choose a vertical-appropriate mood.

All hex math below is in **HSL** (Hue 0–360°, Saturation 0–100%, Lightness 0–100%) because
hue rotation and lightness shifts are how you actually construct a palette. Convert hex↔HSL
mentally or with a one-liner: `node -e "..."` is allowed if you need precision.

---

## 1. Color Harmonies (the relationships)

A harmony is a rule for choosing colors that "agree." Pick the harmony that matches the
brand's energy, then derive the actual hexes from the brand's primary hue `H`.

| Harmony | Hue recipe (from primary `H`) | Energy | Hospitality fit |
|---------|-------------------------------|--------|-----------------|
| **Monochromatic** | same `H`, vary S/L only | calm, elegant, safe | spa, wellness, luxury minimal |
| **Analogous** | `H`, `H±30°` | harmonious, natural, soft | nature, eco, boutique, family |
| **Complementary** | `H`, `H+180°` | high energy, strong contrast | adventure, sport, bold CTAs |
| **Split-complementary** | `H`, `H+150°`, `H+210°` | vivid but less harsh than pure complement | vibrant venues, events |
| **Triadic** | `H`, `H+120°`, `H+240°` | playful, balanced, colorful | family, kids, casual dining |

**Default choice when unsure:** analogous for the background field + one complementary or
high-lightness accent for the CTA/headline. This reads as "designed," not random.

**Rule of restraint:** even with a triadic harmony, render **2–3 colors max** in any one
design (per visual-design §9). The third harmony color is a *reserve* for the accent, not a
license to use four colors.

---

## 2. Deriving a full palette from ONE brand color

The common case: `brand_profile.colors.primary` exists, `secondary` is `null`. Build the
rest instead of guessing.

Given primary as `(H, S, L)`:

- **Secondary (analogous companion):** `(H+30°, S, L)` — or `(H−30°)`. Keeps the family feel.
- **Accent (for buttons / headline pop):** `(H+180°, clamp S to 60–85%, L≈55%)` — the
  complement, saturated enough to draw the eye. If the complement clashes (e.g. a muddy
  green-red), use split-complement `(H+150°)` instead.
- **Background tint (large calm field):** `(H, S×0.4, L pushed to 92–96%)` for a light
  background, or `(H, S×0.7, L pulled to 12–20%)` for a dark, premium background.
- **Text:** never derived from hue — see §4 (it's a contrast decision, usually near-white or
  near-black).

**Worked example** — primary `#1A5276` (a teal-navy, ≈ H205° S64% L28%):
- secondary `H175°` → `#1A7670` (teal)
- accent `H25°` (complement of 205) → warm amber `#C9772E`
- light background `#EAF1F5`; dark background `#0E2E40`
- text on dark bg: `#FFFFFF`; text on light bg: `#0E2E40`

---

## 3. The 60-30-10 proportion rule

A balanced banner distributes color by **area**, not by count:
- **60% dominant** — the background field (primary or a tint of it).
- **30% secondary** — supporting imagery, a color block, or a gradient partner.
- **10% accent** — the CTA, a thin rule line, or the logo's pop color. The accent earns the
  eye *because* it's scarce. If the accent creeps past ~15% of area, it stops being an accent.

This maps onto the three C2 variants:
- `v1_balanced` ≈ textbook 60-30-10.
- `v2_bold` pushes the accent (headline in the accent color) — still ≤15% area.
- `v3_minimal` drops toward 80-15-5 (more dominant field, tiny accent).

---

## 4. Accessible text/background pairs (ties to validate_export.js)

The `contrast` check in `scripts/validate_export.js` computes the exact WCAG ratio of your
chosen text color against the sampled background. Choose the text color so it **passes
before** you compose — don't let the gate catch it.

- **Targets:** 4.5:1 normal text, **3:1 large text** (banner/header headlines are large →
  the script is called with `--large-text`). Aim for ≥4.5:1 anyway; headroom survives the
  busy-background sampling.
- **Fast decision (auto-contrast):** compute the background's relative luminance.
  - Background lighter than ~50% luminance → use **dark** text (`#111111` or a very dark
    tint of the brand hue).
  - Darker than ~50% → use **white**/near-white text.
- **When the brand accent is the text color** (`v2_bold`): verify it *still* passes. A mid-
  saturation accent at L≈55% often **fails** on a mid-tone background. Fix by darkening the
  accent (L→30%) for dark-on-light, or lightening it (L→80%) for light-on-dark, keeping the
  hue.
- **Busy background:** if the headline sits over imagery (not a solid block), the legibility
  check may flag it. Mitigate with a semi-transparent band behind the text (visual-design
  §9) — and pick text contrast against the *band*, not the photo.

---

## 5. Perceptual difference (ΔE) and cross-session distinctiveness

The registry (`brand_db.js find-similar-palette`) measures **ΔE76** between palettes; the
orchestrator warns when a new client lands within **ΔE 10** of an existing one (see
[[sqlite-brand-registry]]). ΔE is *perceptual* distance in CIE-LAB, not hex distance.

Rough reading of ΔE76:
- **< 2** — indistinguishable to most people.
- **2–10** — "the same color family"; this is the warning zone.
- **10–25** — clearly different but related.
- **> 25** — unmistakably different colors.

**When the orchestrator surfaces a `similar_clients` warning,** and the user wants to stay
distinct, move the primary by **≥10 ΔE**. The cheapest perceptual move is usually a
**hue rotation of 20–40°** (a bigger ΔE per step than small S/L nudges), or a meaningful
lightness shift (≥15 L). Re-check by eye: a spa that's `#E9DEDE` pinkish-beige can shift to
`#DDE4E0` (cooler sage) to clearly separate while staying soft.

---

## 6. Color psychology for hospitality verticals

Color sets expectation before a single word is read. Match the palette's *temperature and
saturation* to the promise of the venue.

| Vertical | Mood to evoke | Core hues | Avoid |
|----------|---------------|-----------|-------|
| **Spa / Wellness** | calm, clean, restorative | soft sage greens, dusty blues, warm off-white, blush | high saturation, pure black, hot red |
| **Marine / Water sports** | fresh, adventurous, open | teal, deep navy, aqua, sand neutral | muddy browns, pastel pink |
| **Luxury / Boutique hotel** | exclusive, timeless | charcoal, deep jewel tones (emerald, burgundy), gold accent | neon, primary-bright, busy multi-color |
| **Family / Casual dining** | warm, welcoming, fun | warm yellow, coral, friendly green, cream | cold grey, austere black, dark navy alone |
| **Adventure / Outdoor** | bold, energetic | saturated orange, forest green, slate, sky | washed-out pastels, beige-only |
| **Mediterranean / Heritage** | sun, earth, authenticity | terracotta, olive, azure, ochre | cool blue-grey, synthetic neon |
| **Urban / Modern café** | sharp, current, minimal | monochrome + one bold accent, concrete grey | overly warm "cozy" palettes |

**Temperature cue:** warm hues (red→yellow) read inviting, appetizing, energetic; cool hues
(green→blue) read calm, clean, trustworthy. A spa leaning warm feels cozy; leaning cool
feels clinical — tune `L` and add a warm off-white to keep cool palettes human.

---

## 7. Common color mistakes (beyond visual-design §9)

| Mistake | Why it fails | Fix |
|---------|-------------|-----|
| Deriving the accent at the same L as the background | No "pop" — accent disappears | Push accent L to ~55% and S up; keep area ≤10% |
| Using the OG-image "generic blue" as primary | Not the real brand; every site looks the same | Honor `needs_user_confirmation`; ask before composing |
| Saturated accent as headline without re-checking contrast | Fails WCAG on mid-tone bg | Darken/lighten the accent (keep hue) until ≥4.5:1 |
| Two venues, same vertical, near-identical palette | Brand confusion across EzGo clients | Heed the ΔE<10 warning; rotate hue ≥20–40° |
| Four+ colors "to look rich" | Reads amateur, noisy | 2–3 max; reserve the harmony's 3rd color for the accent |
| Pure `#000000` / `#FFFFFF` for "premium" | Flat, harsh on screen | Use near-black `#111` / warm white `#FAF7F2` |
