#!/usr/bin/env node
/**
 * remove_bg.js — remove background from an image via the rembg Python CLI.
 *
 * Wraps `python -m rembg i <input> <output>` so the rest of the system
 * stays in Node and only this one place owns the Python interop.
 *
 * Usage:
 *   node scripts/remove_bg.js --input <src.png> --output <dst.png>
 *                            [--model u2net|isnet-general-use|silueta|...]
 *                            [--alpha-min 0.05]   # warn if >X fraction is transparent
 *                            [--alpha-max 0.95]   # warn if >X fraction is transparent (over-removal)
 *
 * Output: single JSON line on stdout:
 *   { ok: true, input, output, dimensions, transparent_fraction, model, warnings: [] }
 *   { ok: false, error: "..." }
 *
 * Exit code: 0 on success (even with warnings), 1 on failure, 2 on bad args.
 *
 * Requires:
 *   - Python 3.10+ in PATH
 *   - `pip install rembg[cli]` (or rembg without [cli] if calling via `python -m`)
 *   - sharp (already declared in package.json)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: "sharp not installed. Run: npm install" }));
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
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
const output = args.output;
const model = args.model || "u2net";
const alphaMin = parseFloat(args["alpha-min"] || "0.05"); // warn if too little transparency (background not removed)
const alphaMax = parseFloat(args["alpha-max"] || "0.95"); // warn if too much transparency (subject removed)

if (!input || !output) {
  console.error("Usage: node scripts/remove_bg.js --input <src> --output <dst> [--model u2net]");
  process.exit(2);
}
if (!fs.existsSync(input)) {
  console.error(JSON.stringify({ ok: false, error: `input not found: ${input}` }));
  process.exit(2);
}
fs.mkdirSync(path.dirname(output), { recursive: true });

// ---------------------------------------------------------------------------
// Call rembg
// ---------------------------------------------------------------------------
function findPython() {
  for (const cmd of ["python", "python3", "py"]) {
    const r = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return cmd;
  }
  return null;
}

const py = findPython();
if (!py) {
  console.error(JSON.stringify({ ok: false, error: "no python in PATH" }));
  process.exit(2);
}

const env = { ...process.env, U2NET_HOME: process.env.U2NET_HOME || path.join(require("os").homedir(), ".u2net") };
// Python 3.14 dropped support for `python -m rembg` because rembg has no
// __main__ module. Invoke via -c so the script works on any Python version
// that has rembg importable. We rebuild sys.argv inside the snippet so
// click's CLI parser picks up the subcommand and options correctly.
const pyCode =
  "import sys; sys.argv = ['rembg'] + sys.argv[1:]; from rembg.cli import main; main()";
const rembgArgs = ["-c", pyCode, "i", "-m", model, input, output];
const result = spawnSync(py, rembgArgs, { encoding: "utf8", env });

if (result.status !== 0) {
  console.error(
    JSON.stringify({
      ok: false,
      error: "rembg failed",
      stderr: (result.stderr || "").slice(0, 500),
      exitCode: result.status,
    })
  );
  process.exit(1);
}

if (!fs.existsSync(output)) {
  console.error(JSON.stringify({ ok: false, error: "rembg ran but output file missing" }));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Inspect output — dimensions + alpha analysis
// ---------------------------------------------------------------------------
(async () => {
  try {
    const meta = await sharp(output).metadata();
    let transparentFraction = null;
    const warnings = [];

    // Extract alpha channel and count fully-transparent pixels.
    if (meta.hasAlpha) {
      const { data, info } = await sharp(output)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const channels = info.channels;
      const totalPixels = info.width * info.height;
      let transparent = 0;
      for (let i = 0; i < data.length; i += channels) {
        // Alpha is the last channel after RGB(A); ensureAlpha makes channels=4.
        if (data[i + channels - 1] < 16) transparent++; // <~6% opacity → "transparent"
      }
      transparentFraction = transparent / totalPixels;

      if (transparentFraction < alphaMin) {
        warnings.push(
          `low_transparency: only ${(transparentFraction * 100).toFixed(1)}% transparent — background may not have been removed`
        );
      }
      if (transparentFraction > alphaMax) {
        warnings.push(
          `over_removal: ${(transparentFraction * 100).toFixed(1)}% transparent — subject may have been erased`
        );
      }
    } else {
      warnings.push("no_alpha_channel: output PNG has no alpha — background removal probably failed");
    }

    console.log(
      JSON.stringify({
        ok: true,
        input,
        output,
        dimensions: `${meta.width}x${meta.height}`,
        transparent_fraction:
          transparentFraction === null ? null : Math.round(transparentFraction * 1000) / 1000,
        model,
        warnings,
      })
    );
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: `post-check failed: ${err.message}` }));
    process.exit(1);
  }
})();
