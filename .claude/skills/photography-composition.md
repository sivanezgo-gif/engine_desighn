---
name: photography-composition
description: >
  Photographic composition for the AI-generated banner/header backgrounds — rule of thirds,
  negative space and text-safe zones, leading lines and depth, horizon placement per aspect
  ratio, viewpoint, and lighting/time-of-day. Use in canva-designer backgrounds (to write
  image prompts that leave a calm home for the Hebrew text) and compose (to place text in
  the calm zone). EXTENDS visual-design-principles §4 — that section gives the prompt
  skeleton; this skill is the compositional reasoning that fills it.
---

# Photography Composition — EzGo Backgrounds

The image model renders **pure imagery, no text** (the RTL strategy). Your job in
`phase=backgrounds` is to compose that imagery so the Hebrew headline — added later in Canva
— has a **calm, uncluttered home**, and so the header survives its center-crop. A beautiful
background with no room for text is a failed background.

This skill pairs with two automated checks:
- `validate_export.js` **legibility** flags a busy background under the text (>30% edges) →
  compose negative space *on purpose* so you never trip it.
- `resize.js` crops the header to its **central horizontal third** → keep the subject there.

---

## 1. Rule of thirds & focal placement

Imagine the frame split into 3×3. Place the **main subject** on a third-line or intersection,
not dead center. This automatically leaves open space elsewhere — which is where text goes.

- **Banner (310×600, portrait):** put the focal subject on the **lower-third** line and keep
  the **upper third open/atmospheric** → headline + logo live up top. Or invert (subject
  high, text low) for a "lower-third caption" look that matches `v1_balanced`'s lower-third
  text.
- **Header (1366×200 from a 2304×800 render):** focal subject on a **central** third
  intersection; the sides stay open for left/right-aligned text.

Prompt phrasing: `"main subject positioned in the lower third, upper third open sky/space"`.

---

## 2. Negative space = the text zone (the most important rule)

**Negative space** is intentional emptiness. It is not wasted — it is the seat reserved for
the headline. Decide *where the text will sit*, then ask the model to keep that region quiet.

| Composition | Text-safe zone | Prompt cue |
|-------------|----------------|-----------|
| Banner, text upper | top 35% calm | `"top third is open sky / soft gradient, minimal detail, for text overlay"` |
| Banner, text lower (`v1`) | bottom 35% calm | `"foreground lower third simple and unbusy, darker, for text overlay"` |
| Header, text right (RTL) | right 40% calm | `"right side fades to simple atmospheric tone, low detail"` |
| Header, text left (LTR) | left 40% calm | `"left side open and simple, subject weighted to the right-center"` |

Always include a *darkening or simplifying* cue for the text zone (`"subtle darker area
at {top|bottom} for text overlay"` — already in the banner template). A calm, slightly darker
zone both passes the legibility check and guarantees contrast for white text.

---

## 3. Leading lines & depth

- **Leading lines** (a path, shoreline, row of loungers, dock, horizon) guide the eye toward
  the focal point — and, if aimed well, *toward or away from* the text zone. Use them to pull
  attention into the open space, not across the headline.
- **Depth** (foreground → midground → background) makes a flat AI image feel real and
  premium. Prompt with a near element, a subject, and a receding background:
  `"foreground rocks slightly out of focus, kayak mid-frame, distant horizon"`.
- Keep the **foreground simple** when text sits low — busy foreground texture is the #1 cause
  of a failed legibility check.

---

## 4. Horizon placement per aspect ratio

The horizon line sets the mood and decides how much "sky" (text room) you get.

- **Banner (tall):** a **low horizon** (bottom third) yields a tall open sky → great for upper
  text and an airy, aspirational feel. A **high horizon** yields a large foreground → use when
  text sits low. Avoid a centered horizon (splits the frame, no clear text zone).
- **Header (wide, center-crop):** keep the horizon **within the central third** — if it
  drifts into the top/bottom third it gets cropped and the image reads as a flat band. A
  near-central, slightly-low horizon survives the crop and keeps a sky strip for text.

---

## 5. Viewpoint & framing per mood

| Viewpoint | Feel | Hospitality use |
|-----------|------|-----------------|
| **Eye-level** | relatable, "you are here" | dining, spa interiors, boutique |
| **Low / hero angle** | grand, aspirational | luxury, architecture, adventure |
| **Aerial / bird's-eye** | scale, escape, overview | resorts, beaches, pools, marine |
| **Close-up / detail** | sensory, intimate, premium | spa treatments, food, textures |

**Framing** (an arch, foliage, a doorway around the subject) adds depth and naturally creates
a vignette of negative space — useful for centered text (`v3_minimal`). Vary the viewpoint
across the 3 background sets so the user gets *genuinely* different options (visual-design §9:
"both crops identical = repetitive").

---

## 6. Light & time of day

Light carries mood and ties back to [[advanced-color-theory]]'s temperature:

| Light | Mood | Palette pull |
|-------|------|--------------|
| **Golden hour** (low warm sun) | warm, inviting, premium | amber/gold, long soft shadows |
| **Blue hour** (dusk/dawn) | calm, elegant, upscale | deep blue, teal, cool |
| **Soft overcast / diffused** | clean, gentle, spa-like | desaturated, even, no harsh shadow |
| **Bright midday** | energetic, fresh, active | saturated, high contrast, crisp |

Match the light to the vertical and **keep it consistent between the banner and the header**
of the same set (visual-design §4) — different light on the pair looks like two brands.

---

## 7. Composition prompt patterns (drop-in phrases)

Append the relevant phrases to the visual-design §4 skeleton:

- Text room: `"generous negative space in the {top|bottom|right} for text overlay, kept
  simple and slightly darker"`
- Thirds: `"subject on the lower-third line, rule of thirds composition"`
- Depth: `"layered depth — soft foreground, clear midground subject, distant background"`
- Header crop safety: the mandatory central-third sentence from visual-design §4 (verbatim).
- Calm foreground (low text): `"uncluttered foreground, smooth surface, minimal texture"`
- No people faces / no text: keep the visual-design §4 negatives (`"no text, no logos, no
  words, no people's faces"`).

---

## 8. Composition checklist (before returning backgrounds)

- [ ] **Text zone reserved** — a calm, simpler, slightly-darker region matches where the
      headline will go (per variant: upper / lower / centered).
- [ ] **Header subject in central third** — survives the `resize.js` crop.
- [ ] **Horizon not centered** (banner) / **within central third** (header).
- [ ] **Foreground simple** where text sits low — won't trip the legibility check.
- [ ] **Depth present** — not a flat single-plane image.
- [ ] **3 sets genuinely differ** — vary viewpoint / time of day / focal element, not just tint.
- [ ] **Light consistent within a banner+header pair.**
