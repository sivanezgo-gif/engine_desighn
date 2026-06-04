#!/usr/bin/env node
/**
 * validate_export.js — post-export quality gate for EzGo banner / header PNGs.
 *
 * Two ways to run:
 *
 *   1. CLI (rich, metadata-aware) — called explicitly by canva-designer in `compose`
 *      right after the export is downloaded, because only the agent knows the text
 *      colour + where the text / logo were placed:
 *        node scripts/validate_export.js \
 *          --input  ./output/<sid>/final/banner_310x600.png \
 *          --kind   banner \
 *          [--text-color "#FFFFFF"] \
 *          [--text-region x,y,w,h]   (repeatable — one per text block) \
 *          [--logo-region x,y,w,h] \
 *          [--large-text]            (relax contrast threshold to WCAG AA-large 3:1)
 *
 *   2. Hook (--hook) — registered as a PostToolUse hook on the Canva `export-design`
 *      MCP tool. It reads the hook JSON from stdin, resolves a PNG (a local path or a
 *      download URL inside the tool response), and runs only the metadata-free checks
 *      (dimensions + not-blank). On a HARD failure it prints the reason to stderr and
 *      exits 2 so Claude Code surfaces it to the orchestrator; otherwise it exits 0.
 *      It never throws the conversation off the rails — any internal error → exit 0.
 *
 * Checks (each runs only when its inputs are present):
 *   dimensions   always              exact 310x600 (banner) / 1366x200 (header)   HARD
 *   not_blank    always              image is not one flat colour / empty          HARD
 *   contrast     text-color+region   WCAG AA: >=4.5:1 (>=3:1 with --large-text)    SOFT
 *   logo_size    logo-region         <=35% banner width / <=200px header, >=60px   SOFT
 *   legibility   text-region         edge density under the text < 30% (busy bg)   SOFT
 *
 * HARD failure  → pass:false, exit 1 (CLI) / exit 2 (--hook).
 * SOFT failure  → pass:false, exit 0  (surfaced to the user, who decides to proceed).
 * All pass      → pass:true,  exit 0.
 *
 * Output: a single JSON line:
 *   { ok, pass, kind, input, checks:[{name,pass,severity,value,threshold,detail}], warnings:[] }
 *
 * Requires: sharp (npm install sharp).
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.error(JSON.stringify({ ok: false, pass: false, error: "sharp not installed. Run: npm install sharp" }));
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Tunable thresholds (single place, so they're easy to calibrate later)
// ---------------------------------------------------------------------------
const TARGETS = {
  banner: { width: 310, height: 600 },
  header: { width: 1366, height: 200 },
};
const BLANK_STDEV_MAX = 2.5;        // max per-channel stdev to call an image "flat/blank"
const CONTRAST_AA = 4.5;            // WCAG AA normal text
const CONTRAST_AA_LARGE = 3.0;      // WCAG AA large text (>=24px / >=18.66px bold)
const TEXT_PIXEL_DIST = 60;         // RGB distance under which a pixel counts as "text", not "background"
const LEGIBILITY_EDGE_MAG = 40;     // |dx|+|dy| on luma above which a pixel is an "edge"
const LEGIBILITY_BUSY_FRAC = 0.30;  // >30% edge pixels under the text → "busy background"
const LOGO_MAX_PCT_BANNER = 35;     // logo <= 35% of banner width
const LOGO_MAX_PX_HEADER = 200;     // logo <= 200px wide on the header
const LOGO_MIN_PX = 60;             // logo too small to read below this

// ---------------------------------------------------------------------------
// Arg parsing — supports repeated flags (collected into arrays) and booleans.
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true; // boolean flag
      } else {
        if (out[key] === undefined) out[key] = next;
        else if (Array.isArray(out[key])) out[key].push(next);
        else out[key] = [out[key], next];
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function asArray(v) {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function parseRegion(str) {
  // "x,y,w,h" -> {left,top,width,height}; returns null if malformed.
  const parts = String(str).split(",").map((s) => Number(s.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [left, top, width, height] = parts.map((n) => Math.round(n));
  if (width <= 0 || height <= 0 || left < 0 || top < 0) return null;
  return { left, top, width, height };
}

function clampRegion(r, meta) {
  // Keep the region inside the image; return null if it collapses.
  const left = Math.min(Math.max(0, r.left), meta.width - 1);
  const top = Math.min(Math.max(0, r.top), meta.height - 1);
  const width = Math.min(r.width, meta.width - left);
  const height = Math.min(r.height, meta.height - top);
  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

function parseHexColor(str) {
  if (!str || str === true) return null;
  const h = String(str).replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------
function relLuminance({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(c1, c2) {
  const L1 = relLuminance(c1);
  const L2 = relLuminance(c2);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbDist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

// ---------------------------------------------------------------------------
// Pixel helpers
// ---------------------------------------------------------------------------
async function regionRgb(input, region) {
  // Returns { data: Buffer(RGB), width, height } for a region (alpha removed).
  const { data, info } = await sharp(input)
    .extract(region)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/**
 * Estimate the background colour behind the text. The region contains both text
 * pixels (close to textColor) and background pixels. We average the pixels that are
 * NOT text-like; if everything is text-like we fall back to the plain region mean.
 */
function estimateBackground(rgb, textColor) {
  const { data, channels } = rgb;
  let bgR = 0, bgG = 0, bgB = 0, bgN = 0;
  let allR = 0, allG = 0, allB = 0, allN = 0;
  for (let i = 0; i + 2 < data.length; i += channels) {
    const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
    allR += px.r; allG += px.g; allB += px.b; allN++;
    if (!textColor || rgbDist(px, textColor) > TEXT_PIXEL_DIST) {
      bgR += px.r; bgG += px.g; bgB += px.b; bgN++;
    }
  }
  if (bgN > 0) return { r: bgR / bgN, g: bgG / bgN, b: bgB / bgN, fraction: bgN / allN };
  if (allN > 0) return { r: allR / allN, g: allG / allN, b: allB / allN, fraction: 1 };
  return null;
}

/** Edge density on the luma channel via a cheap |dx|+|dy| gradient. */
async function edgeDensity(input, region) {
  const { data, info } = await sharp(input)
    .extract(region)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  if (w < 3 || h < 3) return null;
  let edges = 0, total = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const dx = Math.abs(data[idx + 1] - data[idx - 1]);
      const dy = Math.abs(data[idx + w] - data[idx - w]);
      if (dx + dy > LEGIBILITY_EDGE_MAG) edges++;
      total++;
    }
  }
  return total > 0 ? edges / total : null;
}

// ---------------------------------------------------------------------------
// Core validation — returns a result object (does not exit).
// ---------------------------------------------------------------------------
async function validate({ input, kind, textColor, textRegions, logoRegion, largeText }) {
  const checks = [];
  const warnings = [];

  const meta = await sharp(input).metadata();
  const target = kind ? TARGETS[kind] : null;

  // 1. dimensions (HARD) — only when we know the kind / target.
  if (target) {
    const ok = meta.width === target.width && meta.height === target.height;
    checks.push({
      name: "dimensions",
      pass: ok,
      severity: "hard",
      value: `${meta.width}x${meta.height}`,
      threshold: `${target.width}x${target.height}`,
      detail: ok ? "exact match" : "dimension mismatch",
    });
  }

  // 2. not_blank (HARD) — flat single-colour or empty export.
  const stats = await sharp(input).stats();
  const rgbChannels = stats.channels.slice(0, 3);
  const maxStdev = Math.max(...rgbChannels.map((c) => c.stdev));
  const notBlank = maxStdev > BLANK_STDEV_MAX;
  checks.push({
    name: "not_blank",
    pass: notBlank,
    severity: "hard",
    value: Number(maxStdev.toFixed(2)),
    threshold: `> ${BLANK_STDEV_MAX}`,
    detail: notBlank ? "image has visual variation" : "image is flat / near-uniform (blank export?)",
  });

  // 3. contrast (SOFT) — per text region, when a text colour is supplied.
  const minContrast = largeText ? CONTRAST_AA_LARGE : CONTRAST_AA;
  if (textColor && textRegions.length > 0) {
    for (let i = 0; i < textRegions.length; i++) {
      const raw = textRegions[i];
      const region = clampRegion(raw, meta);
      if (!region) {
        warnings.push(`text-region ${i} (${raw.left},${raw.top},${raw.width},${raw.height}) is outside the image — skipped`);
        continue;
      }
      const rgb = await regionRgb(input, region);
      const bg = estimateBackground(rgb, textColor);
      if (!bg) {
        warnings.push(`text-region ${i}: could not sample background`);
        continue;
      }
      const ratio = contrastRatio(textColor, { r: bg.r, g: bg.g, b: bg.b });
      const ok = ratio >= minContrast;
      checks.push({
        name: textRegions.length > 1 ? `contrast[${i}]` : "contrast",
        pass: ok,
        severity: "soft",
        value: Number(ratio.toFixed(2)),
        threshold: `>= ${minContrast}:1`,
        detail: `text #${rgbHex(textColor)} vs bg ~#${rgbHex(bg)} (bg sampled from ${Math.round(bg.fraction * 100)}% of region)`,
      });
      if (!ok) warnings.push(`low contrast ${ratio.toFixed(2)}:1 in text-region ${i} (need ${minContrast}:1)`);
    }
  }

  // 4. legibility (SOFT) — edge density of the background under the text.
  if (textRegions.length > 0) {
    for (let i = 0; i < textRegions.length; i++) {
      const region = clampRegion(textRegions[i], meta);
      if (!region) continue;
      const density = await edgeDensity(input, region);
      if (density === null) continue;
      const ok = density < LEGIBILITY_BUSY_FRAC;
      checks.push({
        name: textRegions.length > 1 ? `legibility[${i}]` : "legibility",
        pass: ok,
        severity: "soft",
        value: Number((density * 100).toFixed(1)),
        threshold: `< ${LEGIBILITY_BUSY_FRAC * 100}%`,
        detail: ok ? "background under text is calm" : "busy background under text — may hurt readability",
      });
      if (!ok) warnings.push(`busy background under text-region ${i} (${(density * 100).toFixed(1)}% edges)`);
    }
  }

  // 5. logo_size (SOFT)
  if (logoRegion) {
    const region = clampRegion(logoRegion, meta);
    if (region) {
      let ok, value, threshold, detail;
      if (kind === "banner") {
        const pct = (region.width / TARGETS.banner.width) * 100;
        ok = pct <= LOGO_MAX_PCT_BANNER && region.width >= LOGO_MIN_PX;
        value = `${Math.round(pct)}% (${region.width}px)`;
        threshold = `<= ${LOGO_MAX_PCT_BANNER}% & >= ${LOGO_MIN_PX}px`;
        detail = region.width < LOGO_MIN_PX ? "logo too small to read" : ok ? "logo within bounds" : "logo too wide";
      } else {
        ok = region.width <= LOGO_MAX_PX_HEADER && region.width >= LOGO_MIN_PX;
        value = `${region.width}px`;
        threshold = `<= ${LOGO_MAX_PX_HEADER}px & >= ${LOGO_MIN_PX}px`;
        detail = region.width < LOGO_MIN_PX ? "logo too small to read" : ok ? "logo within bounds" : "logo too wide";
      }
      checks.push({ name: "logo_size", pass: ok, severity: "soft", value, threshold, detail });
      if (!ok) warnings.push(`logo_size out of bounds: ${value} (${detail})`);
    }
  }

  const hardFail = checks.some((c) => c.severity === "hard" && !c.pass);
  const pass = checks.every((c) => c.pass);
  return { ok: true, pass, hardFail, kind: kind || null, input, dimensions: `${meta.width}x${meta.height}`, checks, warnings };
}

function rgbHex(c) {
  const to = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `${to(c.r)}${to(c.g)}${to(c.b)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Hook mode — resolve a PNG out of the PostToolUse stdin payload, run the
// metadata-free checks, exit 2 on a hard failure, 0 otherwise. Never crashes.
// ---------------------------------------------------------------------------
function readStdin() {
  // Synchronous read of fd 0 — robust to how the parent delivers the payload
  // (a shell pipe vs spawn-with-input). Event-based reading can silently miss
  // data that arrived/ended before listeners attach. Hook stdin is always piped.
  if (process.stdin.isTTY) return "";
  try {
    return fs.readFileSync(0, "utf8");
  } catch (_) {
    return "";
  }
}

function collectStrings(node, acc, depth = 0) {
  if (depth > 8 || node == null) return;
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) for (const v of node) collectStrings(v, acc, depth + 1);
  else if (typeof node === "object") for (const k of Object.keys(node)) collectStrings(node[k], acc, depth + 1);
}

function inferKind(name, meta) {
  if (/banner|310x600|310-600/i.test(name)) return "banner";
  if (/header|1366x200|1366-200/i.test(name)) return "header";
  if (meta) {
    if (meta.width === TARGETS.banner.width && meta.height === TARGETS.banner.height) return "banner";
    if (meta.width === TARGETS.header.width && meta.height === TARGETS.header.height) return "header";
  }
  return null;
}

async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return dest;
}

async function runHookMode() {
  try {
    const raw = await readStdin();
    let payload = {};
    try { payload = JSON.parse(raw); } catch (_) { /* not JSON → nothing to do */ }

    const strings = [];
    collectStrings(payload.tool_response, strings);
    collectStrings(payload.tool_input, strings);

    // Prefer an existing local .png; else the first http(s) image URL.
    let localPng = strings.find((s) => /\.png$/i.test(s) && fs.existsSync(s));
    let tmp = null;
    if (!localPng) {
      const url = strings.find((s) => /^https?:\/\//i.test(s) && /\.png(\?|$)/i.test(s));
      if (url) {
        tmp = path.join(os.tmpdir(), `ezgo_export_${Date.now()}.png`);
        try { localPng = await downloadTo(url, tmp); } catch (_) { localPng = null; }
      }
    }

    if (!localPng) {
      // Nothing we can validate — stay silent, never block.
      process.exit(0);
    }

    const meta = await sharp(localPng).metadata();
    const kind = inferKind(localPng, meta);
    const result = await validate({ input: localPng, kind, textColor: null, textRegions: [], logoRegion: null, largeText: false });
    result.mode = "hook";
    if (tmp) { try { fs.unlinkSync(tmp); } catch (_) {} }

    if (result.hardFail) {
      // Exit 2 → Claude Code feeds stderr back to the orchestrator.
      console.error(JSON.stringify(result));
      process.exit(2);
    }
    if (process.env.VALIDATE_EXPORT_VERBOSE) console.log(JSON.stringify(result));
    process.exit(0);
  } catch (_) {
    // A validation hiccup must never break the session.
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async function main() {
  const args = parseArgs(process.argv);

  if (args.hook) {
    await runHookMode();
    return;
  }

  const input = args.input;
  const kind = args.kind;
  if (!input || !kind) {
    console.error("Usage: node scripts/validate_export.js --input <png> --kind banner|header [--text-color #hex] [--text-region x,y,w,h ...] [--logo-region x,y,w,h] [--large-text]");
    console.error("       node scripts/validate_export.js --hook   (PostToolUse mode; reads stdin)");
    process.exit(2);
  }
  if (!TARGETS[kind]) {
    console.error(JSON.stringify({ ok: false, pass: false, error: `unknown kind: ${kind} (use banner|header)` }));
    process.exit(2);
  }
  if (!fs.existsSync(input)) {
    console.error(JSON.stringify({ ok: false, pass: false, error: `input not found: ${input}` }));
    process.exit(2);
  }

  const textColor = parseHexColor(args["text-color"]);
  if (args["text-color"] && !textColor) {
    console.error(JSON.stringify({ ok: false, pass: false, error: `bad --text-color: ${args["text-color"]} (expected #RRGGBB)` }));
    process.exit(2);
  }
  const textRegions = asArray(args["text-region"]).map(parseRegion).filter(Boolean);
  const logoRegion = args["logo-region"] ? parseRegion(args["logo-region"]) : null;

  try {
    const result = await validate({ input, kind, textColor, textRegions, logoRegion, largeText: !!args["large-text"] });
    console.log(JSON.stringify(result));
    process.exit(result.hardFail ? 1 : 0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, pass: false, error: String(err && err.message) }));
    process.exit(1);
  }
})();
