/** Audit the build artifact: the console route table can hide dynamic bailouts. */
import { readFileSync } from "node:fs";

import { routing } from "../src/i18n/routing";

const manifest = JSON.parse(
  readFileSync(".next/prerender-manifest.json", "utf8"),
);
const results = [];
const errors: string[] = [];
for (const locale of routing.locales) {
  for (const path of [
    "",
    "/download",
    "/sponsor",
    "/blog",
    "/compare",
    "/use-cases",
    "/changelog",
  ]) {
    const route = `/${locale}${path}`;
    const actual = manifest.routes[route]?.initialRevalidateSeconds;
    const expected = path ? 1800 : 3600;
    results.push({ route, actual: actual ?? null, expected });
    if (actual !== expected)
      errors.push(
        `${route}: expected static ISR ${expected}, received ${String(actual)}`,
      );
  }
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length) process.exitCode = 1;
