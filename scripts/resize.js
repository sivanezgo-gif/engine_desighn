#!/usr/bin/env node
/**
 * resize.js — resize/crop background images to final banner/header dimensions.
 *
 * Usage:
 *   node scripts/resize.js --input <src.png> --kind banner --output <dst.png>
 *   node scripts/resize.js --input <src.png> --kind header --output <dst.png>
 *
 * Banner: source 1024x1984 → 310x600 via pure resize (fit:'fill').
 * Header: source 2304x800  → 1366x200 via width-resize (1366x474) then center-crop top 137, height 200.
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
      // Banner: 1024x1984 (≈0.516 aspect) → 310x600 (≈0.517 aspect). Pure fill resize.
      await sharp(input)
        .resize(310, 600, { fit: "fill" })
        .png()
        .toFile(output);
    } else {
      // Header: 2304x800 → resize width to 1366 → 1366x474 → center-crop to 1366x200.
      // top = round((474 - 200) / 2) = 137
      await sharp(input)
        .resize(1366, null) // width=1366, preserve aspect → height becomes 1366*800/2304 ≈ 474
        .extract({ left: 0, top: 137, width: 1366, height: 200 })
        .png()
        .toFile(output);
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
