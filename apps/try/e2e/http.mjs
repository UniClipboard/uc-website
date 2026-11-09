import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { gunzipSync } from "node:zlib";
const origin = (process.env.TRY_E2E_URL || "http://127.0.0.1:3321").replace(
  /\/$/,
  "",
);
const locales = [
  "en",
  "zh",
  "zh-Hant",
  "ja",
  "ko",
  "es",
  "fr",
  "de",
  "pt-BR",
  "ru",
  "it",
  "tr",
  "vi",
  "id",
  "ar",
  "hi",
  "th",
  "pl",
  "nl",
  "uk",
];
const results = [];
const assets = new Set();
async function get(path) {
  return fetch(origin + path, {
    redirect: "manual",
    headers: { "accept-encoding": "identity" },
    signal: AbortSignal.timeout(60000),
  });
}
for (const locale of locales) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  for (const mode of ["", "/send", "/receive"]) {
    const path = prefix + mode || "/";
    const r = await get(path);
    assert.equal(r.status, 200, path);
    assert.match(r.headers.get("cache-control") || "", /s-maxage=1800/, path);
    assert.equal(r.headers.get("set-cookie"), null, path);
    assert.equal(r.headers.get("referrer-policy"), "no-referrer", path);
    const html = await r.text();
    assert.ok(html.includes(`lang="${locale}"`), path);
    assert.match(html, /data-try-site/, path);
    const canonical = html.match(
      /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/,
    );
    assert.ok(canonical, `canonical ${path}`);
    const canonicalUrl = new URL(canonical[1]);
    assert.equal(canonicalUrl.origin, "https://try.uniclipboard.app", path);
    assert.equal(canonicalUrl.pathname, path, path);
    assert.doesNotMatch(
      html,
      /google-analytics|googletagmanager|speed-insights|cloudflareinsights|static\.cloudflareinsights|clerk\.accounts/i,
      path,
    );
    assert.ok(
      html.indexOf("window.__ucTryFragment") >= 0,
      `fragment capture ${path}`,
    );
    assert.doesNotMatch(
      html,
      /<link[^>]+(?:preload|prefetch)[^>]+\/tailcat\//i,
      path,
    );
    for (const [, asset] of html.matchAll(
      /(?:src|href)="(\/_next\/static\/[^"?]+)/g,
    ))
      assets.add(asset.replaceAll("&amp;", "&"));
  }
  results.push({
    name: `${locale} static pages and send/receive routes`,
    status: "PASS",
  });
}
for (const [path, target] of [
  ["/en", "/"],
  ["/try", "/"],
  ["/en/try", "/"],
  ["/zh/try", "/zh"],
  ["/ru/try", "/ru"],
]) {
  const r = await get(path);
  assert.ok([307, 308].includes(r.status), path);
  const url = new URL(r.headers.get("location"), origin);
  assert.equal(url.pathname, target, path);
  assert.equal(url.hash, "", path);
}
results.push({
  name: "locale and legacy redirects omit fragments",
  status: "PASS",
});
for (const path of assets) {
  const r = await get(path);
  assert.equal(r.status, 200, path);
  assert.ok((await r.arrayBuffer()).byteLength > 0, path);
}
results.push({
  name: "all HTML-referenced static assets load",
  assets: assets.size,
  status: "PASS",
});
const manifestResponse = await get("/tailcat/manifest.json");
assert.equal(manifestResponse.status, 200);
const manifest = await manifestResponse.json();
const digest = (b) => createHash("sha256").update(b).digest("hex");
for (const [kind, item] of Object.entries(manifest.files)) {
  const r = await get(item.path);
  assert.equal(r.status, 200, item.path);
  assert.match(r.headers.get("cache-control") || "", /immutable/);
  assert.equal(
    r.headers.get("content-encoding"),
    null,
    `${item.path} must retain original gzip bytes`,
  );
  const body = Buffer.from(await r.arrayBuffer());
  assert.equal(body.length, item.bytes);
  assert.equal(digest(body), item.sha256);
  if (kind === "wasm") {
    const raw = gunzipSync(body);
    assert.equal(raw.length, item.uncompressedBytes);
    assert.equal(digest(raw), item.uncompressedSha256);
    assert.equal(raw.subarray(0, 4).toString("hex"), "0061736d");
  }
}
results.push({
  name: "pinned WASM and runtime digests and gzip semantics",
  source: manifest.commit,
  status: "PASS",
});
for (const path of [
  "/_next/static/migration-missing.js",
  "/tailcat/migration-missing.wasm.gz",
]) {
  assert.equal((await get(path)).status, 404, path);
}
const health = await get("/api/health/live");
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { ok: true });
results.push({ name: "health and missing asset behavior", status: "PASS" });
const receipt = {
  timestamp: new Date().toISOString(),
  origin,
  results,
  browserAcceptance: "NOT_RUN_USER_OWNED",
  productionTransfer: "NOT_PROVEN_BY_HTTP",
};
const output = process.env.TRY_E2E_RECEIPT || ".migration/try/http.json";
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
