---
name: canva-mcp-operations
description: >
  The mechanical playbook for driving the Canva MCP server — asset upload (file:// vs local
  HTTP fallback), creating designs at custom dimensions (generate-design-structured spike order),
  the editing-transaction lifecycle (start → perform → commit / cancel), and export → re-download
  → dimension assertion. Read by any agent that touches Canva (canva-designer, asset-forge,
  format-multiplier, design-qa). This is the "how to call the API"; visual-design-principles is
  the "what to design".
---

# Canva MCP Operations — Mechanical Playbook

All Canva MCP tools share the prefix `mcp__a51234ff-aa54-4be5-a601-a2d4be6dac54__`. Below it is
abbreviated `…__<tool>`. This skill is pure mechanics — it makes **no** aesthetic decisions.

---

## 1. Upload an Asset (`…__upload-asset-from-url`)

```
…__upload-asset-from-url(url: <source>)
```

**D2 spike — `file://` support is unconfirmed.** Try the `file://` absolute path first. If the MCP
rejects it, host a tiny local server and use an `http://` URL:

```bash
# from the directory containing the file:
python3 -m http.server 8765 &
SERVER_PID=$!
# … upload via http://localhost:8765/<filename> …
kill $SERVER_PID    # always kill after upload
```

Capture the returned `asset_id`. Retry once after 10s on timeout; surface `fail` if still down.

---

## 2. Create a Design at Custom Dimensions

**Spike order (D3) — prefer structured first:**

1. `…__generate-design-structured` with explicit `width` / `height`
   (e.g. banner `310×600`, header `1366×200`).
2. If it rejects custom dimensions → fall back to `…__generate-design` (any dimensions) then
   `…__resize-design` to the target.

Capture the `design_id`.

---

## 3. Editing-Transaction Lifecycle

Every edit is wrapped in a transaction. **Never leave one open.**

```
…__start-editing-transaction(design_id: <id>)
…__perform-editing-operations(operations: [ … ])
…__commit-editing-transaction          # only after all operations succeed
```

The `operations` array is design-specific (set_background / add_text / add_image) — for ordering
and RTL/typography rules see `visual-design-principles §8`. This skill only guarantees the
**lifecycle**:

- On any operation failure → `…__cancel-editing-transaction(design_id)` immediately, log the
  error, and return a `fail` envelope. Do not attempt `commit` after a failure.
- An open transaction without `commit`/`cancel` is a defect (see quality gate in §7 of
  visual-design-principles).

---

## 4. Export → Re-download → Assert Dimensions

```
…__export-design(design_id: <id>, format: png)   →   download URL
```

`curl` the URL to the target path, then re-assert dimensions with sharp:

```bash
node -e "const sharp=require('sharp');sharp(process.argv[1]).metadata().then(m=>{const [w,h]=process.argv[2].split('x').map(Number);if(m.width!==w||m.height!==h){console.error('DIM_MISMATCH '+m.width+'x'+m.height);process.exit(1)}console.log('OK '+m.width+'x'+m.height)})" <path> <expected_WxH>
```

If the assertion fails → return `status:"fail"` with an explicit `error`. Never return `ok` on a
dimension mismatch.

---

## 5. Get the Edit URL

```
…__get-design(design_id: <id>)   →   edit_url (https://canva.com/…)
```

Always return edit URLs in `artifacts` so the user can do manual touch-ups (e.g. if Hebrew text
needs a nudge).

---

## 6. Abort / Cleanup

Given `canva_assets` from the orchestrator: for each `*_design_id` present without commit
confirmation, call `…__cancel-editing-transaction(design_id)`. If no transaction is open the call
may no-op or error — catch and ignore. Drafted designs are left for Canva's trash auto-clean (v1).

---

## 7. Read-Only Operations (for audit)

`design-qa` and similar reviewers use only read-side tools — **never** start a transaction:

- `…__get-design` — metadata + edit URL
- `…__get-design-thumbnail` — preview image URL
- `…__export-design` — pull the rendered PNG for pixel-level inspection

---

## 8. Retry & Error Table

| Case | Behavior |
|------|----------|
| Upload timeout | Retry once after 10s; then `fail` |
| `file://` rejected | Local `http.server` fallback (§1) |
| Custom dimensions rejected | `generate-design` + `resize-design` (§2) |
| Operation fails mid-transaction | `cancel-editing-transaction`, log, `fail` (§3) |
| Export dimension mismatch | `fail` with explicit error (§4) |
