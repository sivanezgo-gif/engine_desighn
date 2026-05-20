#!/usr/bin/env node
/**
 * upscale.js — upscale an image via Real-ESRGAN (ncnn-vulkan CLI).
 *
 * Wraps the bundled `tools/realesrgan/realesrgan-ncnn-vulkan` binary so the
 * rest of the system stays in Node and only this one place owns the native
 * exe interop.
 *
 * Usage:
 *   node scripts/upscale.js --input <src.png> --output <dst.png>
 *                          [--scale 2|3|4]                  # default 2
 *                          [--model realesrgan-x4plus]       # default for photos+logos
 *                          [--realesrgan-path <path>]        # default: tools/realesrgan
 *
 * Output: single JSON line on stdout:
 *   { ok: true, input, output, input_dimensions, output_dimensions, scale, model }
 *   { ok: false, error: "..." }
 *
 * Exit code: 0 on success, 1 on failure, 2 on bad args.
 *
 * Requires:
 *   - tools/realesrgan/realesrgan-ncnn-vulkan.exe (Windows) or equivalent on other OSes,
 *     or set REALESRGAN_PATH env var to the binary's containing folder.
 *   - sharp (already in package.json) for pre/post dimension checks.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
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
const scale = parseInt(args.scale || "2", 10);
const model = args.model || "realesrgan-x4plus";
const realesrganDir =
  args["realesrgan-path"] ||
  process.env.REALESRGAN_PATH ||
  path.join(process.cwd(), "tools", "realesrgan");

if (!input || !output) {
  console.error("Usage: node scripts/upscale.js --input <src> --output <dst> [--scale 2|3|4]");
  process.exit(2);
}
if (![2, 3, 4].includes(scale)) {
  console.error(JSON.stringify({ ok: false, error: `--scale must be 2, 3, or 4 (got ${scale})` }));
  process.exit(2);
}
if (!fs.existsSync(input)) {
  console.error(JSON.stringify({ ok: false, error: `input not found: ${input}` }));
  process.exit(2);
}

// Locate the binary (Windows vs other OS).
function findBinary() {
  const candidates =
    os.platform() === "win32"
      ? [path.join(realesrganDir, "realesrgan-ncnn-vulkan.exe")]
      : [
          path.join(realesrganDir, "realesrgan-ncnn-vulkan"),
          path.join(realesrganDir, "realesrgan-ncnn-vulkan.bin"),
        ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

const binary = findBinary();
if (!binary) {
  console.error(
    JSON.stringify({
      ok: false,
      error: `Real-ESRGAN binary not found in ${realesrganDir}. Set REALESRGAN_PATH or download from https://github.com/xinntao/Real-ESRGAN/releases`,
    })
  );
  process.exit(2);
}
const modelsDir = path.join(realesrganDir, "models");

fs.mkdirSync(path.dirname(output), { recursive: true });

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
(async () => {
  // Pre-check input dimensions for context in the JSON envelope.
  let inputMeta;
  try {
    inputMeta = await sharp(input).metadata();
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: `bad input image: ${err.message}` }));
    process.exit(1);
  }

  const result = spawnSync(
    binary,
    [
      "-i",
      path.resolve(input),
      "-o",
      path.resolve(output),
      "-s",
      String(scale),
      "-n",
      model,
      "-m",
      modelsDir,
      "-f",
      "png",
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    console.error(
      JSON.stringify({
        ok: false,
        error: "realesrgan failed",
        stderr: (result.stderr || "").slice(0, 500),
        exitCode: result.status,
      })
    );
    process.exit(1);
  }
  if (!fs.existsSync(output)) {
    console.error(JSON.stringify({ ok: false, error: "realesrgan ran but output missing" }));
    process.exit(1);
  }

  let outputMeta;
  try {
    outputMeta = await sharp(output).metadata();
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: `bad output image: ${err.message}` }));
    process.exit(1);
  }

  const expectedW = inputMeta.width * scale;
  const expectedH = inputMeta.height * scale;
  const dimensionsOk =
    Math.abs(outputMeta.width - expectedW) <= 2 && Math.abs(outputMeta.height - expectedH) <= 2;

  console.log(
    JSON.stringify({
      ok: true,
      input,
      output,
      input_dimensions: `${inputMeta.width}x${inputMeta.height}`,
      output_dimensions: `${outputMeta.width}x${outputMeta.height}`,
      scale,
      model,
      dimensions_ok: dimensionsOk,
    })
  );
})();
