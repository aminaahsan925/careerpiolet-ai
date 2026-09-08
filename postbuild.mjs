/**
 * Postbuild script — copies tslib into every Vercel serverless function's
 * node_modules so the runtime can resolve `import "tslib"`.
 *
 * Runs automatically after `vite build` via the buildCommand in vercel.json.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FUNC_ROOT = ".vercel/output/functions";

function findTslibDest(root) {
  const dirs = readdirSync(root);
  const results = [];

  for (const d of dirs) {
    const full = join(root, d);
    if (!statSync(full).isDirectory()) continue;

    // Vercel functions end with .func
    if (d.endsWith(".func")) {
      results.push(full);
    } else {
      // Recurse into nested dirs (e.g., __server.func might be nested)
      results.push(...findTslibDest(full));
    }
  }

  return results;
}

if (!existsSync(FUNC_ROOT)) {
  console.log("[postbuild] No .vercel/output/functions/ found — skipping tslib copy.");
  process.exit(0);
}

const tslibSrc = "node_modules/tslib";
if (!existsSync(tslibSrc)) {
  console.error("[postbuild] ERROR: node_modules/tslib not found. Run `npm install` first.");
  process.exit(1);
}

const funcDirs = findTslibDest(FUNC_ROOT);
if (funcDirs.length === 0) {
  console.error("[postbuild] WARNING: No .func directories found in", FUNC_ROOT);
  console.log("[postbuild] Contents:", readdirSync(FUNC_ROOT));
  process.exit(0);
}

for (const dir of funcDirs) {
  const dest = join(dir, "node_modules", "tslib");
  mkdirSync(join(dir, "node_modules"), { recursive: true });
  cpSync(tslibSrc, dest, { recursive: true });
  console.log(`[postbuild] Copied tslib → ${dest}`);

  // Extend the function timeout so AI-heavy routes (diagnosis, resume,
  // roadmap, recruiter, market, mentor) have enough time to complete.
  // Vercel Hobby caps this at 60s; Pro supports up to 900s.
  const vcConfigPath = join(dir, ".vc-config.json");
  if (existsSync(vcConfigPath)) {
    try {
      const cfg = JSON.parse(readFileSync(vcConfigPath, "utf8"));
      if (!cfg.maxDuration || cfg.maxDuration < 60) {
        cfg.maxDuration = 60;
        writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2));
        console.log(`[postbuild] Patched maxDuration=60 → ${vcConfigPath}`);
      }
    } catch (err) {
      console.warn(`[postbuild] Could not patch ${vcConfigPath}:`, err.message);
    }
  }
}

console.log(`[postbuild] Done. tslib copied to ${funcDirs.length} function(s).`);
