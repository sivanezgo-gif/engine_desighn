#!/usr/bin/env node
/**
 * openai_image.js — generate a single image via OpenAI Images API.
 *
 * Usage:
 *   node scripts/openai_image.js \
 *     --prompt "..." \
 *     --size 1024x1984 \
 *     --out path/to/output.png \
 *     [--model gpt-image-2] \
 *     [--quality medium] \
 *     [--retries 3]
 *
 * Reads OPENAI_API_KEY from environment (or from .env in cwd).
 * Exits 0 on success, non-zero on failure (after retries).
 */

const fs = require("fs");
const path = require("path");

// --- minimal .env loader (no external deps) ---
function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
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
loadDotEnv();

// --- arg parsing ---
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      out[key] = val;
      i++;
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const prompt = args.prompt;
const size = args.size;
const outPath = args.out;
const model = args.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const quality = args.quality || process.env.OPENAI_IMAGE_QUALITY || "medium";
const maxRetries = parseInt(args.retries || "3", 10);

if (!prompt || !size || !outPath) {
  console.error("Usage: node scripts/openai_image.js --prompt <p> --size WxH --out <path>");
  process.exit(2);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not set (env or .env)");
  process.exit(2);
}

// ensure output dir exists
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// --- exponential backoff helper ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callOpenAI() {
  const body = {
    model,
    prompt,
    size,
    quality,
    n: 1,
  };

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw Object.assign(new Error("rate_limited"), { status: 429 });
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 500)}`);
  }
  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) throw new Error("OpenAI returned empty data array");

  // Image API returns either b64_json or url depending on response_format
  let buf;
  if (item.b64_json) {
    buf = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    const dl = await fetch(item.url);
    if (!dl.ok) throw new Error(`download failed: ${dl.status}`);
    buf = Buffer.from(await dl.arrayBuffer());
  } else {
    throw new Error("OpenAI response had neither b64_json nor url");
  }
  if (buf.length < 1024) throw new Error(`suspiciously small image (${buf.length} bytes) — likely empty`);
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

(async () => {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bytes = await callOpenAI();
      console.log(JSON.stringify({ ok: true, path: outPath, bytes, attempt }));
      process.exit(0);
    } catch (err) {
      lastErr = err;
      if (err.status === 429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.error(`429 rate limit; retrying in ${wait}ms (attempt ${attempt}/${maxRetries})`);
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
  process.exit(1);
})();
