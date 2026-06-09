#!/usr/bin/env node
/**
 * brand_db.js — SQLite-backed brand/client/session/palette/headline/asset registry.
 *
 * Stores all per-client data in a single SQLite file (output/brands.db by default)
 * so the orchestrator and sub-agents can query cross-session brand consistency.
 *
 * Subcommands:
 *   init                                                       Create DB + tables (idempotent).
 *   insert-client       --slug X --name Y [--url U] [--type T]
 *   insert-session      --session-id S --client-slug X --status active|completed|aborted [--started-at iso] [--openai-calls N]
 *   finish-session      --session-id S --status completed|aborted [--ended-at iso] [--openai-calls N]
 *   insert-palette      --client-slug X --hex #RRGGBB --role primary|secondary|accent [--frequency F]
 *   insert-headline     --client-slug X --session-id S --text "..." --style direct|emotional|adventurous --language he|en
 *   insert-asset        --client-slug X --session-id S --type banner|header|logo|variant --path P [--canva-id C]
 *   find-similar-palette --hex #RRGGBB [--threshold 10] [--role primary]
 *   find-duplicate-headline --text "..." --language he [--business-type X] [--threshold 0.7]
 *   get-client-history  --slug X
 *   list-clients        [--limit N]
 *
 * Every subcommand prints a single JSON object to stdout: { ok: true, ... } or { ok: false, error: "..." }.
 * Exit code: 0 on success, non-zero on failure.
 *
 * DB path: $BRAND_DB_PATH env var, else ./output/brands.db (relative to cwd).
 *
 * Requires: Node.js 22+ (uses built-in node:sqlite module).
 */

const fs = require("fs");
const path = require("path");

let DatabaseSync;
try {
  ({ DatabaseSync } = require("node:sqlite"));
} catch (err) {
  console.error(
    JSON.stringify({
      ok: false,
      error: "node:sqlite not available. Requires Node 22+ (currently: " + process.version + ").",
    })
  );
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const cmd = args._[0];

if (!cmd) {
  console.error("Usage: node scripts/brand_db.js <subcommand> [--flags]");
  console.error("Subcommands: init, insert-client, insert-session, finish-session, insert-palette,");
  console.error("             insert-headline, insert-asset, find-similar-palette,");
  console.error("             find-duplicate-headline, get-client-history, list-clients");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------
function getDbPath() {
  if (process.env.BRAND_DB_PATH) return process.env.BRAND_DB_PATH;
  return path.join(process.cwd(), "output", "brands.db");
}

function openDb({ create = false } = {}) {
  const dbPath = getDbPath();
  if (!create && !fs.existsSync(dbPath)) {
    throw new Error(`DB not found at ${dbPath}. Run: node scripts/brand_db.js init`);
  }
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

// node:sqlite returns BigInt for lastInsertRowid. Convert for JSON safety.
function safeId(id) {
  if (typeof id === "bigint") return Number(id);
  return id;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  url           TEXT,
  business_type TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id    TEXT PRIMARY KEY,
  client_slug   TEXT NOT NULL,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  status        TEXT NOT NULL CHECK (status IN ('active', 'completed', 'aborted')),
  openai_calls  INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (client_slug) REFERENCES clients(slug)
);

CREATE TABLE IF NOT EXISTS palettes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_slug   TEXT NOT NULL,
  color_hex     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('primary', 'secondary', 'accent', 'background', 'text')),
  frequency     REAL NOT NULL DEFAULT 1.0,
  recorded_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(client_slug, color_hex, role),
  FOREIGN KEY (client_slug) REFERENCES clients(slug)
);

CREATE TABLE IF NOT EXISTS headlines (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_slug   TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  text          TEXT NOT NULL,
  style         TEXT NOT NULL CHECK (style IN ('direct', 'emotional', 'adventurous')),
  language      TEXT NOT NULL,
  chosen_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_slug) REFERENCES clients(slug),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE TABLE IF NOT EXISTS assets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_slug   TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  asset_type    TEXT NOT NULL CHECK (asset_type IN ('banner', 'header', 'logo', 'variant', 'background')),
  file_path     TEXT NOT NULL,
  canva_id      TEXT,
  exported_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_slug) REFERENCES clients(slug),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_palettes_client    ON palettes(client_slug);
CREATE INDEX IF NOT EXISTS idx_palettes_role      ON palettes(role);
CREATE INDEX IF NOT EXISTS idx_headlines_client   ON headlines(client_slug);
CREATE INDEX IF NOT EXISTS idx_headlines_language ON headlines(language);
CREATE INDEX IF NOT EXISTS idx_assets_session     ON assets(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client    ON sessions(client_slug);
`;

// ---------------------------------------------------------------------------
// Color math — ΔE76 (CIE76) for "are these colors visually similar?"
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`bad hex: ${hex}`);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// sRGB → linear
function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// linear RGB → XYZ (D65 illuminant)
function rgbToXyz(rgb) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return {
    x: (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    y: (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100,
    z: (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100,
  };
}

// XYZ → LAB (D65 reference white: 95.047, 100, 108.883)
function xyzToLab(xyz) {
  const Xn = 95.047, Yn = 100, Zn = 108.883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xyz.x / Xn);
  const fy = f(xyz.y / Yn);
  const fz = f(xyz.z / Zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

function deltaE76(lab1, lab2) {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2
  );
}

// ---------------------------------------------------------------------------
// Headline similarity — Jaccard on word tokens (language-agnostic)
// ---------------------------------------------------------------------------
function tokenize(text) {
  // Lowercase and split on whitespace+punctuation. Works for Hebrew, English, etc.
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-–—]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1.0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ---------------------------------------------------------------------------
// Subcommand dispatch
// ---------------------------------------------------------------------------
function require_(flag) {
  if (args[flag] === undefined || args[flag] === true) {
    throw new Error(`missing required --${flag}`);
  }
  return args[flag];
}

const subcommands = {
  init() {
    const db = openDb({ create: true });
    db.exec(SCHEMA);
    db.close();
    return { ok: true, path: getDbPath(), message: "schema applied" };
  },

  "insert-client"() {
    const slug = require_("slug");
    const name = require_("name");
    const url = args.url || null;
    const type = args.type || null;
    const db = openDb();
    const stmt = db.prepare(`
      INSERT INTO clients (slug, name, url, business_type)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        url = COALESCE(excluded.url, clients.url),
        business_type = COALESCE(excluded.business_type, clients.business_type),
        last_seen = datetime('now')
    `);
    const info = stmt.run(slug, name, url, type);
    db.close();
    return { ok: true, slug, changes: info.changes };
  },

  "insert-session"() {
    const sessionId = require_("session-id");
    const clientSlug = require_("client-slug");
    const status = args.status || "active";
    const startedAt = args["started-at"] || new Date().toISOString();
    const openaiCalls = parseInt(args["openai-calls"] || "0", 10);
    const db = openDb();
    const stmt = db.prepare(`
      INSERT INTO sessions (session_id, client_slug, started_at, status, openai_calls)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        status = excluded.status,
        openai_calls = excluded.openai_calls
    `);
    const info = stmt.run(sessionId, clientSlug, startedAt, status, openaiCalls);
    db.close();
    return { ok: true, session_id: sessionId, changes: info.changes };
  },

  "finish-session"() {
    const sessionId = require_("session-id");
    const status = require_("status");
    const endedAt = args["ended-at"] || new Date().toISOString();
    const openaiCalls = args["openai-calls"] !== undefined ? parseInt(args["openai-calls"], 10) : null;
    const db = openDb();
    let info;
    if (openaiCalls !== null) {
      info = db
        .prepare("UPDATE sessions SET status = ?, ended_at = ?, openai_calls = ? WHERE session_id = ?")
        .run(status, endedAt, openaiCalls, sessionId);
    } else {
      info = db
        .prepare("UPDATE sessions SET status = ?, ended_at = ? WHERE session_id = ?")
        .run(status, endedAt, sessionId);
    }
    db.close();
    return { ok: true, session_id: sessionId, changes: info.changes };
  },

  "insert-palette"() {
    const clientSlug = require_("client-slug");
    const hex = require_("hex");
    const role = require_("role");
    const freq = parseFloat(args.frequency || "1.0");
    hexToRgb(hex); // validate
    const db = openDb();
    const stmt = db.prepare(`
      INSERT INTO palettes (client_slug, color_hex, role, frequency)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(client_slug, color_hex, role) DO UPDATE SET
        frequency = excluded.frequency,
        recorded_at = datetime('now')
    `);
    const info = stmt.run(clientSlug, hex.toUpperCase(), role, freq);
    db.close();
    return { ok: true, client_slug: clientSlug, color: hex, role, changes: info.changes };
  },

  "insert-headline"() {
    const clientSlug = require_("client-slug");
    const sessionId = require_("session-id");
    const text = require_("text");
    const style = require_("style");
    const language = require_("language");
    const db = openDb();
    const info = db
      .prepare(
        "INSERT INTO headlines (client_slug, session_id, text, style, language) VALUES (?, ?, ?, ?, ?)"
      )
      .run(clientSlug, sessionId, text, style, language);
    db.close();
    return { ok: true, id: safeId(info.lastInsertRowid) };
  },

  "insert-asset"() {
    const clientSlug = require_("client-slug");
    const sessionId = require_("session-id");
    const type = require_("type");
    const filePath = require_("path");
    const canvaId = args["canva-id"] || null;
    const db = openDb();
    const info = db
      .prepare(
        "INSERT INTO assets (client_slug, session_id, asset_type, file_path, canva_id) VALUES (?, ?, ?, ?, ?)"
      )
      .run(clientSlug, sessionId, type, filePath, canvaId);
    db.close();
    return { ok: true, id: safeId(info.lastInsertRowid) };
  },

  "find-similar-palette"() {
    const hex = require_("hex");
    const threshold = parseFloat(args.threshold || "10");
    const roleFilter = args.role || null;
    const targetLab = hexToLab(hex);
    const db = openDb();
    const sql = roleFilter
      ? "SELECT p.*, c.name AS client_name FROM palettes p JOIN clients c ON p.client_slug = c.slug WHERE p.role = ?"
      : "SELECT p.*, c.name AS client_name FROM palettes p JOIN clients c ON p.client_slug = c.slug";
    const rows = roleFilter ? db.prepare(sql).all(roleFilter) : db.prepare(sql).all();
    db.close();
    const matches = [];
    for (const row of rows) {
      try {
        const lab = hexToLab(row.color_hex);
        const dE = deltaE76(targetLab, lab);
        if (dE <= threshold) {
          matches.push({
            client_slug: row.client_slug,
            client_name: row.client_name,
            color_hex: row.color_hex,
            role: row.role,
            delta_e: Math.round(dE * 100) / 100,
            recorded_at: row.recorded_at,
          });
        }
      } catch (_) {
        // skip malformed hex
      }
    }
    matches.sort((a, b) => a.delta_e - b.delta_e);
    return { ok: true, target: hex, threshold, matches };
  },

  "find-duplicate-headline"() {
    const text = require_("text");
    const language = require_("language");
    const businessType = args["business-type"] || null;
    const threshold = parseFloat(args.threshold || "0.7");
    const db = openDb();
    const sql = businessType
      ? `SELECT h.*, c.name AS client_name, c.business_type
         FROM headlines h JOIN clients c ON h.client_slug = c.slug
         WHERE h.language = ? AND c.business_type = ?`
      : `SELECT h.*, c.name AS client_name, c.business_type
         FROM headlines h JOIN clients c ON h.client_slug = c.slug
         WHERE h.language = ?`;
    const rows = businessType
      ? db.prepare(sql).all(language, businessType)
      : db.prepare(sql).all(language);
    db.close();
    const matches = [];
    for (const row of rows) {
      const sim = jaccardSimilarity(text, row.text);
      if (sim >= threshold) {
        matches.push({
          client_slug: row.client_slug,
          client_name: row.client_name,
          business_type: row.business_type,
          existing_text: row.text,
          style: row.style,
          similarity: Math.round(sim * 100) / 100,
          chosen_at: row.chosen_at,
        });
      }
    }
    matches.sort((a, b) => b.similarity - a.similarity);
    return { ok: true, target: text, threshold, matches };
  },

  "get-client-history"() {
    const slug = require_("slug");
    const db = openDb();
    const client = db.prepare("SELECT * FROM clients WHERE slug = ?").get(slug);
    if (!client) {
      db.close();
      return { ok: false, error: `client not found: ${slug}` };
    }
    const sessions = db
      .prepare("SELECT * FROM sessions WHERE client_slug = ? ORDER BY started_at DESC")
      .all(slug);
    const palettes = db
      .prepare("SELECT color_hex, role, frequency, recorded_at FROM palettes WHERE client_slug = ?")
      .all(slug);
    const headlines = db
      .prepare("SELECT text, style, language, chosen_at, session_id FROM headlines WHERE client_slug = ? ORDER BY chosen_at DESC")
      .all(slug);
    const assets = db
      .prepare("SELECT asset_type, file_path, canva_id, exported_at, session_id FROM assets WHERE client_slug = ? ORDER BY exported_at DESC")
      .all(slug);
    db.close();
    return { ok: true, client, sessions, palettes, headlines, assets };
  },

  "list-clients"() {
    const limit = parseInt(args.limit || "100", 10);
    const db = openDb();
    const rows = db
      .prepare(
        `SELECT c.*, COUNT(DISTINCT s.session_id) AS session_count
         FROM clients c LEFT JOIN sessions s ON s.client_slug = c.slug
         GROUP BY c.slug
         ORDER BY c.last_seen DESC
         LIMIT ?`
      )
      .all(limit);
    db.close();
    return { ok: true, clients: rows };
  },
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
(function main() {
  const handler = subcommands[cmd];
  if (!handler) {
    console.error(JSON.stringify({ ok: false, error: `unknown subcommand: ${cmd}` }));
    process.exit(2);
  }
  try {
    const result = handler();
    console.log(JSON.stringify(result));
    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err && err.message) }));
    process.exit(1);
  }
})();
