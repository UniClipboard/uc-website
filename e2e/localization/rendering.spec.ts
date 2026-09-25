import { expect, test } from "@playwright/test";

const library = ".herdr-project/uni-t-0058/library";

test("first-fold headings remain visible without hydration", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  // Allow inline streamed HTML placement but block every hydration bundle.
  await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort());
  const results = [];
  for (const path of [
    "/",
    "/download",
    "/sponsor",
    "/blog",
    "/blog/language-fixture",
    "/changelog",
    "/ar",
    "/ar/download",
    "/ar/sponsor",
    "/ar/blog",
    "/ar/changelog/9.8.7",
    "/hi/download",
  ]) {
    await page.goto(`http://localhost:3158${path}`);
    const heading = page.locator("h1:visible").first();
    await expect(heading).toBeVisible();
    const hidden = await heading.evaluate((node) => {
      let element: Element | null = node;
      while (element) {
        if (getComputedStyle(element).opacity === "0") return true;
        element = element.parentElement;
      }
      return false;
    });
    expect(hidden, `${path} heading must not depend on hydration`).toBe(false);
    results.push({
      path,
      heading: await heading.innerText(),
      opacityVisible: !hidden,
    });
  }
  await page.screenshot({ path: `${library}/no-hydration-hi-download.png` });
  await test.info().attach("no-hydration-headings", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  await context.close();
});

test("RTL download tabs preserve installer URLs and commands", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ar/download");
  const results = [];
  for (const [id, expected] of [
    ["mac", "UniClipboard_9.8.7_aarch64.dmg"],
    ["win", "UniClipboard_9.8.7_x64-setup.exe"],
    ["android", "UniClip-9.8.7-arm64-v8a.apk"],
  ]) {
    await page.locator(`#platform-tab-${id}`).click();
    const link = page
      .locator('[role="tabpanel"]')
      .locator(`a[href$="${expected}"]`);
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toBe(
      `https://release.uniclipboard.app/synthetic-local-only/${expected}`,
    );
    results.push({ id, href });
  }
  await page.locator("#platform-tab-linux").click();
  await expect(page.locator('[role="tabpanel"] code')).toHaveText(
    "curl -fsSL https://uniclipboard.app/install.sh | bash",
  );
  await page.locator("#platform-tab-ios").click();
  await expect(
    page
      .locator(
        '[role="tabpanel"] a[href="https://testflight.apple.com/join/nyNQ8dQe"]',
      )
      .first(),
  ).toBeVisible();
  for (const code of await page.locator("pre, code").all()) {
    expect(
      await code.evaluate((node) => getComputedStyle(node).direction),
    ).toBe("ltr");
  }
  await test.info().attach("installer-urls", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
});

for (const locale of ["de", "ar", "hi", "ja"]) {
  test(`${locale} tablet navigation and mobile language panel`, async ({
    page,
  }) => {
    for (const width of [768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/download`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    await page.screenshot({ path: `${library}/${locale}-390-first-fold.png` });
    // Below `sm` the switcher lives in the mobile menu, not the header.
    await page.getByTestId("menu-toggle").click();
    await page
      .getByTestId("language-trigger")
      .filter({ visible: true })
      .click();
    const input = page.locator('input[role="combobox"]');
    await expect(input).toBeFocused();
    await input.fill("en");
    await expect(page.locator('[data-locale="en"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `${library}/${locale}-390-language-panel.png`,
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByTestId("language-trigger").filter({ visible: true }),
    ).toBeFocused();
  });
}
