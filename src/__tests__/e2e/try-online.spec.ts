/**
 * End-to-end tests for the /try page.
 *
 * The "page shell" tests need only the site. The "transfer" tests move real
 * content between isolated browser contexts over tailcat's official public
 * DERP relays, so they need the wasm build (scripts/build-tailcat-wasm.sh)
 * and network access; they skip themselves when the build is missing. The
 * relays are rate-limited: keep these runs small.
 *
 * The analytics test only proves something when the server was started with
 * NEXT_PUBLIC_GA_MEASUREMENT_ID set (any test ID); collection requests are
 * intercepted and never reach Google.
 *
 * Set TRY_E2E_ARTIFACTS=<dir> to save screenshots and an assertions JSON.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

const ARTIFACTS = process.env.TRY_E2E_ARTIFACTS;
const assertions: Record<string, unknown>[] = [];

const record = (name: string, data: Record<string, unknown>) => {
  assertions.push({ name, ...data });
};

const shot = async (page: Page, name: string) => {
  if (!ARTIFACTS) return;
  mkdirSync(path.join(ARTIFACTS, "screens"), { recursive: true });
  await page.screenshot({
    path: path.join(ARTIFACTS, "screens", `${name}.png`),
  });
};

test.afterAll(() => {
  if (!ARTIFACTS || assertions.length === 0) return;
  mkdirSync(ARTIFACTS, { recursive: true });
  const file = path.join(ARTIFACTS, `assertions-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(assertions, null, 2));
});

const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

const FAKE_TOKEN = "B".repeat(22);

type GaProbe = {
  loadHref: string;
  commands: { cmd: unknown; href: string }[];
  events: { type: string; href: string }[];
};

declare global {
  interface Window {
    __gaProbe?: GaProbe;
  }
}

const GTAG_PROBE = `(function () {
  var probe = (window.__gaProbe = { loadHref: location.href, commands: [], events: [] });
  function handle(args) { probe.commands.push({ cmd: args && args[0], href: location.href }); }
  var dl = (window.dataLayer = window.dataLayer || []);
  for (var i = 0; i < dl.length; i++) handle(dl[i]);
  var push = dl.push;
  dl.push = function () {
    for (var j = 0; j < arguments.length; j++) handle(arguments[j]);
    return push.apply(dl, arguments);
  };
  ["popstate", "hashchange"].forEach(function (type) {
    addEventListener(type, function () { probe.events.push({ type: type, href: location.href }); });
  });
})();`;

// A mangled address: passes the character check, fails the structure check.
const MALFORMED_ADDR = `tc${"A".repeat(40)}`;

// A well-formed address for keys nobody listens on: {p, k, q: 32 random
// bytes, i: region}, encoded as CBOR the way tailcat does.
const addressFor = (region: number) => {
  const key = (name: string) => [
    0x61,
    name.charCodeAt(0),
    0x58,
    32,
    ...randomBytes(32),
  ];
  const cbor = Buffer.from([
    0xa4,
    ...key("p"),
    ...key("k"),
    ...key("q"),
    0x61,
    "i".charCodeAt(0),
    0x19,
    region >> 8,
    region & 255,
  ]);
  return "tc" + cbor.toString("base64url");
};

const liveRegion = async () => {
  const res = await fetch("https://tailcat.dev/derpmap.json");
  const map = (await res.json()) as { Regions: Record<string, unknown> };
  return Number(Object.keys(map.Regions)[0]);
};

test.describe("try page shell", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

  test("home and an idle /try page load no tailcat asset", async ({ page }) => {
    const tailcat: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/tailcat/")) tailcat.push(r.url());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href="/try"]').first()).toBeAttached();
    await page.goto("/try");
    await expect(
      page.getByRole("heading", { name: "Send anything to another device." }),
    ).toBeVisible();
    await page.locator("textarea").fill("typing does not load the wasm");
    await page.waitForLoadState("networkidle");
    expect(tailcat).toEqual([]);
    record("no-tailcat-on-home-or-idle-try", {
      tailcatRequests: tailcat.length,
    });
  });

  test("the compose card is in the server HTML", async ({ request }) => {
    const html = await (await request.get("/try")).text();
    expect(html).toContain("Send anything to another device.");
    expect(html).toContain("<textarea");
  });

  test("the connection fragment never reaches analytics or the network", async ({
    page,
  }) => {
    const urls: string[] = [];
    const collected: string[] = [];
    page.on("request", (r) => urls.push(r.url() + " " + (r.postData() ?? "")));
    await page.route(
      /google-analytics\.com|analytics\.google\.com/,
      (route) => {
        collected.push(
          route.request().url() + " " + (route.request().postData() ?? ""),
        );
        return route.fulfill({ status: 204 });
      },
    );
    // Stand-in for gtag.js, served at the real loader URL so it loads at the
    // same point in the page lifecycle. Like gtag, it drains dataLayer on
    // load, handles later pushes, and listens to history changes (in the
    // bubble phase, registered after the page's own listeners). It records
    // location.href at each of those moments.
    await page.route(/googletagmanager\.com\/gtag\/js/, (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: GTAG_PROBE,
      }),
    );

    // Where the URL stands once parsing ends, before hydration or any async
    // script (analytics, Speed Insights) runs.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as { __hrefAtParseEnd?: string }).__hrefAtParseEnd =
          location.href;
      });
    });

    // 1. Opening a link: the fragment is stripped during parsing, before
    // hydration and before analytics loads.
    await page.goto(`/try#c=${MALFORMED_ADDR}&k=${FAKE_TOKEN}`);
    const hrefAtParseEnd = await page.evaluate(
      () => (window as { __hrefAtParseEnd?: string }).__hrefAtParseEnd,
    );
    expect(hrefAtParseEnd, "DOMContentLoaded must have fired").toBeTruthy();
    expect(hrefAtParseEnd).not.toContain("#");
    // Precondition, not the property under test: GA must be rendered.
    // playwright.config.ts starts the server with a test measurement ID.
    await expect(
      page.locator("script#ga4-init"),
      "precondition: the layout must render GA (NEXT_PUBLIC_GA_MEASUREMENT_ID)",
    ).toHaveCount(1);
    await expect
      .poll(() => page.evaluate(() => Boolean(window.__gaProbe)), {
        message: "precondition: the gtag stand-in must load",
      })
      .toBe(true);
    await expect
      .poll(() => page.evaluate(() => window.__gaProbe!.commands.length))
      .toBeGreaterThanOrEqual(2); // "js" and "config"
    expect(await page.evaluate(() => location.hash)).toBe("");

    // 2. A link pasted into the already-open tab (same-document navigation).
    await page.getByRole("button", { name: "Start over" }).click();
    await page.evaluate(
      (hash) => (location.hash = hash),
      `c=${MALFORMED_ADDR}&k=${FAKE_TOKEN}`,
    );
    await expect(page.getByTestId("try-error")).toHaveAttribute(
      "data-code",
      "invalid-link",
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.__gaProbe!.events.some((e) => e.type === "hashchange"),
        ),
      )
      .toBe(true);
    expect(await page.evaluate(() => location.hash)).toBe("");
    await page.waitForTimeout(1000);

    const probe = await page.evaluate(() => window.__gaProbe!);
    const observed = [
      probe.loadHref,
      ...probe.commands.map((c) => c.href),
      ...probe.events.map((e) => e.href),
    ];
    for (const href of observed) expect(href).not.toContain("#");
    const leaks = [...urls, ...collected, ...observed].filter(
      (u) => u.includes(MALFORMED_ADDR) || u.includes(FAKE_TOKEN),
    );
    expect(leaks).toEqual([]);
    // 3. Control: the probe does see fragments where nothing strips them
    // (the home page), so the empty observations above are not blind spots.
    await page.goto("/#probe-control");
    await expect
      .poll(() => page.evaluate(() => window.__gaProbe?.loadHref ?? ""))
      .toContain("#probe-control");

    record("fragment-not-sent", {
      requests: urls.length,
      analyticsRequests: collected.length,
      hrefAtParseEnd,
      gtagLoadHref: probe.loadHref,
      gtagCommands: probe.commands.length,
      historyEvents: probe.events.map((e) => e.type),
      leaks: leaks.length,
      controlSawFragment: true,
    });
  });

  test("a mangled link is rejected before the wasm loads", async ({ page }) => {
    const tailcat: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/tailcat/")) tailcat.push(r.url());
    });
    await page.goto(`/try#c=${MALFORMED_ADDR}&k=${FAKE_TOKEN}`);
    await expect(page.getByTestId("try-error")).toHaveAttribute(
      "data-code",
      "invalid-link",
    );
    await expect(
      page.getByText("This link is incomplete. Ask for a new one."),
    ).toBeVisible();
    expect(tailcat).toEqual([]);
    await shot(page, "invalid-link");
    record("mangled-link", { code: "invalid-link", tailcatRequests: 0 });
  });

  test("the 20 MB limit is inclusive", async ({ page }) => {
    await page.goto("/try");
    const input = page.getByTestId("try-file-input");
    const send = page.getByRole("button", { name: "Send", exact: true });

    await input.setInputFiles({
      name: "exact.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(20 * 1024 * 1024),
    });
    await expect(send).toBeEnabled();

    await page.locator("textarea").fill("x");
    await expect(send).toBeDisabled();
    await expect(page.getByText("Get the app for larger files")).toBeVisible();
    await shot(page, "over-limit");
    record("limit-boundary", { exact: "enabled", plusOneByte: "disabled" });
  });
});

const hasWasmBuild = (() => {
  try {
    const manifest = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "public/tailcat/manifest.json"),
        "utf8",
      ),
    ) as { files: { wasm: { path: string } } };
    readFileSync(path.join(process.cwd(), "public", manifest.files.wasm.path));
    return true;
  } catch {
    return false;
  }
})();

const newParty = async (
  browser: Browser,
  opts: { clipboard: boolean; mobile?: boolean },
): Promise<{ ctx: BrowserContext; page: Page }> => {
  const ctx = await browser.newContext({
    viewport: opts.mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    permissions: opts.clipboard ? ["clipboard-read", "clipboard-write"] : [],
    acceptDownloads: true,
  });
  return { ctx, page: await ctx.newPage() };
};

const linkOf = async (page: Page) => {
  const button = page.getByTestId("try-copy-link");
  await expect(button).toBeVisible({ timeout: 90_000 });
  const link = await button.getAttribute("data-link");
  expect(link).toMatch(/\/try#c=tc[\w-]+&k=[\w-]{22}$/);
  return new URL(link!).hash;
};

const saveBytes = async (page: Page, name: string) => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: `Save ${name}` }).click(),
  ]);
  return readFileSync((await download.path())!);
};

test.describe("try transfer over the public relay", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");
  test.skip(!hasWasmBuild, "run scripts/build-tailcat-wasm.sh first");
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("text, a PNG and a 5 MB file arrive intact; reply round-trips; a third reader gets BUSY", async ({
    browser,
  }) => {
    const sender = await newParty(browser, { clipboard: true });
    const receiver = await newParty(browser, { clipboard: true, mobile: true });

    const text = `Meeting notes ${Date.now()}\n- Ship the try-online page`;
    const png = readFileSync(
      path.join(process.cwd(), "public/favicon/apple-touch-icon.png"),
    );
    const big = randomBytes(5 * 1024 * 1024);

    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill(text);
    await sender.page.getByTestId("try-file-input").setInputFiles([
      { name: "icon.png", mimeType: "image/png", buffer: png },
      {
        name: "five-mb.bin",
        mimeType: "application/octet-stream",
        buffer: big,
      },
    ]);
    await shot(sender.page, "desktop-1-compose");
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();
    const fragment = await linkOf(sender.page);
    await shot(sender.page, "desktop-2-ready");

    await receiver.page.goto(`/try${fragment}`);
    expect(new URL(receiver.page.url()).hash).toBe("");
    await expect(receiver.page.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await shot(receiver.page, "mobile-3-received");

    await expect(receiver.page.getByTestId("try-received-text")).toHaveText(
      text,
    );
    await expect(receiver.page.getByText("Copied to clipboard")).toBeVisible();
    const clip = await receiver.page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clip).toBe(text);

    const gotPng = await saveBytes(receiver.page, "icon.png");
    const gotBig = await saveBytes(receiver.page, "five-mb.bin");
    expect(sha256(gotPng)).toBe(sha256(png));
    expect(sha256(gotBig)).toBe(sha256(big));

    await expect(sender.page.getByTestId("try-delivered")).toBeVisible();
    await shot(sender.page, "desktop-4-delivered");

    // A third reader with the same link is turned away.
    const third = await newParty(browser, { clipboard: false });
    await third.page.goto(`/try${fragment}`);
    await expect(third.page.getByTestId("try-error")).toHaveAttribute(
      "data-code",
      "busy",
      { timeout: 120_000 },
    );
    await expect(
      third.page.getByText("This link was already used. Ask for a new one."),
    ).toBeVisible();
    await shot(third.page, "desktop-5-busy");
    await third.ctx.close();

    // Reply from the receiver.
    const reply = `Got it, thanks! ${Date.now()}`;
    await receiver.page.getByRole("button", { name: "Reply" }).click();
    await receiver.page.locator("textarea").fill(reply);
    await shot(receiver.page, "mobile-6-reply-compose");
    await receiver.page.getByRole("button", { name: "Send reply" }).click();
    await expect(receiver.page.getByTestId("try-reply-delivered")).toBeVisible({
      timeout: 120_000,
    });
    await expect(sender.page.getByText(reply)).toBeVisible();
    const senderClip = await sender.page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(sha256(Buffer.from(senderClip))).toBe(sha256(Buffer.from(reply)));
    await shot(sender.page, "desktop-7-reply-received");

    record("round-trip", {
      text: "match",
      pngSha256: sha256(png),
      bigSha256: sha256(big),
      clipboard: "auto-copied",
      busy: "third context rejected",
      reply: "match",
    });
    await sender.ctx.close();
    await receiver.ctx.close();
  });

  test("without clipboard permission the Copy text fallback appears", async ({
    browser,
  }) => {
    const sender = await newParty(browser, { clipboard: false });
    const receiver = await newParty(browser, { clipboard: false });
    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill("fallback please");
    // Script disguised as a page: must never become a same-origin HTML blob.
    await sender.page.getByTestId("try-file-input").setInputFiles({
      name: "evil.html",
      mimeType: "text/html",
      buffer: Buffer.from("<script>parent.pwned = true</script>"),
    });
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();
    const fragment = await linkOf(sender.page);

    // Headless Chromium grants clipboard writes to a focused page without a
    // prompt, so the denial is forced to exercise the fallback.
    await receiver.page.addInitScript(() => {
      navigator.clipboard.writeText = () =>
        Promise.reject(new DOMException("denied", "NotAllowedError"));
    });
    await receiver.page.goto(`/try${fragment}`);
    await expect(receiver.page.getByTestId("try-received")).toBeVisible({
      timeout: 120_000,
    });
    await expect(
      receiver.page.getByRole("button", { name: "Copy text" }),
    ).toBeVisible();
    await expect(
      receiver.page.getByText("Couldn't copy automatically"),
    ).toBeVisible();
    await shot(receiver.page, "desktop-8-copy-fallback");
    const blobType = await receiver.page.evaluate(async () => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[aria-label="Save evil.html"]',
      );
      return (await (await fetch(link!.href)).blob()).type;
    });
    expect(blobType).toBe("application/octet-stream");
    record("clipboard-fallback", {
      copyButton: "visible",
      htmlBlobType: blobType,
    });
    await sender.ctx.close();
    await receiver.ctx.close();
  });

  test("cancel mid-transfer on each side", async ({ browser }) => {
    for (const side of ["sender", "receiver"] as const) {
      const sender = await newParty(browser, { clipboard: false });
      const receiver = await newParty(browser, { clipboard: false });
      await sender.page.goto("/try");
      await sender.page.getByTestId("try-file-input").setInputFiles({
        name: "big.bin",
        mimeType: "application/octet-stream",
        buffer: randomBytes(18 * 1024 * 1024),
      });
      await sender.page
        .getByRole("button", { name: "Send", exact: true })
        .click();
      const fragment = await linkOf(sender.page);
      await receiver.page.goto(`/try${fragment}`);

      const canceller = side === "sender" ? sender.page : receiver.page;
      const other = side === "sender" ? receiver.page : sender.page;
      await expect(
        canceller
          .getByRole("progressbar")
          .or(canceller.getByText("Receiving…")),
      ).toBeVisible({
        timeout: 120_000,
      });
      await canceller.getByRole("button", { name: "Cancel" }).click();
      await expect(
        canceller.getByRole("heading", {
          name: "Send anything to another device.",
        }),
      ).toBeVisible();
      await expect(other.getByTestId("try-error")).toHaveAttribute(
        "data-code",
        /peer-cancelled|connection-lost/,
        { timeout: 60_000 },
      );
      await shot(other, `desktop-9-cancelled-by-${side}`);
      record(`cancel-by-${side}`, {
        otherSide: await other
          .getByTestId("try-error")
          .getAttribute("data-code"),
      });
      await sender.ctx.close();
      await receiver.ctx.close();
    }
  });

  test("an address in an unknown DERP region fails fast instead of freezing", async ({
    page,
  }) => {
    const started = Date.now();
    await page.goto(`/try#c=${addressFor(9999)}&k=${FAKE_TOKEN}`);
    await expect(page.getByTestId("try-error")).toHaveAttribute(
      "data-code",
      "connect-failed",
      { timeout: 60_000 },
    );
    // The main thread stays responsive.
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
    record("unknown-region", { ms: Date.now() - started });
  });

  test("an unreachable address shows the connection failure copy", async ({
    page,
  }) => {
    // An offline sender in a real region: tailcat gives up after 60 s.
    const addr = addressFor(await liveRegion());
    await page.goto(`/try#c=${addr}&k=${FAKE_TOKEN}`);
    await expect(page.getByText("Connecting…")).toBeVisible();
    await expect(page.getByTestId("try-error")).toBeVisible({
      timeout: 150_000,
    });
    await expect(
      page.getByText(
        "Couldn't connect. Ask the sender to keep their page open, then try again.",
      ),
    ).toBeVisible();
    await shot(page, "desktop-10-connect-failed");
    record("unreachable", {
      code: await page.getByTestId("try-error").getAttribute("data-code"),
    });
  });
});
