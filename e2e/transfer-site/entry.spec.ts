import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, type Locator, test } from "@playwright/test";

const artifacts = process.env.TRY_E2E_ARTIFACTS || "test-results/entry";
mkdirSync(artifacts, { recursive: true });

// Synthetic event data only: never inspect the user's clipboard.
async function paste(input: Locator, text: string) {
  await input.focus();
  return input.evaluate((element, value) => {
    const data = new DataTransfer();
    data.setData("text/plain", value);
    return element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  }, text);
}

test("mobile paste belongs to the receive field, not the hidden compose card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh");
  const input = page.getByTestId("try-code-input-start");
  await expect(input).toBeVisible();
  // Synthetic paste does not perform the browser's default insertion. Its
  // uncancelled event proves the native input owns that default action.
  const allowed = await paste(input, "012345");
  await page.screenshot({
    path: path.join(artifacts, "mobile-paste-ownership.png"),
  });
  console.log(
    JSON.stringify({
      allowed,
      input: await input.inputValue(),
      compose: await page.locator("textarea").inputValue(),
      inputFocused: await input.evaluate((e) => e === document.activeElement),
    }),
  );
  expect(allowed).toBe(true);
  await expect(input).toBeFocused();
  await expect(page.locator("textarea")).toHaveValue("");
  await page.screenshot({
    path: path.join(artifacts, "mobile-paste-ownership.png"),
  });
});

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
for (const locale of locales) {
  test(`${locale}: direct paths, refresh, switching and history`, async ({
    page,
    request,
  }) => {
    const prefix = locale === "en" ? "" : `/${locale}`;
    await page.setViewportSize({ width: 390, height: 844 });
    for (const mode of ["send", "receive"]) {
      const response = await request.get(`${prefix}/${mode}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toContain("s-maxage=1800");
      expect(response.headers()["set-cookie"]).toBeUndefined();
      const html = await response.text();
      expect(html).toContain(
        mode === "send" ? "<textarea" : "try-code-input-start",
      );
      await page.goto(`${prefix}/${mode}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        mode === "send"
          ? page.locator("textarea")
          : page.getByTestId("try-code-input-start"),
      ).toBeVisible();
      await page.reload();
      await expect(
        mode === "send"
          ? page.locator("textarea")
          : page.getByTestId("try-code-input-start"),
      ).toBeVisible();
    }
    await page.locator(`a[href="${prefix}/send"]`).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/send$`));
    await expect(page.locator("textarea")).toBeVisible();
    await page.locator(`a[href="${prefix}/receive"]`).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/receive$`));
    await expect(page.getByTestId("try-code-input-start")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${prefix}/send$`));
    await expect(page.locator("textarea")).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${prefix}/receive$`));
    await expect(page.getByTestId("try-code-input-start")).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId("try-code-input-start")).toBeVisible();
    await expect(page.locator("textarea")).toHaveCount(0);
    await page.goto(prefix || "/");
    await expect(page.locator("textarea")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("try-code-input-start")).toBeVisible();
  });
}

test("language changes preserve explicit modes; compatibility entries still resolve", async ({
  page,
  request,
}) => {
  for (const mode of ["send", "receive"]) {
    await page.goto(`/zh/${mode}`);
    await page.locator(".transfer-lang-trigger").click();
    const links = page.locator(".transfer-lang-body ul a");
    await expect(links).toHaveCount(20);
    for (const locale of locales) {
      await expect(
        page.locator(`.transfer-lang-body ul a[hreflang="${locale}"]`),
      ).toHaveAttribute(
        "href",
        `${locale === "en" ? "" : `/${locale}`}/${mode}`,
      );
    }
    await page.locator(`.transfer-lang-body ul a[hreflang="en"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${mode}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
  for (const [entry, target] of [
    ["/try", "/"],
    ["/en/try", "/"],
    ["/zh/try", "/zh"],
    ["/ru/try", "/ru"],
    ["/en", "/"],
    ["/en/send", "/send"],
    ["/en/receive", "/receive"],
  ]) {
    const response = await request.get(entry, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(
      new URL(response.headers().location, "http://localhost:3213").pathname,
    ).toBe(target);
  }
  expect((await request.get("/zh/invalid-mode")).status()).toBe(404);
});

test("native synthetic-clipboard paste, individual digits, deletion and submit", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const submitted: string[] = [];
  await page.route("https://rendezvous.e2e.test/**", (route) => {
    submitted.push(route.request().postDataJSON().code);
    return route.fulfill({
      status: 404,
      json: { error: { code: "pairing_not_found" } },
    });
  });
  try {
    // The browser is an isolated headless test context. Only write synthetic
    // values, then invoke native paste; never call clipboard.read/readText.
    for (const [url, field] of [
      ["/", "start"],
      ["/zh/receive", "start"],
      ["/send", "row"],
    ]) {
      await page.goto(url);
      if (field === "row")
        await page.setViewportSize({ width: 1440, height: 900 });
      const input = page.getByTestId(`try-code-input-${field}`);
      await input.focus();
      await page.evaluate(() => navigator.clipboard.writeText("012345"));
      await input.press("ControlOrMeta+V");
      await expect(input).toHaveValue("012 345");
      await expect(input).toBeFocused();
      if (await page.locator("textarea").count())
        await expect(page.locator("textarea")).toHaveValue("");
      await input.press("Enter");
      await expect(page.getByTestId("try-code-error")).toHaveAttribute(
        "data-reason",
        "expired",
      );
      expect(submitted.at(-1)).toBe("012-345");
      await input.fill("");
      await input.pressSequentially("012345");
      await expect(input).toHaveValue("012 345");
      await input.press("Backspace");
      await expect(input).toHaveValue("012 34");
      await input.press("5");
      await expect(input).toHaveValue("012 345");
      await input.press("Home");
      await input.press("Delete");
      await expect(input).toHaveValue("123 45");
      await input.fill("０１２３４５");
      await expect(input).toHaveValue("012 345");
      await input.fill("abc012345678");
      await expect(input).toHaveValue("012 345");
      await input.fill("12");
      const count = submitted.length;
      await input.press("Enter");
      await expect(page.getByTestId("try-code-error")).toHaveAttribute(
        "data-reason",
        "incomplete",
      );
      expect(submitted.length).toBe(count);
      await input.fill("012345");
      await page.screenshot({
        path: path.join(
          artifacts,
          `paste-${url.replaceAll("/", "-") || "root"}.png`,
        ),
      });
    }
    // Pasting into the compose textarea still inserts normally, and a page
    // paste outside editable controls still appends to the compose card.
    await page.goto("/send");
    await page.locator("textarea").focus();
    await page.evaluate(() =>
      navigator.clipboard.writeText("synthetic compose text"),
    );
    await page.locator("textarea").press("ControlOrMeta+V");
    await expect(page.locator("textarea")).toHaveValue(
      "synthetic compose text",
    );
    expect(await paste(page.locator("body"), "synthetic page paste")).toBe(
      false,
    );
    await expect(page.locator("textarea")).toHaveValue(
      "synthetic compose text\nsynthetic page paste",
    );
  } finally {
    await context.close();
  }
});

test("explicit paths transfer text and file over real encrypted relay transport", async ({
  browser,
}) => {
  const { createHash } = await import("node:crypto");
  const { readFileSync, writeFileSync } = await import("node:fs");
  let ticket = "";
  let consumed = false;
  const calls: string[] = [];
  const sender = await browser.newContext();
  const receiver = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["clipboard-read", "clipboard-write"],
    acceptDownloads: true,
  });
  for (const context of [sender, receiver]) {
    await context.route("https://rendezvous.e2e.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const body = route.request().postDataJSON();
      calls.push(pathname);
      if (pathname.endsWith("/consume")) {
        consumed = true;
        return route.fulfill({ json: { ok: true } });
      }
      if (pathname.endsWith("/resolve")) {
        if (consumed || body.code !== "012-345")
          return route.fulfill({
            status: 404,
            json: { error: { code: "pairing_not_found" } },
          });
        return route.fulfill({
          json: { ticket, expiresAtMs: Date.now() + 300_000 },
        });
      }
      ticket = body.ticket;
      consumed = false;
      return route.fulfill({
        json: { code: "012-345", expiresAtMs: Date.now() + 300_000 },
      });
    });
  }
  const send = await sender.newPage();
  const receive = await receiver.newPage();
  const bytes = Buffer.alloc(12 * 1024, "synthetic-transfer-file");
  try {
    await send.goto("/zh/send");
    await send
      .locator("textarea")
      .fill("Synthetic transfer acceptance with a leading-zero code");
    await send.getByTestId("try-file-input").setInputFiles({
      name: "sample.txt",
      mimeType: "text/plain",
      buffer: bytes,
    });
    await send.locator(".try-compose .try-btn").click();
    await expect(send.getByTestId("try-code-value")).toHaveText("012 345", {
      timeout: 90_000,
    });
    await receive.goto("/zh/receive");
    const input = receive.getByTestId("try-code-input-start");
    await input.focus();
    await receive.evaluate(() => navigator.clipboard.writeText("012345"));
    await input.press("ControlOrMeta+V");
    await expect(input).toHaveValue("012 345");
    await input.press("Enter");
    await expect(receive.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await expect(receive.getByTestId("try-received-text")).toHaveText(
      "Synthetic transfer acceptance with a leading-zero code",
    );
    const download = receive.waitForEvent("download");
    await receive.getByRole("link", { name: /sample\.txt/ }).click();
    const received = readFileSync((await (await download).path())!);
    expect(received.equals(bytes)).toBe(true);
    await expect(send.getByTestId("try-delivered")).toBeVisible();
    await expect.poll(() => consumed).toBe(true);
    await receive.screenshot({
      path: path.join(artifacts, "mobile-received.png"),
    });
    await send.screenshot({
      path: path.join(artifacts, "sender-delivered.png"),
    });
    await receive.getByRole("button", { name: "回复", exact: true }).click();
    await expect(receive.locator("textarea")).toBeVisible();
    await receive.locator("textarea").fill("Synthetic reply");
    await receive
      .getByRole("button", { name: "发送回复", exact: true })
      .click();
    await expect(receive.getByTestId("try-reply-delivered")).toBeVisible();
    await expect(send.getByTestId("try-received-text")).toHaveText(
      "Synthetic reply",
    );

    // Keep old fragment-bearing entry URLs usable as well as the code paths.
    await send.getByRole("button", { name: "发送新内容", exact: true }).click();
    await send.locator("textarea").fill("Synthetic legacy link transfer");
    await send.locator(".try-compose .try-btn").click();
    await expect(send.getByTestId("try-copy-link")).toBeVisible({
      timeout: 90_000,
    });
    const link = await send
      .getByTestId("try-copy-link")
      .getAttribute("data-link");
    expect(Boolean(link)).toBe(true);
    await receive.goto(`/zh/try${new URL(link!).hash}`);
    await expect(receive.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await expect(receive.getByTestId("try-received-text")).toHaveText(
      "Synthetic legacy link transfer",
    );
    expect(new URL(receive.url()).hash).toBe("");
    await expect(send.getByTestId("try-delivered")).toBeVisible();
    writeFileSync(
      path.join(artifacts, "transfer.json"),
      JSON.stringify(
        {
          registry: "in-browser fixture",
          transport: "real tailcat WASM and public relay",
          textMatched: true,
          replyMatched: true,
          legacyFragmentTransferMatched: true,
          bytes: received.length,
          sha256: createHash("sha256").update(received).digest("hex"),
          consumed,
          calls,
          deviceBrowser: "not-run",
        },
        null,
        2,
      ),
    );
  } finally {
    await sender.close();
    await receiver.close();
  }
});
