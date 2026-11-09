import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.MIGRATION_E2E_URL;
if (!origin || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
  throw new Error(
    "MIGRATION_E2E_URL must identify a local disposable production server",
  );
}
const token = process.env.MIGRATION_E2E_TOKEN;
const invite = process.env.MIGRATION_E2E_INVITE;
assert.ok(token && invite, "Fixture credentials are required");
const results = [];
async function check(name, fn) {
  await fn();
  results.push({ name, status: "PASS" });
}
const request = (path, options = {}) =>
  fetch(origin + path, { redirect: "manual", ...options });
const authed = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};
const content = (title) => ({
  contentType: "markdown",
  seo: { title, description: title, keywords: title, ogAlt: title },
  hero: { title, subtitle: "" },
  meta: {
    breadcrumbCurrent: title,
    lastUpdatedLabel: "Updated",
    lastUpdatedDate: "2026-11-09",
  },
  body: `# ${title}\n\nMigration acceptance content.`,
});
let articleId;
const slug = `migration-e2e-${Date.now()}`;
try {
  await check("liveness and database readiness", async () => {
    for (const path of ["/api/health/live", "/api/health/ready"]) {
      assert.equal((await request(path)).status, 200, path);
    }
  });
  await check("unauthorized APIs and cron reject requests", async () => {
    assert.equal((await request("/api/v1/articles")).status, 401);
    if (process.env.MIGRATION_E2E_REVOKED_TOKEN) {
      assert.equal(
        (
          await request("/api/v1/articles", {
            headers: {
              authorization: `Bearer ${process.env.MIGRATION_E2E_REVOKED_TOKEN}`,
            },
          })
        ).status,
        401,
      );
    }
    assert.equal((await request("/api/cron/sync-releases")).status, 401);
    assert.equal(
      (
        await request("/api/cron/sync-releases", {
          headers: { authorization: "Bearer incorrect" },
        })
      ).status,
      401,
    );
  });
  await check("active token and article creation", async () => {
    const response = await request("/api/v1/articles", {
      method: "POST",
      headers: authed,
      body: JSON.stringify({
        slug,
        category: "blog",
        datePublished: "2026-11-09",
        status: "published",
        translations: {
          en: content("Migration fixture"),
          zh: content("Migration fixture"),
        },
      }),
    });
    assert.equal(response.status, 201, await response.clone().text());
    articleId = (await response.json()).id;
    assert.ok(articleId);
  });
  await check("public content and representation isolation", async () => {
    const html = await request(`/blog/${slug}`);
    assert.equal(html.status, 200, "new published article HTML");
    assert.match(html.headers.get("content-type"), /text\/html/);
    assert.match(await html.text(), /Migration fixture/);
    // The existing Markdown route prebuilds a fixed path set. Use the home
    // URL for the representation check rather than inventing a new contract.
    const markdown = await request("/", {
      headers: { accept: "text/markdown" },
    });
    assert.equal(markdown.status, 200, "prebuilt Markdown home");
    assert.match(markdown.headers.get("content-type"), /text\/markdown/);
    assert.match(await markdown.text(), /UniClipboard/);
  });
  await check("article update invalidates public cache", async () => {
    const response = await request(`/api/v1/articles/${articleId}`, {
      method: "PUT",
      headers: authed,
      body: JSON.stringify({
        slug,
        category: "blog",
        datePublished: "2026-11-09",
        status: "published",
        translations: {
          en: content("Changed migration fixture"),
          zh: content("Changed migration fixture"),
        },
      }),
    });
    assert.equal(response.status, 200, await response.clone().text());
    let updated = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const page = await request(`/blog/${slug}`);
      if ((await page.text()).includes("Changed migration fixture")) {
        updated = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(updated);
  });
  await check("concurrent invitation consumption is atomic", async () => {
    const submit = () =>
      request(`/api/sponsor-invite/${invite}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Migration E2E sponsor" }),
      });
    const responses = await Promise.all([submit(), submit()]);
    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 410]);
  });
  await check("duplicate beta signup remains idempotent", async () => {
    const email = `migration-e2e-${Date.now()}@example.invalid`;
    const submit = () =>
      request("/api/v1/ios-beta-signups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale: "en" }),
      });
    const responses = await Promise.all([submit(), submit()]);
    assert.deepEqual(
      responses.map((r) => r.status),
      [200, 200],
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));
    assert.deepEqual(bodies.map((b) => b.status).sort(), ["created", "exists"]);
  });
  await check("public pages and metadata", async () => {
    for (const path of [
      "/",
      "/download",
      "/blog",
      "/changelog",
      "/sitemap.xml",
      "/robots.txt",
    ]) {
      const response = await request(path);
      assert.equal(response.status, 200, path);
      assert.doesNotMatch(await response.text(), /https?:\/\/localhost:3000/);
    }
  });
} catch (error) {
  results.push({ name: "failure", status: "FAIL", error: String(error) });
  process.exitCode = 1;
} finally {
  if (articleId) {
    const response = await request(`/api/v1/articles/${articleId}`, {
      method: "DELETE",
      headers: authed,
    });
    results.push({
      name: "fixture article deletion",
      status: response.ok ? "PASS" : "FAIL",
    });
    if (!response.ok) process.exitCode = 1;
  }
  await mkdir(".migration/receipts", { recursive: true });
  await writeFile(
    ".migration/receipts/http.json",
    JSON.stringify(
      { timestamp: new Date().toISOString(), origin, results },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
}
