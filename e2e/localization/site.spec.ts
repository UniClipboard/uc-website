import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  localeAlternates,
  localeMeta,
  localePathPrefix,
} from "../../src/i18n/locale-meta";
import { routing } from "../../src/i18n/routing";

const library = ".herdr-project/uni-t-0058/library";
for (const locale of routing.locales) {
  for (const width of [390, 1440]) {
    test(`${locale} public routes at ${width}`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(/https:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const messages = JSON.parse(
        readFileSync(`messages/${locale}.json`, "utf8"),
      );
      const results = [];
      for (const path of [
        "/",
        "/download",
        "/sponsor",
        "/compare",
        "/use-cases",
        "/blog",
        "/changelog",
      ]) {
        const url =
          `${localePathPrefix(locale)}${path === "/" ? "" : path}` || "/";
        const response = await page.goto(url);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          localeMeta[locale].inLanguage,
        );
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          localeMeta[locale].dir,
        );
        await expect(page.locator("h1:visible").first()).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        );
        expect(overflow, `${url} overflow`).toBeLessThanOrEqual(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `http://localhost:3158${url === "/" ? "" : url}`,
        );
        for (const [language, alternate] of Object.entries(
          localeAlternates(path),
        )) {
          await expect(
            page.locator(`link[rel="alternate"][hreflang="${language}"]`),
          ).toHaveAttribute(
            "href",
            `http://localhost:3158${alternate === "/" ? "" : alternate}`,
          );
        }
        if (path === "/download") {
          const hrefs = await page
            .locator('a[href*="release.uniclipboard.app/synthetic-local-only"]')
            .evaluateAll((nodes) =>
              [
                ...new Set(nodes.map((node) => node.getAttribute("href"))),
              ].sort(),
            );
          if (width > 767)
            expect(hrefs).toContain(
              "https://release.uniclipboard.app/synthetic-local-only/UniClipboard_9.8.7_aarch64.dmg",
            );
          if (width > 767)
            expect(hrefs).toContain(
              "https://release.uniclipboard.app/synthetic-local-only/UniClipboard_9.8.7_x64.dmg",
            );
          expect(hrefs.some((href) => href?.endsWith(".app.tar.gz"))).toBe(
            false,
          );
          results.push({ path, hrefs });
        }
        if (
          ["/compare", "/use-cases", "/blog"].includes(path) &&
          !["en", "zh"].includes(locale)
        ) {
          await expect(
            page.getByText(messages.languagePicker.contentAvailability),
          ).toBeVisible();
          await expect(page.locator('main a[lang="en"]')).toHaveAttribute(
            "href",
            path,
          );
          await expect(page.locator('main a[lang="zh-CN"]')).toHaveAttribute(
            "href",
            `/zh${path}`,
          );
        }
        if (
          path === "/" ||
          path === "/download" ||
          (locale === "ar" && path === "/compare")
        ) {
          await page.evaluate(async () => {
            for (let y = 0; y < document.body.scrollHeight; y += 650) {
              window.scrollTo(0, y);
              await new Promise((resolve) => setTimeout(resolve, 120));
            }
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(400);
          await page.screenshot({
            path: `${library}/${locale}-${width}-${path === "/" ? "home" : path.slice(1)}.png`,
            fullPage: true,
          });
        }
        // h1 must be SSR visible before hydration, verified with the raw response.
        const html = await (await request.get(url)).text();
        expect(html).toContain("<h1");
        results.push({
          path,
          overflow,
          h1: await page.locator("h1:visible").first().innerText(),
        });
      }
      expect(errors).toEqual([]);
      await test.info().attach("public-route-assertions", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });
    });
  }
}

test("language keyboard, native/code/English search, client recommendation and URL state", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "languages", { value: ["ja-JP"] }),
  );
  await page.goto("/download?ref=preview#direct");
  const trigger = page.getByTestId("language-trigger").first();
  await trigger.click();
  const input = page.getByRole("combobox", {
    name: "Search languages",
    exact: true,
  });
  await expect(input).toBeFocused();
  await expect(page.locator('[data-locale="ja"]')).toContainText(
    "Browser recommendation",
  );
  for (const query of ["Deutsch", "German", "de"]) {
    await input.fill(query);
    await expect(page.locator('[data-locale="de"]')).toBeVisible();
  }
  await input.fill("not-a-language");
  await expect(page.getByText("No matching languages")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill("日本語");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ja\/download\?ref=preview#direct$/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
});

test("shared URLs ignore browser preference; content languages and sitemap stay truthful", async ({
  request,
  page,
}) => {
  const response = await request.get("/", {
    headers: { "Accept-Language": "ar,ja;q=0.8", Cookie: "NEXT_LOCALE=ar" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["set-cookie"]).toBeUndefined();
  await page.goto("/blog/language-fixture");
  await expect(
    page.getByText("This is synthetic English article content."),
  ).toBeVisible();
  await page.getByTestId("language-trigger").first().click();
  await page
    .getByRole("combobox", { name: "Search languages", exact: true })
    .fill("العربية");
  await page.locator('[data-locale="ar"]').click();
  await expect(page).toHaveURL(/\/ar\/blog$/);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/ar/download");
  expect(xml).toContain("/zh-TW/download");
  expect(xml).toContain("/zh/blog/language-fixture");
  expect(xml).not.toContain("/ar/blog/language-fixture");
  const unavailable = await request.get("/ar/blog/language-fixture", {
    maxRedirects: 0,
  });
  expect(unavailable.status()).toBe(307);
  expect(
    new URL(unavailable.headers().location, "http://localhost:3158").href,
  ).toBe("http://localhost:3158/ar/blog");
  const missing = await request.get("/ar/does-not-exist");
  expect(missing.status()).toBe(404);
});

test("legacy try redirects respect the independent 20-language contract", async ({
  request,
}) => {
  for (const locale of routing.locales) {
    const response = await request.get(
      `${localePathPrefix(locale)}/try?ref=language-test`,
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(307);
    const target =
      locale === "en" ? "/" : `/${locale === "zh-TW" ? "zh-Hant" : locale}`;
    expect(response.headers().location).toBe(
      `http://localhost:3161${target}?ref=language-test`,
    );
    expect(response.headers()["cache-control"]).toBe("no-store");
    const destination = await request.get(response.headers().location);
    expect(destination.status()).toBe(200);
  }
});
