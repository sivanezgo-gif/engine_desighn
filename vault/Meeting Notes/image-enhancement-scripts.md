# Image Enhancement Scripts (rembg + Real-ESRGAN)

## Overview
Two Node wrappers around well-known image tools, designed to be used as a **two-step pipeline** on logos and other assets that need a quality lift before going into Canva. `scripts/remove_bg.js` wraps the rembg Python library (u2net segmentation model) to strip backgrounds from logos. `scripts/upscale.js` wraps Real-ESRGAN's ncnn-vulkan binary to enlarge images 2–4x while keeping detail crisp. Both run locally with no API keys — costs nothing per call, no rate limits, fully private.

**Canonical pipeline order: rembg FIRST, upscale SECOND.** Reversing the order confuses rembg because Real-ESRGAN's smoothing pass adds soft gradients that look like background to the segmentation model — empirically yields 90%+ transparency (subject erased). The brand-researcher agent will enforce this order in Phase B6.

Status: scripts shipped 2026-05-20 in commit `75a09ca`. Agent wiring (Phase B6 for brand-researcher, Phase B7 for canva-designer) is pending.

## Open Questions
- The `over_removal` warning threshold in `remove_bg.js` defaults to 0.95 (95% transparent). Empirically, "subject erased" cases come in around 90%+. Should we lower the threshold to 0.85 once we have more real-world data?
- rembg's u2net model is the default and good for general logos. Should we also expose `isnet-general-use` (newer, sharper edges) as a model option for spas / fine photography? Cost: another ~170MB model download on first use.
- Real-ESRGAN's `realesrgan-x4plus` is best for photos; `realesrgan-x4plus-anime` is better for line-art logos. The agent should auto-pick based on `brand_profile.business_type` — deferred to Phase B7.
- Real-ESRGAN binary is Windows-only at `tools/realesrgan/realesrgan-ncnn-vulkan.exe`. Linux/Mac users will need a different binary (downloads exist on the upstream release page). The `REALESRGAN_PATH` env var lets users override the location.

## Session Log

### 2026-05-20 — Initial implementation [shipped]
- **What was done:** Wrote both wrappers. Both emit single-line JSON envelopes consistent with `openai_image.js` and `resize.js`. `remove_bg.js` had to switch from `python -m rembg` to `python -c "...rembg.cli.main..."` because Python 3.14 dropped support for `-m` on packages without a `__main__.py` (rembg has none). After background removal, the script inspects the output's alpha channel via sharp and reports `transparent_fraction` with soft warnings. `upscale.js` invokes the Real-ESRGAN exe with the bundled `realesrgan-x4plus` model at scale=2 by default; alpha channel passes through cleanly.
- **Decisions:**
  - Pipeline order is `rembg → upscale`, not the reverse. Verified empirically on the spa-ben-ami logo: 150x147 → rembg → 20.9% transparent (clean); reversed pipeline gives 92.4% transparent (subject erased). Real-ESRGAN's smoothing fools the segmentation. The script header documents this explicitly so future maintainers see it before they get burned.
  - Real-ESRGAN binary lives in `tools/realesrgan/` (gitignored). Reasoning: 45MB binary is platform-specific; bundling would bloat the repo without helping non-Windows devs. `REALESRGAN_PATH` env var lets users place the binary anywhere.
  - rembg model lives in `~/.u2net/` (~170MB), downloaded automatically on first use by the upstream library. We don't ship it.
  - Soft warnings, not hard failures, when transparency is suspicious. Reasoning: a legitimate logo (thin outline, white-on-black) may legitimately end up 90%+ transparent. The brand-researcher should surface the warning to the user, not crash.
- **Notes / Caveats:**
  - Installation cost: `pip install --user "rembg[cli] rembg[cpu]"` pulls ~500MB of deps (onnxruntime, gradio, scikit-image, etc.). Real-ESRGAN zip is 45MB. First-run rembg downloads u2net.onnx (176MB) on demand.
  - rembg has no `__main__` — the Python 3.14 fix is in `scripts/remove_bg.js` line ~92. If we ever upgrade and `python -m rembg` starts working, we can simplify back to `-m`.
  - Both scripts default to behavior that's safe for photo logos (most common case); the brand-researcher will pass `--model` per business_type once Phase B7 lands.
- **Related:** [[architecture-overview]], [[brand-researcher-agent]], [[canva-designer-agent]], [[claude-settings]], [[openai-image-script]], [[resize-script]]
