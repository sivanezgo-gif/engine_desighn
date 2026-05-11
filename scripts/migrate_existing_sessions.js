#!/usr/bin/env node
/**
 * migrate_existing_sessions.js — import existing ./output/{session_id}/ folders into brands.db.
 *
 * Reads brand_profile.json, chosen_copy.json, and session_state.json from each session folder
 * and inserts the data into the SQLite registry. Idempotent — re-running is safe.
 *
 * Usage:
 *   node scripts/migrate_existing_sessions.js               # uses ./output/
 *   node scripts/migrate_existing_sessions.js --root /path  # custom root
 *   node scripts/migrate_existing_sessions.js --dry-run     # report what would be inserted
 *
 * Skip rules:
 *   - Folders without session_state.json (e.g. fonts/, brands.db)
 *   - Folders ending in -ABORTED that have no useful data
 *
 * Output: single JSON summary on stdout: { ok, processed: [{slug, sessions, palettes, headlines, assets}], skipped: [...] }
 *
 * Requires: Node.js 22+ (node:sqlite).
 */

const fs = require("fs");
const path = require("path");

let DatabaseSync;
try {
  ({ DatabaseSync } = require("node:sqlite"));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: "node:sqlite not available. Requires Node 22+." }));
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--")) {
      out[a.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const ROOT = args.root || path.join(process.cwd(), "output");
const DRY_RUN = !!args["dry-run"] || !!args.dryRun;

if (!fs.existsSync(ROOT)) {
  console.error(JSON.stringify({ ok: false, error: `root not found: ${ROOT}` }));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------
const DB_PATH = process.env.BRAND_DB_PATH || path.join(process.cwd(), "output", "brands.db");

function ensureDb() {
  if (DRY_RUN) return null;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  // Apply schema. Schema lifted from brand_db.js — kept here so migration is self-contained.
  db.exec(`
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
  `);
  return db;
}

// ---------------------------------------------------------------------------
// JSON readers
// ---------------------------------------------------------------------------
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------
function migrateSession(db, sessionDir) {
  const state = readJson(path.join(sessionDir, "session_state.json"));
  if (!state) return { skipped: true, reason: "no session_state.json" };

  const profile = readJson(path.join(sessionDir, "brand_profile.json"));
  const copy = readJson(path.join(sessionDir, "chosen_copy.json"));

  const slug = state.business_slug || path.basename(sessionDir).replace(/-\d{8}-\d{6}.*$/, "");
  const name = state.business_name || profile?.business_name || slug;
  const url = state.url || profile?.url || null;
  const businessType =
    profile?.business_type_english || profile?.business_type || null;
  const sessionId = state.session_id || path.basename(sessionDir);
  const startedAt = state.started_at || new Date().toISOString();
  const endedAt = state.final_assets?.composed_at || null;
  const status =
    state.status === "completed" || state.status === "aborted"
      ? state.status
      : "active";
  const openaiCalls = state.openai_call_count || 0;

  const result = {
    slug,
    session_id: sessionId,
    palettes: 0,
    headlines: 0,
    assets: 0,
  };

  if (DRY_RUN) {
    return { ...result, dryRun: true };
  }

  // Insert client (upsert)
  db.prepare(
    `INSERT INTO clients (slug, name, url, business_type)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       name = excluded.name,
       url = COALESCE(excluded.url, clients.url),
       business_type = COALESCE(excluded.business_type, clients.business_type),
       last_seen = datetime('now')`
  ).run(slug, name, url, businessType);

  // Insert session (upsert)
  db.prepare(
    `INSERT INTO sessions (session_id, client_slug, started_at, ended_at, status, openai_calls)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       ended_at = excluded.ended_at,
       status = excluded.status,
       openai_calls = excluded.openai_calls`
  ).run(sessionId, slug, startedAt, endedAt, status, openaiCalls);

  // Insert palettes from brand_profile.colors
  if (profile?.colors) {
    const c = profile.colors;
    const candidates = [
      { hex: c.primary, role: "primary" },
      { hex: c.secondary, role: "secondary" },
      { hex: c.accent, role: "accent" },
      { hex: c.background, role: "background" },
      { hex: c.text_dark, role: "text" },
    ];
    const stmt = db.prepare(
      `INSERT INTO palettes (client_slug, color_hex, role, frequency)
       VALUES (?, ?, ?, 1.0)
       ON CONFLICT(client_slug, color_hex, role) DO UPDATE SET
         recorded_at = datetime('now')`
    );
    for (const { hex, role } of candidates) {
      if (typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) {
        stmt.run(slug, hex.trim().toUpperCase(), role);
        result.palettes++;
      }
    }
  }

  // Insert headline from chosen_copy
  if (copy?.headline && copy?.style && copy?.language) {
    db.prepare(
      `INSERT INTO headlines (client_slug, session_id, text, style, language, chosen_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      sessionId,
      copy.headline,
      copy.style,
      copy.language,
      copy.finalized_at || new Date().toISOString()
    );
    result.headlines++;
  }

  // Insert final assets if present
  const finalDir = path.join(sessionDir, "final");
  if (fs.existsSync(finalDir)) {
    const stmt = db.prepare(
      `INSERT INTO assets (client_slug, session_id, asset_type, file_path, canva_id, exported_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const composedAt = state.final_assets?.composed_at || new Date().toISOString();
    const banner = path.join(finalDir, "banner_310x600.png");
    if (fs.existsSync(banner)) {
      stmt.run(
        slug,
        sessionId,
        "banner",
        banner,
        state.canva_assets?.banner_final_asset_id || null,
        composedAt
      );
      result.assets++;
    }
    const header = path.join(finalDir, "header_1366x200.png");
    if (fs.existsSync(header)) {
      stmt.run(
        slug,
        sessionId,
        "header",
        header,
        state.canva_assets?.header_final_asset_id || null,
        composedAt
      );
      result.assets++;
    }
  }

  // Insert logo asset if known
  if (profile?.logo?.found && profile.logo.local_path) {
    const logoPath = path.resolve(sessionDir, profile.logo.local_path);
    if (fs.existsSync(logoPath)) {
      db.prepare(
        `INSERT INTO assets (client_slug, session_id, asset_type, file_path, canva_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        slug,
        sessionId,
        "logo",
        logoPath,
        state.canva_assets?.logo_asset_id || null
      );
      result.assets++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(function main() {
  const db = ensureDb();
  const processed = [];
  const skipped = [];

  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "fonts") continue; // non-session folder
    const sessionDir = path.join(ROOT, entry.name);
    try {
      const r = migrateSession(db, sessionDir);
      if (r.skipped) skipped.push({ folder: entry.name, reason: r.reason });
      else processed.push(r);
    } catch (err) {
      skipped.push({ folder: entry.name, reason: String(err && err.message) });
    }
  }

  if (db) db.close();
  console.log(
    JSON.stringify({
      ok: true,
      root: ROOT,
      db: DRY_RUN ? null : DB_PATH,
      dryRun: DRY_RUN,
      processed,
      skipped,
    })
  );
})();
