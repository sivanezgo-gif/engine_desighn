#!/usr/bin/env node
/**
 * render_headline_mock.js — render a headline into a small preview strip (PNG).
 *
 * Used at Gate 3 so the orchestrator can show each candidate headline as a
 * *visual* mock (brand color on a brand background), not just plain text —
 * an approximation of how the line will read on the final banner/header.
 *
 * RTL: Hebrew is rendered via sharp's built-in Pango text engine, which is
 * RTL-aware automatically. No SVG, no foreign-character rendering of words.
 *
 * Usage:
 *   node scripts/render_headline_mock.js --text "חופשה מושלמת" --primary "#0A4C8B" \
 *        --bg "#FFFFFF" --out ./output/<sid>/copy_mocks/opt_1.png
 *
 * Options:
 *   --text     headline string (required)
 *   --primary  brand color for the text (default #0A4C8B)
 *   --bg       background color (default #FFFFFF)
 *   --out      output PNG path (required)
 *   --width    canvas width  (default 620)
 *   --height   canvas height (default 200)
 *   --font     font family   (default Arial — Hebrew-capable on Windows)
 *
 * Emits a single JSON line on stdout: {ok:true,path,dimensions}.
 * On failure: {ok:false,error} on stderr + non-zero exit.
 *
 * Requires: `sharp`.
 */

const fs = require("fs");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: "sharp not installed (npm install sharp)" }));
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

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// WCAG relative luminance + contrast ratio — used to keep the mock legible
// even when the brand primary is close in tone to the chosen background.
function relLuminance({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const la = relLuminance(a) + 0.05;
  const lb = relLuminance(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

function escapePango(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const args = parseArgs(process.argv);
const text = args.text;
const out = args.out;
const bgHex = args.bg || "#FFFFFF";
let primaryHex = args.primary || "#0A4C8B";
const width = parseInt(args.width || "620", 10);
const height = parseInt(args.height || "200", 10);
const font = args.font || "Arial";

if (!text || !out) {
  console.error(JSON.stringify({ ok: false, error: "usage: --text <s> --out <path> [--primary #hex --bg #hex]" }));
  process.exit(2);
}

const bgRgb = hexToRgb(bgHex) || { r: 255, g: 255, b: 255 };
let textRgb = hexToRgb(primaryHex) || { r: 10, g: 76, b: 139 };

// Legibility guard: if the brand color barely contrasts with the background,
// fall back to black or white (whichever reads better) so the mock is honest.
if (contrast(textRgb, bgRgb) < 3) {
  const black = { r: 26, g: 26, b: 26 };
  const white = { r: 255, g: 255, b: 255 };
  const pick = contrast(black, bgRgb) >= contrast(white, bgRgb) ? black : white;
  textRgb = pick;
  primaryHex = `#${[pick.r, pick.g, pick.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

fs.mkdirSync(path.dirname(out), { recursive: true });

const pad = Math.round(Math.min(width, height) * 0.12);

(async () => {
  try {
    const textPng = await sharp({
      text: {
        text: `<span foreground="${primaryHex}" weight="bold">${escapePango(text)}</span>`,
        rgba: true,
        width: Math.max(40, width - pad * 2),
        height: Math.max(24, height - pad * 2),
        align: "center",
        font,
      },
    })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b, alpha: 1 },
      },
    })
      .composite([{ input: textPng, gravity: "centre" }])
      .png()
      .toFile(out);

    const meta = await sharp(out).metadata();
    if (meta.width !== width || meta.height !== height) {
      console.error(JSON.stringify({ ok: false, error: "DIM_MISMATCH", got: `${meta.width}x${meta.height}` }));
      process.exit(1);
    }
    console.log(JSON.stringify({ ok: true, path: out, dimensions: `${meta.width}x${meta.height}` }));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err && err.message) }));
    process.exit(1);
  }
})();
