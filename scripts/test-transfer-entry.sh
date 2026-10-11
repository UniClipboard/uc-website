#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

artifact_dir="${TRY_E2E_ARTIFACTS:-test-results/transfer-entry}"
mkdir -p "$artifact_dir"
artifact_dir="$(cd "$artifact_dir" && pwd)"
export TRY_E2E_ARTIFACTS="$artifact_dir"
export TRY_E2E_RESULTS="$artifact_dir/results.json"
unset TRY_E2E_DEV

# Local pairing registry fixture; encrypted payloads use real tailcat relays.
# No production rendezvous, analytics, user clipboard reads, push or deploy.
export NEXT_PUBLIC_TRY_SHORT_CODE=1
export NEXT_PUBLIC_TRY_RENDEZVOUS_URL=https://rendezvous.e2e.test

node --input-type=module - "$artifact_dir" <<'JS'
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
writeFileSync(path.join(process.argv[2], "source.json"), JSON.stringify({
  sourceSha: git("rev-parse", "HEAD"),
  branch: git("branch", "--show-current"),
  trackedDiffSha256: createHash("sha256").update(git("diff", "HEAD")).digest("hex"),
  status: git("status", "--short"),
  node: process.version,
  bun: execFileSync("bun", ["--version"], { encoding: "utf8" }).trim(),
  startedAt: new Date().toISOString(),
  coverage: "Chromium desktop and mobile viewport; synthetic clipboard only",
  deviceBrowser: "not-run",
  registry: "in-browser fixture",
  transport: "real tailcat WASM and public relay",
}, null, 2));
JS

bun run --cwd apps/try build 2>&1 | tee "$artifact_dir/build.log"
bunx playwright test --config playwright.transfer-entry.config.ts 2>&1 | tee "$artifact_dir/e2e.log"
