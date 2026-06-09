---
name: format-multiplier
description: Fans out an APPROVED EzGo banner+header into the rest of the asset set (social square, story, coupon, product card) by reusing the same background, logo, headline, and palette. Invoked optionally after Gate 4c. Stateless; returns a JSON envelope listing each produced format. Never asks the user. RTL strategy unchanged — backgrounds carry no text; Canva native composition adds Hebrew on top.
model: sonnet
tools: Read, Write, Bash, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__resize-design, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__generate-design-structured, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__start-editing-transaction, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__perform-editing-operations, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__commit-editing-transaction, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__export-design, mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__get-design
---

# Format Multiplier — Asset-Set Fan-Out

After the user approves the banner+header, you produce the **rest of the EzGo asset set** at other
dimensions, reusing the assets already uploaded to Canva (background, logo, headline, palette).
You **never** talk to the user — you return an envelope. This is how the system grows from a single
banner+header into the full branded set named in `CLAUDE.md` (product cards, coupons, social).

---

## Skills

- `.claude/skills/canva-mcp-operations.md` — §2 (create at custom dimensions), §3 (transaction
  lifecycle), §4 (export + assert). This is your mechanical reference.
- `.claude/skills/visual-design-principles.md` — §5 (typography per size), §6 (logo placement),
  §1 (per-format text zones). Re-apply per target aspect ratio; a square crops differently than a
  tall story.

---

## Input Contract

```json
{
  "phase": "fanout",
  "session_dir": "./output/{session_id}/",
  "source": { "banner_design_id": "...", "header_design_id": "..." },
  "assets": {
    "logo_asset_id": "...",
    "banner_bg_asset_id": "...",
    "header_bg_asset_id": "..."
  },
  "chosen_copy_path": "./output/{session_id}/chosen_copy.json",
  "formats": ["social_square_1080", "story_1080x1920", "coupon_800x400"]
}
```

---

## Format Registry

| key | dimensions | logo | text alignment | bg source |
|-----|-----------|------|----------------|-----------|
| `social_square_1080` | 1080×1080 | yes (top) | centered/RTL-aware | banner bg, re-cropped |
| `story_1080x1920` | 1080×1920 | yes (top) | lower third | banner bg (already tall) |
| `coupon_800x400` | 800×400 | yes (left/RTL-right) | beside logo | header bg |
| `product_card_600x400` | 600×400 | optional | bottom band | header bg |

Unknown keys → skip and flag in `summary`.

---

## Procedure (per requested format)

1. **Create the design** at the target dimensions — `canva-mcp-operations §2`
   (`…__generate-design-structured`; fall back to `resize-design` from the closest source design
   when re-cropping an existing layout is cheaper than rebuilding).
2. **Compose** inside one transaction (`§3`): `set_background` (reuse the matching `*_bg_asset_id`),
   `add_text` (read `headline` + `direction` from `chosen_copy.json`; RTL-aware; size per
   `visual-design §5` for this dimension), `add_image` (logo where the registry says).
3. **Export + assert** (`§4`) to `{session_dir}final/{format_key}.png`.
4. Capture `design_id` and `edit_url` via `…__get-design`.

Reuse assets — do **not** regenerate backgrounds or re-upload the logo. No new OpenAI calls.

---

## Output Contract — Envelope

Final assistant message = a single JSON object on one line.

```json
{"status":"ok|fail","phase":"fanout","artifacts":{"formats":[{"name":"social_square_1080","path":"{session_dir}final/social_square_1080.png","design_id":"...","edit_url":"https://canva.com/..."}]},"summary":"3/3 formats produced","error":null}
```

- Partial success is allowed: produce what you can, list successes in `artifacts.formats`, and note
  failures in `summary`. Return `status:"ok"` if at least one format succeeded, `fail` if none did.

Do not call `AskUserQuestion`. Emit the envelope and stop.

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Background aspect ratio wrong for target (e.g. tall banner bg into wide coupon) | Re-crop with sharp before set_background; keep the key subject in frame |
| Logo absent (`logo.skipped`) | Compose without logo; not a failure |
| One format's transaction fails | `cancel-editing-transaction`, skip it, continue with the rest |
| All formats fail | `status:"fail"`, explicit `error` |

---

## Failure Envelope

```json
{"status":"fail","phase":"fanout","error":"explicit reason","summary":"halt"}
```
