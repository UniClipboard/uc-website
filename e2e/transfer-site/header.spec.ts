import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

import {
  localeMeta,
  localePathPrefix,
} from "../../apps/try/src/i18n/locale-meta";

// Header UI only: language panel, theme toggle and download entry. Loads the
// idle page and never starts a transfer, so no relay traffic is involved.
const artifacts = process.env.TRY_UI_ARTIFACTS || "test-results/transfer-ui";
mkdirSync(artifacts, { recursive: true });
const results: object[] = [];
test.afterAll(() =>
  writeFileSync(
    path.join(artifacts, `header-assertions-${process.pid}.json`),
    JSON.stringify(results, null, 2),
  ),
);

type Messages = {
  try: {
    seoTitle: string;
    footer: { getApp: string };
    header: Record<string, string>;
  };
  nav: Record<string, string>;
};
// en/zh/ru live in the website's message files; the rest are site-only.
const messages = (locale: string): Messages => {
  const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
  if (["en", "zh", "ru"].includes(locale)) {
    const m = read(`messages/${locale}.json`);
    return { try: m.try, nav: m.landing.navigation };
  }
  return read(`apps/try/messages/${locale}.json`);
};
const allLocales = Object.entries(localeMeta).map(([code, meta]) => ({
  code,
  prefix: localePathPrefix(code),
  ...meta,
}));

const locales = [
  // `browser` differs from the page locale so the suggestion row appears.
  {
    code: "en",
    prefix: "",
    native: "English",
    browser: "ru-RU",
    suggest: "ru",
  },
  {
    code: "zh",
    prefix: "/zh",
    native: "简体中文",
    browser: "en-US",
    suggest: "en",
  },
  {
    code: "ru",
    prefix: "/ru",
    native: "Русский",
    browser: "zh-CN",
    suggest: "zh",
  },
] as const;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("static shell: every locale is prerendered with the header markup", async ({
  request,
}) => {
  expect(allLocales).toHaveLength(20);
  for (const { code, prefix, nativeName, dir } of allLocales) {
    const m = messages(code);
    const res = await request.get(prefix || "/");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("s-maxage=1800");
    expect(res.headers()["set-cookie"]).toBeUndefined();
    const html = await res.text();
    expect(html).toContain(`<html lang="${code}" dir="${dir}"`);
    expect(html).toContain("transfer-lang-trigger");
    expect(html).toContain(nativeName);
    expect(html).toContain(m.try.header.tagline);
    expect(html).toContain(`hrefLang="${code}"`);
    expect(html).toContain('data-theme-choice="system"');
    results.push({
      test: "static-shell",
      locale: code,
      dir,
      status: res.status(),
      cacheControl: res.headers()["cache-control"],
      nextCache: res.headers()["x-nextjs-cache"] ?? null,
      prerender: res.headers()["x-nextjs-prerender"] ?? null,
      setCookie: false,
      headerSsr: true,
    });
  }
});

for (const locale of locales) {
  const m = messages(locale.code);
  const nav = m.nav;
  const h = m.try.header;
  const others = locales.filter((l) => l.code !== locale.code);

  for (const vp of viewports) {
    const mobile = vp.name === "mobile";
    const shot = (page: Page, name: string) =>
      page.screenshot({
        path: path.join(artifacts, `${locale.code}-${vp.name}-${name}.png`),
      });

    test(`${locale.code} ${vp.name}: language panel, keyboard and search`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        locale: locale.browser,
        colorScheme: "light",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(locale.prefix || "/");
      await page.waitForLoadState("networkidle");

      const trigger = page.locator(".transfer-lang-trigger");
      await expect(trigger).toHaveAttribute(
        "aria-label",
        `${nav.language}: ${locale.native}`,
      );
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      if (mobile) {
        await expect(page.locator(".transfer-lang-current")).toBeHidden();
      } else {
        await expect(page.locator(".transfer-lang-current")).toHaveText(
          locale.native,
        );
      }
      await expect(page.locator(".transfer-tagline")).toHaveText(h.tagline);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, "closed");

      // Open: search gets focus, current locale is marked, suggestion shows.
      await trigger.click();
      const panel = page.getByRole("dialog", { name: nav.language });
      const search = panel.getByRole("searchbox", { name: h.languageSearch });
      await expect(panel).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(search).toBeFocused();
      const list = panel.locator("ul .transfer-lang-option");
      await expect(list).toHaveCount(allLocales.length);
      const current = panel.locator("ul [aria-current=page]");
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("hreflang", locale.code);
      await expect(current.locator(".transfer-lang-check")).toBeVisible();
      const suggested = panel.getByRole("region", {
        name: h.languageSuggested,
      });
      await expect(suggested.locator(".transfer-lang-option")).toHaveAttribute(
        "hreflang",
        locale.suggest,
      );
      if (mobile) {
        const box = await panel.boundingBox();
        expect(box).toMatchObject({ x: 0, width: vp.width });
        expect(box!.y + box!.height).toBeGreaterThanOrEqual(vp.height - 1);
        await expect(trigger.locator(".transfer-lang-close")).toBeVisible();
      }
      expect(await noOverflow(page)).toBe(true);
      await shot(page, "open");

      // Keyboard: arrows walk search → suggestion → list and back.
      await page.keyboard.press("ArrowDown");
      await expect(suggested.locator(".transfer-lang-option")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(list.first()).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await expect(search).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(suggested.locator(".transfer-lang-option")).toBeFocused();

      // Search by native name, English name and code; empty state.
      await search.fill("русск");
      await expect(list).toHaveCount(1);
      await expect(list).toHaveAttribute("hreflang", "ru");
      await search.fill("chinese");
      await expect(list).toHaveCount(2);
      await expect(list.nth(0)).toHaveAttribute("hreflang", "zh");
      await expect(list.nth(1)).toHaveAttribute("hreflang", "zh-Hant");
      await search.fill("日本");
      await expect(list).toHaveCount(1);
      await expect(list).toHaveAttribute("hreflang", "ja");
      await search.fill("PT-br");
      await expect(list).toHaveCount(1);
      await expect(list).toHaveAttribute("hreflang", "pt-BR");
      await search.fill("zzzz");
      await expect(list).toHaveCount(0);
      await expect(panel.getByText(h.languageEmpty)).toBeVisible();
      await expect(suggested).toHaveCount(0);
      await shot(page, "search-empty");

      // Escape closes and returns focus to the trigger.
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Reopening starts with a cleared search.
      await page.keyboard.press("Enter");
      await expect(search).toBeFocused();
      await expect(search).toHaveValue("");
      await expect(list).toHaveCount(allLocales.length);

      // Dismiss: outside click on desktop, trigger (now a close icon) on mobile.
      if (mobile) await trigger.click();
      else await page.mouse.click(40, vp.height - 40);
      await expect(panel).toBeHidden();

      // Choosing a language navigates to that locale's root.
      const target = others[0];
      await trigger.click();
      await panel.locator(`ul [hreflang="${target.code}"]`).click();
      await expect(page.locator("html")).toHaveAttribute("lang", target.code);
      expect(new URL(page.url()).pathname).toBe(target.prefix || "/");

      expect(errors).toEqual([]);
      results.push({
        test: "language-panel",
        locale: locale.code,
        viewport: vp.name,
        checks: [
          "trigger label and expanded state",
          "search focused on open",
          "current locale marked",
          `browser ${locale.browser} suggests ${locale.suggest}`,
          ...(mobile ? ["full-screen panel, close icon"] : []),
          "ArrowDown/ArrowUp/Tab focus order",
          "search by native name (Cyrillic, Han), English name, code; empty state",
          "Escape closes and restores focus",
          "reopen clears search",
          mobile ? "trigger closes" : "outside click closes",
          `navigates to ${target.code}`,
          "no horizontal overflow",
          "no page errors",
        ],
      });
      await context.close();
    });

    test(`${locale.code} ${vp.name}: theme toggle persists and follows system`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: "dark",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(locale.prefix || "/");
      await page.waitForLoadState("networkidle");

      const html = page.locator("html");
      const toggle = page.locator(".transfer-theme");
      const expectTheme = async (
        choice: string,
        label: string,
        cls: string,
      ) => {
        await expect(toggle).toHaveAttribute("data-theme-choice", choice);
        await expect(toggle).toHaveAttribute(
          "aria-label",
          `${nav.theme}: ${label}`,
        );
        await expect(html).toHaveClass(new RegExp(`\\b${cls}\\b`));
      };
      const stored = () => page.evaluate(() => localStorage.getItem("theme"));

      // Fresh visit: system mode, following the dark OS preference.
      await expectTheme("system", nav.themeSystem, "dark");
      await shot(page, "system-dark");

      await toggle.click();
      await expectTheme("light", nav.themeLight, "light");
      expect(await stored()).toBe("light");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectTheme("light", nav.themeLight, "light");

      await toggle.click();
      await expectTheme("dark", nav.themeDark, "dark");
      expect(await stored()).toBe("dark");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectTheme("dark", nav.themeDark, "dark");
      await shot(page, "dark");

      // Back to system: follows the OS preference live, without reload.
      await toggle.click();
      await expectTheme("system", nav.themeSystem, "dark");
      expect(await stored()).toBe("system");
      await page.emulateMedia({ colorScheme: "light" });
      await expectTheme("system", nav.themeSystem, "light");

      // Download entry: header cell on desktop, footer link on mobile.
      const download = `https://www.uniclipboard.app${locale.prefix}/download`;
      const headerGet = page.locator(".transfer-get");
      await expect(headerGet).toHaveAttribute("href", download);
      if (mobile) {
        await expect(headerGet).toBeHidden();
      } else {
        await expect(headerGet).toBeVisible();
        await expect(headerGet).toHaveText(m.try.footer.getApp);
      }
      await expect(
        page.locator(`.try-foot a[href="${download}"]`),
      ).toBeVisible();
      await expect(page.locator(".transfer-brand")).toHaveAttribute(
        "href",
        `https://www.uniclipboard.app${locale.prefix}`,
      );
      expect(await noOverflow(page)).toBe(true);
      expect(errors).toEqual([]);
      results.push({
        test: "theme-and-download",
        locale: locale.code,
        viewport: vp.name,
        checks: [
          "fresh visit is system mode following dark OS",
          "system → light persists across reload",
          "light → dark persists across reload",
          "dark → system follows live OS change",
          mobile
            ? "header download hidden, footer download visible"
            : "header download visible with localized label",
          "brand links to localized website",
          "no horizontal overflow",
          "no page errors",
        ],
      });
      await context.close();
    });
  }
}

test("browser language suggestion maps regional tags", async ({ browser }) => {
  const cases = [
    { browser: "zh-TW", expected: "zh-Hant" },
    { browser: "zh-HK", expected: "zh-Hant" },
    { browser: "zh-CN", expected: "zh" },
    { browser: "pt-PT", expected: "pt-BR" },
    { browser: "fr-CA", expected: "fr" },
    { browser: "uk-UA", expected: "uk" },
  ];
  const nav = messages("en").nav;
  const h = messages("en").try.header;
  for (const c of cases) {
    const context = await browser.newContext({ locale: c.browser });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(".transfer-lang-trigger").click();
    const suggested = page
      .getByRole("dialog", { name: nav.language })
      .getByRole("region", { name: h.languageSuggested });
    await expect(suggested.locator(".transfer-lang-option")).toHaveAttribute(
      "hreflang",
      c.expected,
    );
    await context.close();
  }
  // Browser language equal to the page: no suggestion row.
  const context = await browser.newContext({ locale: "en-GB" });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator(".transfer-lang-trigger").click();
  await expect(
    page.getByRole("region", { name: h.languageSuggested }),
  ).toHaveCount(0);
  await context.close();
  results.push({
    test: "browser-suggestion",
    checks: [
      ...cases.map((c) => `${c.browser} suggests ${c.expected}`),
      "en-GB on the English page shows no suggestion",
    ],
  });
});

// Locales whose script, direction, fonts or word length stress the layout.
const stressLocales = [
  "ar",
  "ja",
  "ko",
  "zh-Hant",
  "hi",
  "th",
  "vi",
  "de",
  "pl",
  "uk",
];
for (const code of stressLocales) {
  const meta = allLocales.find((l) => l.code === code)!;
  const m = messages(code);
  for (const vp of viewports) {
    test(`${code} ${vp.name}: script, direction and layout`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: "light",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(meta.prefix || "/");
      await page.waitForLoadState("networkidle");
      const shot = (name: string) =>
        page.screenshot({
          path: path.join(artifacts, `${code}-${vp.name}-${name}.png`),
        });

      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(page.locator("html")).toHaveAttribute("dir", meta.dir);
      await expect(page).toHaveTitle(m.try.seoTitle);
      await expect(page.locator(".transfer-tagline")).toHaveText(
        m.try.header.tagline,
      );
      // Compose, or the code-entry start on phones when short codes are on.
      await expect(page.locator(".try-main h1:visible")).toHaveCount(1);
      expect(await noOverflow(page)).toBe(true);

      const style = await page.evaluate(() => {
        const root = getComputedStyle(document.querySelector(".try-page")!);
        const h1 = getComputedStyle(document.querySelector("h1")!);
        return { font: root.fontFamily, h1Spacing: h1.letterSpacing };
      });
      const expectedFont: Record<string, string> = {
        ja: "Hiragino Sans",
        ko: "Apple SD Gothic Neo",
        "zh-Hant": "PingFang TC",
        ar: "Geeza Pro",
        hi: "Kohinoor Devanagari",
        th: "Thonburi",
        vi: "Segoe UI",
      };
      if (expectedFont[code]) expect(style.font).toContain(expectedFont[code]);
      if (meta.fonts === "system") expect(style.font).not.toMatch(/geist/i);
      if (["ar", "hi", "th"].includes(code))
        expect(style.h1Spacing).toBe("normal");

      // RTL mirrors the header: brand on the right, controls on the left.
      if (vp.name === "desktop") {
        const brand = (await page.locator(".transfer-brand").boundingBox())!;
        const get = (await page.locator(".transfer-get").boundingBox())!;
        if (meta.dir === "rtl") expect(brand.x).toBeGreaterThan(get.x);
        else expect(brand.x).toBeLessThan(get.x);
      }
      await shot("closed");

      await page.locator(".transfer-lang-trigger").click();
      const panel = page.getByRole("dialog", { name: m.nav.language });
      await expect(panel).toBeVisible();
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      await expect(
        panel.locator("ul [aria-current=page] .transfer-lang-native"),
      ).toHaveText(meta.nativeName);
      expect(await noOverflow(page)).toBe(true);
      await shot("open");

      expect(errors).toEqual([]);
      results.push({
        test: "script-direction-layout",
        locale: code,
        viewport: vp.name,
        dir: meta.dir,
        fontFamily: style.font,
        h1LetterSpacing: style.h1Spacing,
        checks: [
          "lang/dir attributes",
          "translated title and tagline",
          "transfer heading visible",
          "per-language font stack",
          ...(vp.name === "desktop" ? ["header mirrors with direction"] : []),
          "panel inside viewport, current language marked",
          "no horizontal overflow",
          "no page errors",
        ],
      });
      await context.close();
    });
  }
}
