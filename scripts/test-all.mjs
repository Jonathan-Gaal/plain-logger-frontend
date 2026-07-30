#!/usr/bin/env node
// scripts/test-all.mjs
//
// Self-contained end-to-end test runner for the FRONTEND. This is what the
// pre-push git hook runs. It:
//
//   1. Runs the Vitest component/unit tests (fast, mocked API — no servers).
//   2. Boots the real BACKEND (seeded throwaway SQLite DB) on a test port,
//      because the Playwright e2e tests drive the actual UI against real API
//      data (real PL- tickets, real mapped/unmapped state), not mocks.
//   3. Runs Playwright, which itself boots the frontend dev server (see
//      playwright.config.ts `webServer`) pointed at that backend.
//   4. Tears the backend down — always.
//
// Exit code is 0 only if unit + e2e all pass, so the hook blocks the push on
// any failure.
//
// Assumptions:
//   - The backend repo sits next to this one at ../plain-logger-backend
//     (adjust BACKEND_DIR below if your layout differs).
//   - VITE_API_BASE_URL for the e2e run points at the test backend port.

import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.resolve(FRONTEND_DIR, "..", "plain-logger-backend");

const BACKEND_PORT = process.env.BACKEND_TEST_PORT || "3100";
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const BACKEND_TEST_DB = path.join(BACKEND_DIR, "local.test.db");

function backendEnv(extra = {}) {
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  delete env.SUPABASE_DB_URL;
  env.PLAIN_LOGGER_DB_PATH = BACKEND_TEST_DB;
  // Force local SQLite mode so the backend booted for e2e never touches a real
  // Supabase project (the backend scripts reload .env from disk via dotenv, so
  // scrubbing env vars alone isn't enough).
  env.PLAIN_LOGGER_FORCE_LOCAL = "1";
  env.PORT = BACKEND_PORT;
  // The backend's CORS must allow the frontend's e2e origin.
  env.CORS_ALLOWED_ORIGINS = "http://localhost:3001";
  return { ...env, ...extra };
}

// For the UNIT phase, do NOT set VITE_API_BASE_URL — the unit tests are fully
// mocked (MSW) against the client's default base URL (http://localhost:3000).
// Overriding it would make the client call a port MSW isn't listening on.
function runUnit(cmd, args) {
  const env = { ...process.env };
  delete env.VITE_API_BASE_URL;
  return spawnSync(cmd, args, {
    cwd: FRONTEND_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  }).status ?? 1;
}

// For the E2E phase, point the app at the real seeded backend on the test port.
function runE2E(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: FRONTEND_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      VITE_API_BASE_URL: BACKEND_URL,
    },
  }).status ?? 1;
}

function runBackend(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: BACKEND_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: backendEnv(),
  }).status ?? 1;
}

function cleanupBackendDb() {
  for (const f of [BACKEND_TEST_DB, `${BACKEND_TEST_DB}-journal`]) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {
      /* ignore */
    }
  }
}

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`${url}/api/tickets?limit=1`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Backend did not become ready within ${timeoutMs}ms`));
        } else {
          setTimeout(tick, 500);
        }
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

async function main() {
  let backend = null;
  let exitCode = 0;

  const shutdown = () => {
    if (backend && !backend.killed) {
      try {
        process.kill(-backend.pid, "SIGTERM");
      } catch {
        try {
          backend.kill("SIGTERM");
        } catch {
          /* ignore */
        }
      }
    }
    cleanupBackendDb();
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  try {
    // 1. Unit / component tests (mocked — no servers needed).
    console.log("\n[test:all] 1/3 — frontend unit + component tests…");
    if (runUnit("npx", ["vitest", "run"]) !== 0) {
      throw new Error("unit tests failed");
    }

    // 2. Boot the seeded backend for e2e.
    if (!fs.existsSync(BACKEND_DIR)) {
      throw new Error(
        `Backend not found at ${BACKEND_DIR}. e2e needs the backend running. ` +
          `Set BACKEND_DIR in scripts/test-all.mjs if your layout differs.`
      );
    }
    console.log("\n[test:all] 2/3 — seeding + starting the backend for e2e…");
    cleanupBackendDb();
    if (runBackend("node", ["scripts/db-init.js"]) !== 0) throw new Error("backend db:init failed");
    if (runBackend("node", ["scripts/db-seed.js"]) !== 0) throw new Error("backend db:seed failed");

    backend = spawn("npx", ["next", "dev", "-p", BACKEND_PORT], {
      cwd: BACKEND_DIR,
      env: backendEnv(),
      stdio: "inherit",
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
    });
    await waitForServer(BACKEND_URL);
    console.log("[test:all] backend is ready.");

    // 3. Playwright e2e (Playwright boots the frontend dev server itself).
    console.log("\n[test:all] 3/3 — Playwright e2e…");
    exitCode = runE2E("npx", ["playwright", "test"]);
  } catch (err) {
    console.error(`\n[test:all] FAILED: ${err.message}`);
    exitCode = 1;
  } finally {
    console.log("\n[test:all] tearing down backend + cleanup…");
    shutdown();
  }

  if (exitCode === 0) {
    console.log("\n[test:all] ✅ all frontend tests passed.");
  } else {
    console.error("\n[test:all] ❌ frontend tests failed (exit " + exitCode + ").");
  }
  process.exit(exitCode);
}

main();
