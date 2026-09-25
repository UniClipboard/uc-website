import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type BrowserContext, expect, test } from "@playwright/test";

const artifacts =
  process.env.TRY_E2E_ARTIFACTS || ".herdr-project/uni-t-0049/library/e2e";
const origin = "http://localhost:3210";
const website = "http://localhost:3211";
const results: object[] = [];
mkdirSync(artifacts, { recursive: true });
test.afterAll(() =>
  writeFileSync(
    path.join(artifacts, `assertions-${process.pid}.json`),
    JSON.stringify(results, null, 2),
  ),
);

// Only the rendezvous registry is simulated; wasm, encrypted streams and
// public relay transport are real. Never serialize tickets/codes to artifacts.
function registry() {
  let ticket = "";
  let consumed = false;
  return async (context: BrowserContext) =>
    context.route("https://rendezvous.e2e.test/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const body = route.request().postDataJSON();
      let status = 200;
      let json: object;
      if (pathname.endsWith("/consume")) {
        consumed = true;
        json = { ok: true };
      } else if (pathname.endsWith("/resolve")) {
        if (consumed || body.code !== "123-456") {
          status = 404;
          json = { error: { code: "pairing_not_found" } };
        } else json = { ticket, expiresAtMs: Date.now() + 300_000 };
      } else {
        ticket = body.ticket;
        consumed = false;
        json = { code: "123-456", expiresAtMs: Date.now() + 300_000 };
      }
      await route.fulfill({
        status,
        json,
        headers: { "access-control-allow-origin": origin },
      });
    });
}

for (const locale of ["en", "zh", "ru"]) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  test(`${locale}: static shell, desktop/mobile, themes and idle wasm`, async ({
    browser,
    request,
  }) => {
    const response = await request.get(`${origin}${prefix || "/"}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("s-maxage=1800");
    expect(response.headers()["set-cookie"]).toBeUndefined();
    expect(await response.text()).toContain("try-compose");
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      const bad: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", () => errors.push("pageerror"));
      page.on("request", (r) => {
        if (
          /\/tailcat\/|google-analytics|googletagmanager|speed-insights|clerk/i.test(
            r.url(),
          )
        )
          bad.push(new URL(r.url()).pathname);
      });
      await page.goto(`${origin}${prefix || "/"}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByTestId(`try-code-input-${width < 500 ? "start" : "row"}`),
      ).toBeVisible();
      for (const theme of ["light", "dark"]) {
        await page.locator("select").selectOption(theme);
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: path.join(artifacts, `${locale}-${width}-${theme}.png`),
          fullPage: true,
        });
      }
      expect(bad).toEqual([]);
      expect(errors).toEqual([]);
      await expect(
        page.locator(
          `a[href="https://www.uniclipboard.app${prefix}/download"]`,
        ),
      ).toBeVisible();
      results.push({
        test: "shell",
        locale,
        width,
        themes: 2,
        overflow: false,
        idleWasm: 0,
        pageErrors: 0,
      });
      await context.close();
    }
  });

  test(`${locale}: legacy redirects preserve and privately capture fragments`, async ({
    browser,
    request,
  }) => {
    for (const oldPath of locale === "en"
      ? ["/try", "/en/try"]
      : [`/${locale}/try`]) {
      const res = await request.get(`${website}${oldPath}`, {
        maxRedirects: 0,
      });
      expect(res.status()).toBe(307);
      expect(res.headers().location).toBe(`${origin}${prefix || "/"}`);
      expect(res.headers()["cache-control"]).toContain("no-store");
      expect(res.headers()["referrer-policy"]).toBe("no-referrer");
      const context = await browser.newContext();
      const page = await context.newPage();
      const secret = "fragment-probe-never-log";
      let leak = false;
      page.on("request", (r) => {
        if (
          (
            r.url() +
            JSON.stringify(r.headers()) +
            (r.postData() || "")
          ).includes(secret)
        )
          leak = true;
      });
      // Observe script EXECUTION, not insertion: Next emits async script tags
      // before head children; insertion alone does not mean JS ran too early.
      await page.route("**/_next/static/**/*.js", async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body:
            "window.__externalScriptSafe = window.__externalScriptSafe !== false && !location.hash;\n" +
            (await response.text()),
        });
      });
      await page.goto(`${website}${oldPath}#c=${secret}&k=${"B".repeat(22)}`);
      await expect(page.getByTestId("try-error")).toBeVisible();
      expect(new URL(page.url()).hash).toBe("");
      expect(new URL(page.url()).pathname).toBe(prefix || "/");
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { __externalScriptSafe: boolean })
              .__externalScriptSafe,
        ),
      ).toBe(true);
      expect(leak).toBe(false);
      results.push({
        test: "legacy-fragment",
        oldPath,
        capturedBeforeExternalScripts: true,
        requestsLeakingFragment: 0,
      });
      await context.close();
    }
  });
}

for (const locale of ["en", "zh", "ru"]) {
  test(`${locale}: real relay link, QR and old-link recovery`, async ({
    browser,
  }) => {
    const prefix = locale === "en" ? "" : `/${locale}`;
    const install = registry();
    const sender = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const receiver = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await install(sender);
    await install(receiver);
    const send = await sender.newPage();
    const receive = await receiver.newPage();
    try {
      await send.goto(`${origin}${prefix || "/"}`);
      await send.locator("textarea").fill(`Transfer acceptance ${locale}`);
      await send.locator(".try-compose .try-btn").last().click();
      await expect(send.getByTestId("try-copy-link")).toBeVisible({
        timeout: 90_000,
      });
      const link = (await send
        .getByTestId("try-copy-link")
        .getAttribute("data-link"))!;
      // Boolean assertions avoid printing a secret-bearing URL on failure.
      expect(new URL(link).origin === origin).toBe(true);
      expect(new URL(link).pathname === (prefix || "/")).toBe(true);
      await expect(send.locator("svg.try-qr path")).toHaveAttribute("d", /^M/);
      const qrBytes = await send.locator("svg.try-qr").screenshot();
      const decoded = execFileSync(
        "swift",
        ["e2e/transfer-site/decode-qr.swift"],
        { input: qrBytes, maxBuffer: 1024 * 1024 },
      ).toString();
      expect(decoded === link).toBe(true);
      // Open the generated ticket through the old website locale route.
      await receive.goto(`${website}${prefix}/try${new URL(link).hash}`);
      await expect(receive.getByTestId("try-received")).toBeVisible({
        timeout: 180_000,
      });
      await expect(receive.getByTestId("try-received-text")).toHaveText(
        `Transfer acceptance ${locale}`,
      );
      expect(new URL(receive.url()).hash).toBe("");
      await expect(send.getByTestId("try-delivered")).toBeVisible();
      results.push({
        test: "real-relay-link",
        locale,
        oldLinkRecovered: true,
        linkOriginAndPath: true,
        qrDecodedAndMatched: true,
        textMatched: true,
      });
    } finally {
      await sender.close();
      await receiver.close();
    }
  });
}

test("short code: real relay text and small file integrity on mobile", async ({
  browser,
}) => {
  const install = registry();
  const sender = await browser.newContext();
  const receiver = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
  });
  await install(sender);
  await install(receiver);
  const send = await sender.newPage();
  const receive = await receiver.newPage();
  const bytes = Buffer.alloc(12 * 1024, "transfer-file");
  try {
    await send.goto(origin);
    await send.locator("textarea").fill("Short-code transfer acceptance");
    await send.getByTestId("try-file-input").setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: bytes,
    });
    await send.getByRole("button", { name: "Send", exact: true }).click();
    await expect(send.getByTestId("try-code-value")).toHaveText(
      /^\d{3} \d{3}$/,
      { timeout: 90_000 },
    );
    const code = (await send.getByTestId("try-code-value").textContent())!;
    await receive.goto(origin);
    await receive.getByTestId("try-code-input-start").fill(code);
    await receive.getByTestId("try-code-input-start").press("Enter");
    await expect(receive.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await expect(receive.getByTestId("try-received-text")).toHaveText(
      "Short-code transfer acceptance",
    );
    const download = receive.waitForEvent("download");
    await receive.getByRole("link", { name: "Save sample.txt" }).click();
    const received = readFileSync((await (await download).path())!);
    expect(received.equals(bytes)).toBe(true);
    await expect(send.getByTestId("try-delivered")).toBeVisible();
    results.push({
      test: "short-code",
      backend: "simulated registry",
      transport: "real tailcat",
      bytes: bytes.length,
      sha256: createHash("sha256").update(received).digest("hex"),
      textMatched: true,
    });
  } finally {
    await sender.close();
    await receiver.close();
  }
});

test("new-origin compatibility routes and the 20 MB guard", async ({
  page,
  request,
}) => {
  for (const [route, target] of [
    ["/try", "/"],
    ["/en/try", "/"],
    ["/zh/try", "/zh"],
    ["/ru/try", "/ru"],
    ["/en", "/"],
  ]) {
    const response = await request.get(`${origin}${route}`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, origin).pathname).toBe(target);
  }
  let wasm = 0;
  page.on("request", (r) => {
    if (r.url().includes("/tailcat/")) wasm++;
  });
  await page.goto(origin);
  await page.getByTestId("try-file-input").setInputFiles({
    name: "over-limit.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(20 * 1024 * 1024 + 1),
  });
  await expect(
    page.getByRole("button", { name: "Send", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".try-compose").getByRole("alert")).toContainText(
    "20 MB",
  );
  expect(wasm).toBe(0);
  results.push({
    test: "compatibility-and-limit",
    aliases: 5,
    over20MBBlocked: true,
    wasmRequests: 0,
  });
});

test("website navigation and hero entries use the new locale origin", async ({
  request,
}) => {
  for (const prefix of ["", "/zh", "/ru"]) {
    const response = await request.get(`${website}${prefix || "/"}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const count = html.split(`href="${origin}${prefix || "/"}"`).length - 1;
    expect(count).toBeGreaterThanOrEqual(2);
  }
  results.push({
    test: "website-entries",
    locales: 3,
    navigationAndHero: true,
  });
});
