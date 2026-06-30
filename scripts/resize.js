#!/usr/bin/env node
/**
 * resize.js — resize/crop background images to final banner/header dimensions.
 *
 * Usage:
 *   node scripts/resize.js --input <src.png> --kind banner --output <dst.png>
 *   node scripts/resize.js --input <src.png> --kind header --output <dst.png>
 *
 * Banner: any portrait source → 310x600 via aspect-preserving crop (fit:'cover'),
 *         so baked-in text/logos (Nano Banana full-design mode) are never stretched.
 * Header: any wide source → width-resize to 1366, then center-crop a 1366x200 band
 *         (crop offset computed from the actual resized height — works for any aspect).
 *
 * Asserts final dimensions and exits non-zero on mismatch.
 *
 * Requires: `sharp` (install with `npm install sharp` in project root).
 */

const fs = require("fs");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.error("FATAL: 'sharp' not installed. Run: npm install sharp");
  process.exit(2);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      out[a.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const input = args.input;
const kind = args.kind;
const output = args.output;

if (!input || !kind || !output) {
  console.error("Usage: node scripts/resize.js --input <src> --kind banner|header --output <dst>");
  process.exit(2);
}
if (!fs.existsSync(input)) {
  console.error(`input not found: ${input}`);
  process.exit(2);
}
fs.mkdirSync(path.dirname(output), { recursive: true });

const TARGETS = {
  banner: { width: 310, height: 600 },
  header: { width: 1366, height: 200 },
};

if (!TARGETS[kind]) {
  console.error(`unknown kind: ${kind} (use 'banner' or 'header')`);
  process.exit(2);
}

(async () => {
  try {
    if (kind === "banner") {
      // Banner: preserve aspect and CROP to 310x600 (cover), never stretch — protects
      // the Hebrew text + logo baked in by Nano Banana full-design mode. A near-square-
      // ratio source (old gpt-image 1024x1984 ≈ target) loses essentially nothing; a
      // 9:16 Nano Banana source gets a small symmetric crop instead of a vertical squish.
      await sharp(input)
        .resize(310, 600, { fit: "cover", position: "centre" })
        .png()
        .toFile(output);
    } else {
      // Header: resize width to 1366 (preserve aspect), then center-crop a 1366x200 band.
      // The crop offset is derived from the ACTUAL resized height, so it self-centers for
      // any source aspect (gpt-image 2304x800 → 474; Nano Banana 21:9 → ~585; etc.).
      const resizedBuf = await sharp(input).resize(1366, null).png().toBuffer();
      const rm = await sharp(resizedBuf).metadata();
      if (rm.height >= 200) {
        const top = Math.round((rm.height - 200) / 2);
        await sharp(resizedBuf)
          .extract({ left: 0, top, width: 1366, height: 200 })
          .png()
          .toFile(output);
      } else {
        // Source too short after width-resize to yield a 200px band — cover-crop to target.
        await sharp(input)
          .resize(1366, 200, { fit: "cover", position: "centre" })
          .png()
          .toFile(output);
      }
    }

    const meta = await sharp(output).metadata();
    const target = TARGETS[kind];
    if (meta.width !== target.width || meta.height !== target.height) {
      console.error(
        JSON.stringify({
          ok: false,
          error: "DIM_MISMATCH",
          got: `${meta.width}x${meta.height}`,
          expected: `${target.width}x${target.height}`,
        })
      );
      process.exit(1);
    }
    console.log(JSON.stringify({ ok: true, kind, path: output, dimensions: `${meta.width}x${meta.height}` }));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err && err.message) }));
    process.exit(1);
  }
})();
