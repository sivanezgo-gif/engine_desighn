#!/usr/bin/env node
/**
 * compose_banner.js — Compose a banner/header by layering:
 *   1. background image (resized to final dims)
 *   2. semi-transparent overlay for text legibility
 *   3. headline text (RTL Hebrew, via sharp Pango)
 *   4. logo (optional, PNG with transparency)
 *
 * Usage:
 *   node scripts/compose_banner.js \
 *     --bg ./path/banner_bg_310x600.png \
 *     --kind banner|header \
 *     --text "כותרת בעברית" \
 *     --variant v1_balanced|v2_bold|v3_minimal|header \
 *     --primary "#937661" \
 *     --secondary "#2e1a13" \
 *     --logo ./path/clean_logo.png \
 *     --out ./path/output.png
 *
 * Outputs: JSON line {ok, path, dimensions, variant, warnings:[]}
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1];
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

function relLuminance({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(a, b) {
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

// Choose text colour that passes WCAG AA against a given overlay bg
function chooseTextColor(primaryHex, secondaryHex, overlayRgb) {
  const candidates = [
    hexToRgb(primaryHex),
    hexToRgb(secondaryHex),
    { r: 255, g: 255, b: 255 },
    { r: 26, g: 26, b: 26 },
  ].filter(Boolean);

  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const r = contrastRatio(c, overlayRgb);
    if (r > bestRatio) { bestRatio = r; best = c; }
  }
  return {
    rgb: best,
    hex: "#" + [best.r, best.g, best.b].map(c => c.toString(16).padStart(2, "0")).join(""),
    ratio: bestRatio,
  };
}

// Variant configuration
const VARIANT_CONFIGS = {
  v1_balanced: {
    // Headline: centred, moderate size, auto-contrast colour
    // Overlay: darker bottom third so brand-warm text pops
    overlayAlpha: 0.65,
    overlayPosition: "bottom-third",  // covers bottom 200px of 600
    textGravity: "south",
    textMarginBottom: 80,
    fontSizeMultiplier: 1.0,
    useSecondary: false,
    forceLight: true,   // force near-white text for contrast on dark overlay
    logoMaxWidthPct: 0.30,
    logoGravity: "northeast",  // top-right
    logoMargin: 18,
    kind: "banner",
  },
  v2_bold: {
    // Headline: upper area, larger, accent secondary colour
    overlayAlpha: 0.60,
    overlayPosition: "top-third",
    textGravity: "north",
    textMarginTop: 60,
    fontSizeMultiplier: 1.15,
    useSecondary: true,
    logoMaxWidthPct: 0.25,
    logoGravity: "southwest",  // bottom-left
    logoMargin: 20,
    kind: "banner",
  },
  v3_minimal: {
    // Headline: centred, slightly smaller, clean warm-cream on medium overlay
    overlayAlpha: 0.55,
    overlayPosition: "center-stripe",
    textGravity: "centre",
    forceLight: true,   // force near-white text
    fontSizeMultiplier: 0.90,
    useSecondary: false,
    logoMaxWidthPct: 0.20,
    logoGravity: "northwest",  // top-left
    logoMargin: 16,
    kind: "banner",
  },
  header: {
    // Header: wide format, centred text
    overlayAlpha: 0.40,
    overlayPosition: "full",
    textGravity: "centre",
    fontSizeMultiplier: 1.0,
    useSecondary: false,
    logoMaxWidthPct: 0,  // no logo on header
    kind: "header",
  },
};

const DIMS = {
  banner: { width: 310, height: 600 },
  header: { width: 1366, height: 200 },
};

async function compose(args) {
  const {
    bg, kind = "banner", text, variant = "v1_balanced",
    primary = "#937661", secondary = "#2e1a13",
    logo, out,
  } = args;

  if (!bg || !text || !out) {
    throw new Error("--bg, --text, --out are required");
  }

  const cfg = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.v1_balanced;
  const dims = DIMS[kind];
  if (!dims) throw new Error("--kind must be banner or header");

  fs.mkdirSync(path.dirname(out), { recursive: true });

  const warnings = [];
  const layers = [];

  // 1. Background (already resized by resize.js)
  const bgBuf = await sharp(bg)
    .resize(dims.width, dims.height, { fit: "fill" })
    .toBuffer();
  layers.push({ input: bgBuf, top: 0, left: 0 });

  // 2. Semi-transparent overlay for text legibility
  const overlayRgb = { r: 30, g: 20, b: 14 };  // near-black warm
  const overlayAlpha = cfg.overlayAlpha;
  let overlayTop = 0, overlayLeft = 0, overlayW = dims.width, overlayH = dims.height;

  if (cfg.overlayPosition === "bottom-third") {
    overlayTop = Math.round(dims.height * 0.60);
    overlayH = dims.height - overlayTop;
  } else if (cfg.overlayPosition === "top-third") {
    overlayTop = 0;
    overlayH = Math.round(dims.height * 0.40);
  } else if (cfg.overlayPosition === "center-stripe") {
    overlayTop = Math.round(dims.height * 0.35);
    overlayH = Math.round(dims.height * 0.30);
  }
  // "full" = entire bg

  const overlaySvg = `<svg width="${overlayW}" height="${overlayH}">
    <rect width="${overlayW}" height="${overlayH}" fill="rgb(${overlayRgb.r},${overlayRgb.g},${overlayRgb.b})" fill-opacity="${overlayAlpha}"/>
  </svg>`;
  const overlayBuf = Buffer.from(overlaySvg);
  layers.push({ input: overlayBuf, top: overlayTop, left: overlayLeft });

  // 3. Headline text
  // Choose a contrasting text colour against the overlay blend
  const blendedBg = {
    r: Math.round(overlayRgb.r * overlayAlpha + 128 * (1 - overlayAlpha)),
    g: Math.round(overlayRgb.g * overlayAlpha + 128 * (1 - overlayAlpha)),
    b: Math.round(overlayRgb.b * overlayAlpha + 128 * (1 - overlayAlpha)),
  };

  // Brand warm cream — used as a light text option when overlay is dark
  const BRAND_CREAM = "#F5EDE3";
  const CREAM_RGB = { r: 245, g: 237, b: 227 };

  let textColorHex;
  if (cfg.forceLight) {
    // Force light (cream or white) — for dark overlays where brand primary blends in
    const creamContrast = contrastRatio(CREAM_RGB, blendedBg);
    const whiteContrast = contrastRatio({ r: 255, g: 255, b: 255 }, blendedBg);
    textColorHex = creamContrast >= 4.5 ? BRAND_CREAM : "#FFFFFF";
  } else if (cfg.useSecondary) {
    // Try secondary first; fall back if poor contrast
    const secRgb = hexToRgb(secondary);
    if (secRgb && contrastRatio(secRgb, blendedBg) >= 4.5) {
      textColorHex = secondary;
    } else {
      // Secondary may be too dark too — choose best option
      textColorHex = chooseTextColor(primary, BRAND_CREAM, blendedBg).hex;
    }
  } else {
    // Auto: try primary, cream, white, dark — pick best contrast
    const choices = [
      { hex: primary, rgb: hexToRgb(primary) },
      { hex: BRAND_CREAM, rgb: CREAM_RGB },
      { hex: "#FFFFFF", rgb: { r: 255, g: 255, b: 255 } },
    ].filter(c => c.rgb);
    let best = choices[0];
    for (const c of choices) {
      if (contrastRatio(c.rgb, blendedBg) > contrastRatio(best.rgb, blendedBg)) best = c;
    }
    textColorHex = best.hex;
  }

  // Calculate contrast ratio for warnings
  const textRgb = hexToRgb(textColorHex);
  const contrastVal = textRgb ? contrastRatio(textRgb, blendedBg) : 0;
  if (contrastVal < 3.0) {
    warnings.push(`contrast_low:${contrastVal.toFixed(1)}:1`);
  }

  // Font sizes: banner base=28, header base=32
  const baseFontSize = kind === "header" ? 32 : 28;
  const fontSize = Math.round(baseFontSize * cfg.fontSizeMultiplier);

  // Text area width
  const textAreaWidth = kind === "header"
    ? Math.round(dims.width * 0.60)   // centre third of header
    : Math.round(dims.width * 0.82);  // most of banner width

  const textAreaHeight = kind === "header"
    ? Math.round(dims.height * 0.65)
    : Math.round(dims.height * 0.22);

  const textPng = await sharp({
    text: {
      text: `<span foreground="${textColorHex}" weight="bold" size="${fontSize * 1024}">${escapePango(text)}</span>`,
      rgba: true,
      width: textAreaWidth,
      height: textAreaHeight,
      align: "center",
      font: "Arial",
      wrap: "word",
    },
  }).png().toBuffer();

  // Position text based on gravity + variant
  const textMeta = await sharp(textPng).metadata();
  let textTop, textLeft;
  textLeft = Math.round((dims.width - textMeta.width) / 2);

  if (cfg.textGravity === "south") {
    textTop = dims.height - textMeta.height - (cfg.textMarginBottom || 40);
  } else if (cfg.textGravity === "north") {
    textTop = cfg.textMarginTop || 50;
  } else {
    // centre
    textTop = Math.round((dims.height - textMeta.height) / 2);
    if (kind === "header") {
      textTop = Math.round((dims.height - textMeta.height) / 2);
      textLeft = Math.round((dims.width - textMeta.width) / 2);
    }
  }

  // Clamp
  textTop = Math.max(0, Math.min(textTop, dims.height - textMeta.height));
  textLeft = Math.max(0, Math.min(textLeft, dims.width - textMeta.width));

  layers.push({ input: textPng, top: textTop, left: textLeft });

  // 4. Logo (banner only, skip header)
  if (logo && fs.existsSync(logo) && cfg.logoMaxWidthPct > 0) {
    const maxLogoW = Math.round(dims.width * cfg.logoMaxWidthPct);
    const minLogoW = 60;
    const logoW = Math.max(minLogoW, maxLogoW);

    const logoBuf = await sharp(logo)
      .resize(logoW, logoW, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const logoMeta = await sharp(logoBuf).metadata();
    const margin = cfg.logoMargin || 16;
    let logoTop, logoLeft;

    if (cfg.logoGravity === "northeast") {
      logoTop = margin;
      logoLeft = dims.width - logoMeta.width - margin;
    } else if (cfg.logoGravity === "northwest") {
      logoTop = margin;
      logoLeft = margin;
    } else if (cfg.logoGravity === "southwest") {
      logoTop = dims.height - logoMeta.height - margin;
      logoLeft = margin;
    } else {
      logoTop = margin;
      logoLeft = dims.width - logoMeta.width - margin;
    }

    layers.push({ input: logoBuf, top: logoTop, left: logoLeft });

    const logoWidthPct = logoMeta.width / dims.width;
    if (logoWidthPct > 0.35) {
      warnings.push(`logo_too_large:${(logoWidthPct * 100).toFixed(0)}%`);
    }
  }

  // Compose all layers
  const base = await sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 3,
      background: { r: 245, g: 237, b: 227 },  // brand bg fallback
    },
  })
    .composite(layers)
    .png()
    .toFile(out);

  // Verify dimensions
  const meta = await sharp(out).metadata();
  if (meta.width !== dims.width || meta.height !== dims.height) {
    throw new Error(`DIM_MISMATCH: got ${meta.width}x${meta.height}, expected ${dims.width}x${dims.height}`);
  }

  return { ok: true, path: out, dimensions: `${meta.width}x${meta.height}`, variant, warnings };
}

// ── CLI entry ────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv);
compose(args)
  .then(r => { console.log(JSON.stringify(r)); })
  .catch(e => {
    console.error(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
    process.exit(1);
  });
