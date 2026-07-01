#!/usr/bin/env node
/**
 * gemini_image.js — generate a single image via Google Gemini ("Nano Banana").
 *
 * This is the EzGo banner system's PRIMARY image engine (replaces openai_image.js).
 * Unlike gpt-image, Nano Banana renders text (incl. Hebrew) and can compose a
 * FULL design conditioned on reference images (logo + style examples). See the
 * `--ref` flag — this is what enables "full-design" mode where the model emits a
 * complete banner (background + Hebrew headline + logo placement) in one shot.
 *
 * Usage:
 *   node scripts/gemini_image.js \
 *     --prompt "..." \
 *     --out path/to/output.png \
 *     [--size 310x600]                  # target W×H → nearest supported aspect ratio
 *     [--aspect 9:16]                   # explicit aspect ratio (overrides --size)
 *     [--ref path/to/logo.png]          # reference image (repeatable: pass --ref N times)
 *     [--ref path/to/example.png]
 *     [--model gemini-3-pro-image-preview]
 *     [--retries 3]
 *
 * Reads GEMINI_API_KEY from environment (or from .env in cwd / main repo root).
 * Output dimensions are approximate (the model emits its own pixel size for the
 * chosen aspect ratio) — ALWAYS run scripts/resize.js afterward to hit the exact
 * final dimensions (banner 310×600, header 1366×200).
 *
 * Returns a one-line JSON envelope: { ok, path, bytes, attempt, model } on success,
 * { ok:false, error } on failure (after retries). Exits 0 / non-zero accordingly.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// --- minimal .env loader (no external deps) — identical strategy to openai_image.js ---
// Loads cwd/.env, then falls back to the MAIN repo root's .env (scripts often run
// from a git worktree with no .env of its own). Values already in process.env win.
function parseDotEnv(envPath) {
  if (!envPath || !fs.existsSync(envPath)) return;
  const txt = fs.readFileSync(envPath, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
}

function mainRepoRoot() {
  try {
    let r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
    let commonDir = r.status === 0 && r.stdout ? r.stdout.trim() : "";
    if (!commonDir) {
      r = spawnSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" });
      if (r.status === 0 && r.stdout) commonDir = path.resolve(process.cwd(), r.stdout.trim());
    }
    if (commonDir) return path.dirname(commonDir); // parent of .git == repo root
  } catch (_) {}
  return null;
}

function loadDotEnv() {
  parseDotEnv(path.join(process.cwd(), ".env")); // 1) cwd (worktree or main)
  const root = mainRepoRoot();                    // 2) fallback: main repo root .env
  if (root && path.resolve(root) !== path.resolve(process.cwd())) {
    parseDotEnv(path.join(root, ".env"));
  }
}
loadDotEnv();

// --- arg parsing — supports a repeatable --ref flag (collected into an array) ---
function parseArgs(argv) {
  const out = { ref: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (key === "ref") {
        if (val !== undefined) { out.ref.push(val); i++; }
      } else {
        out[key] = val;
        i++;
      }
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const prompt = args.prompt;
const outPath = args.out;
const size = args.size;            // optional "WxH"
const refs = args.ref;             // array of reference image paths
const model = args.model || process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const maxRetries = parseInt(args.retries || "3", 10);

if (!prompt || !outPath) {
  console.error("Usage: node scripts/gemini_image.js --prompt <p> --out <path> [--size WxH] [--aspect 9:16] [--ref img]...");
  process.exit(2);
}
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set (env or .env). Get one at https://aistudio.google.com/apikey");
  process.exit(2);
}

// --- aspect ratio: map a target WxH to the nearest Gemini-supported ratio ---
// Gemini image models accept a fixed set of aspect ratios, not arbitrary pixel
// sizes. We pick the closest one; resize.js then forces the exact final dims.
const SUPPORTED_ASPECTS = [
  ["1:1", 1 / 1], ["2:3", 2 / 3], ["3:2", 3 / 2], ["3:4", 3 / 4], ["4:3", 4 / 3],
  ["4:5", 4 / 5], ["5:4", 5 / 4], ["9:16", 9 / 16], ["16:9", 16 / 9], ["21:9", 21 / 9],
];
function nearestAspect(w, h) {
  const target = w / h;
  let best = SUPPORTED_ASPECTS[0];
  let bestDiff = Infinity;
  for (const a of SUPPORTED_ASPECTS) {
    const d = Math.abs(a[1] - target);
    if (d < bestDiff) { bestDiff = d; best = a; }
  }
  return best[0];
}
let aspect = args.aspect || null;
if (!aspect && size) {
  const m = /^(\d+)x(\d+)$/i.exec(size.trim());
  if (m) aspect = nearestAspect(parseInt(m[1], 10), parseInt(m[2], 10));
}

// --- read a reference image into an inline-data part ---
function mimeFromExt(p) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}
function refPart(p) {
  if (!fs.existsSync(p)) throw new Error(`reference image not found: ${p}`);
  const data = fs.readFileSync(p).toString("base64");
  return { inlineData: { mimeType: mimeFromExt(p), data } };
}

// ensure output dir exists
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clean exit that dodges an intermittent Windows/libuv crash:
//   "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"
// which fires when process.exit() runs at the moment undici (global fetch) is
// closing a keep-alive TLS socket. We set exitCode and let the event loop drain
// NATURALLY (no process.exit → no assertion). undici's keep-alive socket can hold
// the loop open for a few seconds, so an unref'd timer force-exits after a short
// quiet window — by then the socket is idle (not mid-close), so exiting is safe.
// The JSON envelope is already printed before this, so callers must key off the
// JSON line, not the exit code.
function cleanExit(code) {
  process.exitCode = code;
  setTimeout(() => process.exit(code), 150).unref();
}

async function callGemini() {
  // Order matters for editing/compositing: reference images first, then the text
  // instruction that tells the model what to do with them.
  const parts = [];
  for (const r of refs) parts.push(refPart(r));
  parts.push({ text: prompt });

  const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };
  if (aspect) generationConfig.imageConfig = { aspectRatio: aspect };

  const body = { contents: [{ role: "user", parts }], generationConfig };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status === 503) {
    throw Object.assign(new Error(res.status === 429 ? "rate_limited" : "overloaded"), { status: res.status });
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = await res.json();

  // Safety / empty-candidate handling.
  if (json.promptFeedback && json.promptFeedback.blockReason) {
    throw new Error(`blocked by safety: ${json.promptFeedback.blockReason}`);
  }
  const cand = json.candidates && json.candidates[0];
  if (!cand) throw new Error("Gemini returned no candidates");

  const outParts = (cand.content && cand.content.parts) || [];
  let inline = null;
  let textBlurb = "";
  for (const p of outParts) {
    const id = p.inlineData || p.inline_data;
    if (id && id.data) { inline = id; break; }
    if (p.text) textBlurb += p.text;
  }
  if (!inline) {
    const reason = cand.finishReason ? ` (finishReason=${cand.finishReason})` : "";
    const hint = textBlurb ? ` model said: ${textBlurb.slice(0, 200)}` : "";
    throw new Error(`no image in response${reason}.${hint}`);
  }

  const buf = Buffer.from(inline.data, "base64");
  if (buf.length < 1024) throw new Error(`suspiciously small image (${buf.length} bytes) — likely empty`);
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

(async () => {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bytes = await callGemini();
      console.log(JSON.stringify({ ok: true, path: outPath, bytes, attempt, model }));
      cleanExit(0);
      return;
    } catch (err) {
      lastErr = err;
      if ((err.status === 429 || err.status === 503) && attempt < maxRetries) {
        const wait = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.error(`${err.status} ${err.message}; retrying in ${wait}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(wait);
        continue;
      }
      if (attempt < maxRetries) {
        await sleep(500);
        continue;
      }
    }
  }
  console.error(JSON.stringify({ ok: false, error: String(lastErr && lastErr.message) }));
  cleanExit(1);
})();
