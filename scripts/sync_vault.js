#!/usr/bin/env node
/**
 * sync_vault.js — keep the Obsidian vault in sync from a git worktree.
 *
 * WHY: Work happens inside a git worktree
 *   (<repo>/.claude/worktrees/<id>/vault/), but the user's Obsidian app opens
 *   the MAIN repo vault (<repo>/vault/, where `.obsidian/` lives). Edits made
 *   in the worktree are therefore invisible in Obsidian until the branch is
 *   merged. This script closes that gap on every turn / session end.
 *
 * WHAT IT DOES (both, per user's choice):
 *   1. MIRROR  — copies vault/ from the current worktree into the main repo's
 *                vault/ so updates appear live in Obsidian.
 *   2. COMMIT  — `git commit` of vault/ changes on the worktree branch as a
 *                history safety-net (scoped to the `vault/` pathspec only, so
 *                it never sweeps up staged code).
 *
 * Usage (also wired as Stop + SessionEnd hooks in .claude/settings.json):
 *   node scripts/sync_vault.js [--trigger stop|session-end|manual]
 *                              [--no-mirror] [--no-commit]
 *
 * Design notes:
 *   - NEVER touches `.obsidian/` (the user's app config: workspace/appearance).
 *   - v1 does NOT delete files in the destination that no longer exist in the
 *     source (additive + overwrite-if-changed only — safer for a live vault).
 *   - Only rewrites a destination file when it is missing / a different size /
 *     the source is newer, so Obsidian's file watcher isn't spammed.
 *   - ALWAYS exits 0. A documentation-sync failure must never block the
 *     session; problems are reported on stderr only.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// ---------------------------------------------------------------------------
// Args (same minimal pattern as remove_bg.js / upscale.js)
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true; // boolean flag
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}
const args = parseArgs(process.argv);
const trigger = typeof args.trigger === "string" ? args.trigger : "manual";
const doMirror = !args["no-mirror"];
const doCommit = !args["no-commit"];

// ---------------------------------------------------------------------------
// git helpers
// ---------------------------------------------------------------------------
function git(gitArgs, cwd) {
  return spawnSync("git", gitArgs, { cwd, encoding: "utf8" });
}

function gitOut(gitArgs, cwd) {
  const r = git(gitArgs, cwd);
  if (r.status !== 0) return null;
  return (r.stdout || "").trim();
}

const warnings = [];

// Current worktree root (absolute). Fall back to cwd if git is unavailable.
const cwd = process.cwd();
const srcRoot = gitOut(["rev-parse", "--show-toplevel"], cwd) || cwd;

// Main repo root = parent of the shared .git dir (git-common-dir).
function findMainRoot() {
  // Preferred: absolute path format (git >= 2.31).
  let commonDir = gitOut(
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    srcRoot
  );
  // Fallback: older git — may return a relative path; resolve against srcRoot.
  if (!commonDir) {
    const rel = gitOut(["rev-parse", "--git-common-dir"], srcRoot);
    if (rel) commonDir = path.resolve(srcRoot, rel);
  }
  if (!commonDir) return null;
  // commonDir is ".../<repo>/.git" → parent is the repo root.
  return path.dirname(commonDir);
}

// ---------------------------------------------------------------------------
// Mirror: srcRoot/vault -> mainRoot/vault (skip .obsidian and .git)
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set([".obsidian", ".git"]);

function mirrorDir(srcDir, dstDir, stats) {
  let entries;
  try {
    entries = fs.readdirSync(srcDir, { withFileTypes: true });
  } catch (err) {
    warnings.push(`readdir failed for ${srcDir}: ${err.message}`);
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue; // never mirror Obsidian config / git
    const s = path.join(srcDir, e.name);
    const d = path.join(dstDir, e.name);
    if (e.isDirectory()) {
      mirrorDir(s, d, stats);
    } else if (e.isFile()) {
      let shouldCopy = true;
      try {
        if (fs.existsSync(d)) {
          const ss = fs.statSync(s);
          const ds = fs.statSync(d);
          // Skip identical files: same size AND identical bytes. Compare
          // CONTENT (not mtime) so a fresh worktree checkout's newer mtimes
          // don't trigger needless rewrites that would spam Obsidian's file
          // watcher. Size check first short-circuits the common "differs" case.
          if (ss.size === ds.size) {
            try {
              if (Buffer.compare(fs.readFileSync(s), fs.readFileSync(d)) === 0) {
                shouldCopy = false;
              }
            } catch (_) {
              // if either read fails, fall through and copy
            }
          }
        }
        if (shouldCopy) {
          fs.mkdirSync(path.dirname(d), { recursive: true });
          fs.copyFileSync(s, d);
          stats.copied++;
        }
      } catch (err) {
        warnings.push(`copy failed for ${e.name}: ${err.message}`);
      }
    }
  }
}

function runMirror() {
  const mainRoot = findMainRoot();
  if (!mainRoot) {
    warnings.push("could not resolve main repo root; skipping mirror");
    return { mirrored: 0, skipped: "no-main-root" };
  }
  const srcVault = path.join(srcRoot, "banner_create");
  const dstVault = path.join(mainRoot, "banner_create");

  if (path.resolve(srcVault) === path.resolve(dstVault)) {
    // Running directly in the main repo — nothing to mirror.
    return { mirrored: 0, skipped: "same-vault" };
  }
  if (!fs.existsSync(srcVault)) {
    warnings.push(`source vault not found: ${srcVault}`);
    return { mirrored: 0, skipped: "no-src-vault" };
  }

  const stats = { copied: 0 };
  mirrorDir(srcVault, dstVault, stats);
  return { mirrored: stats.copied, dst: dstVault };
}

// ---------------------------------------------------------------------------
// Commit: stage + commit only the vault/ pathspec on the worktree branch
// ---------------------------------------------------------------------------
function runCommit() {
  // Confirm we're inside a work tree.
  const inside = gitOut(["rev-parse", "--is-inside-work-tree"], srcRoot);
  if (inside !== "true") {
    warnings.push("not inside a git work tree; skipping commit");
    return { committed: null };
  }

  // Stage vault changes (new + modified) without touching anything else.
  const add = git(["add", "--", "banner_create"], srcRoot);
  if (add.status !== 0) {
    warnings.push(`git add failed: ${(add.stderr || "").trim().slice(0, 200)}`);
    return { committed: null };
  }

  // Anything staged under vault/? `--quiet` exits 1 when there ARE diffs.
  const staged = git(["diff", "--cached", "--quiet", "--", "banner_create"], srcRoot);
  if (staged.status === 0) {
    return { committed: null }; // nothing to commit
  }
  if (staged.status !== 1) {
    warnings.push(`git diff --cached failed (status ${staged.status})`);
    return { committed: null };
  }

  const msg = `docs(vault): auto-sync ${new Date().toISOString()}`;
  const commit = git(["commit", "-m", msg, "--", "banner_create"], srcRoot);
  if (commit.status !== 0) {
    warnings.push(`git commit failed: ${(commit.stderr || "").trim().slice(0, 200)}`);
    return { committed: null };
  }
  const sha = gitOut(["rev-parse", "--short", "HEAD"], srcRoot);
  return { committed: sha || "ok" };
}

// ---------------------------------------------------------------------------
// Main — always exit 0
// ---------------------------------------------------------------------------
try {
  const result = { trigger };
  if (doMirror) Object.assign(result, runMirror());
  if (doCommit) Object.assign(result, runCommit());

  const didSomething = (result.mirrored || 0) > 0 || result.committed;
  if (didSomething) {
    // Plain one-liner (not JSON) so a Stop hook never misreads it as control.
    const parts = [`[sync_vault] trigger=${trigger}`];
    if (doMirror) parts.push(`mirrored=${result.mirrored || 0}`);
    if (doCommit) parts.push(`committed=${result.committed || "none"}`);
    console.log(parts.join(" "));
  }
  if (warnings.length) {
    for (const w of warnings) console.error(`[sync_vault] warn: ${w}`);
  }
} catch (err) {
  console.error(`[sync_vault] error: ${err && err.message ? err.message : err}`);
}
process.exit(0);
