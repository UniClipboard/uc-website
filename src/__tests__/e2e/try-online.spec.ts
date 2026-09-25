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

// ---------- 6-digit code ----------

// playwright.config.ts points the page at this host; every request to it is
// answered by the stub below, never by the real rendezvous service.
const RENDEZVOUS = "https://rendezvous.e2e.test";

// Set to a local uc-rendezvous origin to run the live tests at the end of
// this file instead of the stubbed ones (see playwright.config.ts).
const LIVE_RENDEZVOUS = process.env.TRY_E2E_RENDEZVOUS_URL?.replace(/\/+$/, "");

type StubEntry = { ticket: string; expiresAtMs: number; consumed: boolean };

/**
 * An in-memory stand-in for the uc-rendezvous `/v1/web-pairings` routes,
 * shared by every browser context it is installed on. `fail` forces a status
 * for the next matching calls.
 */
class RendezvousStub {
  readonly codes = new Map<string, StubEntry>();
  readonly calls: { route: string; body: unknown; origin: string | null }[] =
    [];
  ttlMs = 300_000;
  fail: Partial<Record<"create" | "resolve", number[]>> = {};

  put(code: string, ticket: string) {
    this.codes.set(code, {
      ticket,
      expiresAtMs: Date.now() + this.ttlMs,
      consumed: false,
    });
  }

  count = (route: string) => this.calls.filter((c) => c.route === route).length;

  async install(ctx: BrowserContext) {
    await ctx.route(`${RENDEZVOUS}/**`, async (route) => {
      const req = route.request();
      const origin = req.headers()["origin"] ?? null;
      const cors = {
        "access-control-allow-origin": origin ?? "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        vary: "Origin",
      };
      if (req.method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers: cors });
      }
      const name = new URL(req.url()).pathname.replace("/v1/web-pairings", "");
      const routeName =
        name === "" ? "create" : name === "/resolve" ? "resolve" : "consume";
      const body = req.postDataJSON() as Record<string, string>;
      this.calls.push({ route: routeName, body, origin });
      const reply = (status: number, json: unknown) =>
        route.fulfill({ status, headers: cors, json });

      const forced =
        routeName === "consume" ? undefined : this.fail[routeName]?.shift();
      if (forced) return reply(forced, { error: { code: "forced" } });

      if (routeName === "create") {
        let code;
        do {
          const n = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
          code = `${n.slice(0, 3)}-${n.slice(3)}`;
        } while (this.codes.has(code));
        this.put(code, body.ticket);
        return reply(200, {
          code,
          expiresAtMs: this.codes.get(code)!.expiresAtMs,
        });
      }
      const entry = this.codes.get(body.code);
      if (!entry) return reply(404, { error: { code: "pairing_not_found" } });
      if (Date.now() >= entry.expiresAtMs) {
        return reply(404, { error: { code: "pairing_expired" } });
      }
      if (entry.consumed) {
        return reply(409, { error: { code: "pairing_already_consumed" } });
      }
      if (routeName === "consume") {
        entry.consumed = true;
        return reply(200, { ok: true });
      }
      return reply(200, {
        ticket: entry.ticket,
        expiresAtMs: entry.expiresAtMs,
      });
    });
  }
}

const webTicket = (addr: string) =>
  JSON.stringify({ v: 1, kind: "uc-web-try", c: addr, k: FAKE_TOKEN });

const enterCode = async (
  page: Page,
  variant: "row" | "start",
  code: string,
) => {
  const input = page.getByTestId(`try-code-input-${variant}`);
  await input.fill(code);
  await input.press("Enter");
};

test.describe("try 6-digit code: receiver", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");
  test.skip(
    !!LIVE_RENDEZVOUS,
    "stub tests; live mode targets a real rendezvous",
  );

  test("lookup failures show inline copy and never load the wasm", async ({
    browser,
  }) => {
    const stub = new RendezvousStub();
    stub.put("111-111", webTicket(addressFor(1)));
    stub.codes.get("111-111")!.consumed = true;
    stub.put("222-222", "nodeabc123-native-looking-ticket");
    stub.put("333-333", webTicket(MALFORMED_ADDR));

    const cases = [
      { mobile: false, code: "12345", reason: "incomplete" },
      // Pasted with surrounding text: only the digits count.
      { mobile: false, code: "Code: 999 999", reason: "expired" },
      { mobile: false, code: "111111", reason: "expired" },
      { mobile: false, code: "222 222", reason: "invalid" },
      { mobile: true, code: "333333", reason: "invalid" },
      { mobile: true, code: "444444", reason: "rate-limited", force: 429 },
      { mobile: true, code: "555555", reason: "unavailable", force: 503 },
    ];
    const seen: Record<string, string> = {};
    for (const mobile of [false, true]) {
      const { ctx, page } = await newParty(browser, {
        clipboard: false,
        mobile,
      });
      await stub.install(ctx);
      const requests: string[] = [];
      page.on("request", (r) =>
        requests.push(r.url() + " " + (r.postData() ?? "")),
      );
      await page.goto("/try");
      const variant = mobile ? "start" : "row";
      if (mobile) {
        // Phones start on the code field; the compose card is one tap away.
        await expect(
          page.getByRole("heading", {
            name: "Enter the code from your other device.",
          }),
        ).toBeVisible();
        await expect(page.locator("textarea")).toBeHidden();
      } else {
        await expect(page.getByText("Have a code?")).toBeVisible();
      }
      for (const c of cases.filter((x) => x.mobile === mobile)) {
        if (c.force) stub.fail.resolve = [c.force];
        await enterCode(page, variant, c.code);
        const error = page.getByTestId("try-code-error");
        await expect(error).toHaveAttribute("data-reason", c.reason);
        seen[c.code] = (await error.textContent()) ?? "";
        await shot(page, `${mobile ? "mobile" : "desktop"}-code-${c.reason}`);
      }
      if (mobile) {
        await page
          .getByRole("button", { name: "Send something instead" })
          .click();
        await expect(page.locator("textarea")).toBeVisible();
        await expect(page.getByTestId("try-code-input-row")).toBeVisible();
      }
      expect(requests.filter((r) => r.includes("/tailcat/"))).toEqual([]);
      // The code goes to the rendezvous service and nowhere else.
      const leaks = requests.filter(
        (r) =>
          !r.startsWith(RENDEZVOUS) && /999.?999|111.?111|222.?222/.test(r),
      );
      expect(leaks).toEqual([]);
      await ctx.close();
    }

    expect(seen["Code: 999 999"]).toBe(
      "This code has expired or was already used. Ask for a new one.",
    );
    expect(seen["222 222"]).toBe(
      "That isn't a valid code. Check the digits and try again.",
    );
    expect(seen["444444"]).toBe("Too many tries. Wait a minute and try again.");
    expect(seen["555555"]).toBe(
      "Can't check codes right now. Ask the sender for the link or QR instead.",
    );
    // Every lookup went out as NNN-NNN with the page's origin (CORS).
    const resolves = stub.calls.filter((c) => c.route === "resolve");
    expect(resolves.map((c) => (c.body as { code: string }).code)).toEqual([
      "999-999",
      "111-111",
      "222-222",
      "333-333",
      "444-444",
      "555-555",
    ]);
    expect(new Set(resolves.map((c) => c.origin))).toEqual(
      new Set(["http://127.0.0.1:3000"]),
    );
    expect(stub.count("consume")).toBe(0);
    record("code-lookup-errors", { reasons: seen, tailcatRequests: 0 });
  });
});

test.describe("try 6-digit code over the public relay", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");
  test.skip(
    !!LIVE_RENDEZVOUS,
    "stub tests; live mode targets a real rendezvous",
  );
  test.skip(!hasWasmBuild, "run scripts/build-tailcat-wasm.sh first");
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("a code resolves, transfers once and is used up", async ({
    browser,
  }) => {
    const stub = new RendezvousStub();
    const sender = await newParty(browser, { clipboard: false });
    const receiver = await newParty(browser, {
      clipboard: false,
      mobile: true,
    });
    await stub.install(sender.ctx);
    await stub.install(receiver.ctx);

    const text = `Sent by code ${Date.now()}`;
    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill(text);
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();
    const value = sender.page.getByTestId("try-code-value");
    await expect(value).toHaveText(/^\d{3} \d{3}$/, { timeout: 90_000 });
    await expect(sender.page.getByText("One use")).toBeVisible();
    await shot(sender.page, "desktop-code-ready");
    const shown = (await value.textContent())!;
    const created = stub.calls.find((c) => c.route === "create")!;
    const ticket = JSON.parse((created.body as { ticket: string }).ticket);
    expect(ticket).toMatchObject({ v: 1, kind: "uc-web-try" });
    expect(ticket.c).toMatch(/^tc/);

    await receiver.page.goto("/try");
    await shot(receiver.page, "mobile-code-start");
    await enterCode(receiver.page, "start", shown);
    await expect(receiver.page.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await expect(receiver.page.getByTestId("try-received-text")).toHaveText(
      text,
    );
    await shot(receiver.page, "mobile-code-received");
    await expect(sender.page.getByTestId("try-delivered")).toBeVisible();

    // Used up: both sides consume, and a second lookup is refused.
    const code = shown.replace(" ", "-");
    await expect.poll(() => stub.count("consume")).toBeGreaterThanOrEqual(1);
    expect(stub.codes.get(code)!.consumed).toBe(true);
    const third = await newParty(browser, { clipboard: false });
    await stub.install(third.ctx);
    await third.page.goto("/try");
    await enterCode(third.page, "row", shown);
    await expect(third.page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "expired",
    );
    expect(stub.count("create")).toBe(1);
    record("code-round-trip", {
      text: "match",
      creates: stub.count("create"),
      consumes: stub.count("consume"),
      secondLookup: "expired",
    });
    await third.ctx.close();
    await sender.ctx.close();
    await receiver.ctx.close();
  });

  test("the sender recovers from an outage and renews an expired code", async ({
    browser,
  }) => {
    const stub = new RendezvousStub();
    stub.fail.create = [503];
    stub.ttlMs = 4_000;
    const sender = await newParty(browser, { clipboard: false });
    await stub.install(sender.ctx);
    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill("renewal");
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();

    const slot = sender.page.getByTestId("try-sender-code");
    await expect(slot).toHaveAttribute("data-status", "unavailable", {
      timeout: 90_000,
    });
    await expect(
      sender.page.getByText("Can't get a code right now"),
    ).toBeVisible();
    // The link still works while the code is unavailable.
    await expect(sender.page.getByTestId("try-copy-link")).toBeVisible();
    await shot(sender.page, "desktop-code-unavailable");

    await slot.getByRole("button", { name: "Try again" }).click();
    const value = sender.page.getByTestId("try-code-value");
    await expect(value).toHaveText(/^\d{3} \d{3}$/);
    const first = await value.textContent();
    await sender.page.setViewportSize({ width: 390, height: 844 });
    await shot(sender.page, "mobile-code-ready");
    await sender.page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(() => stub.count("create"), { timeout: 15_000 }).toBe(3);
    await expect(value).toHaveText(/^\d{3} \d{3}$/);
    expect(await value.textContent()).not.toBe(first);

    // Cancelling uses up the live code so nobody can look it up afterwards.
    stub.ttlMs = 300_000;
    await expect.poll(() => stub.count("create"), { timeout: 15_000 }).toBe(4);
    await expect(value).toHaveText(/^\d{3} \d{3}$/);
    const last = (await value.textContent())!.replace(" ", "-");
    await sender.page.getByRole("button", { name: "Cancel" }).click();
    await expect.poll(() => stub.codes.get(last)?.consumed).toBe(true);
    record("code-renewal", {
      creates: stub.count("create"),
      unavailableThenRetry: true,
      consumedOnCancel: true,
    });
    await sender.ctx.close();
  });
});

// ---------- 6-digit code against a live local rendezvous ----------

/**
 * Runs only with TRY_E2E_RENDEZVOUS_URL set to a local uc-rendezvous that
 * implements the web pairing routes (contract v1). Nothing here is stubbed
 * except the one 5xx case, which a healthy service cannot produce on demand.
 * The 429 test runs last: it spends the resolve budget for this IP.
 *
 * TRY_E2E_SHORT_TTL_MS: the code TTL the local service was started with,
 * when it was shortened for testing; the renewal test needs it.
 */
test.describe("try 6-digit code against a live rendezvous", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");
  test.skip(!LIVE_RENDEZVOUS, "set TRY_E2E_RENDEZVOUS_URL to a local service");
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  const SHORT_TTL_MS = Number(process.env.TRY_E2E_SHORT_TTL_MS) || 0;

  // Node-side calls present a documentation-range client IP, which the local
  // service honours, so they spend their own rate-limit bucket and not the
  // browser's loopback one. The page itself never sends this header.
  const API_CLIENT_IP = `2001:db8::${randomBytes(2).toString("hex")}`;

  type ApiResult = {
    status: number;
    headers: Headers;
    json: Record<string, unknown> | null;
  };

  const api = async (
    method: "OPTIONS" | "POST",
    route: string,
    origin: string,
    body?: unknown,
  ): Promise<ApiResult> => {
    const res = await fetch(`${LIVE_RENDEZVOUS}${route}`, {
      method,
      headers: {
        origin,
        "cf-connecting-ip": API_CLIENT_IP,
        ...(method === "OPTIONS"
          ? {
              "access-control-request-method": "POST",
              "access-control-request-headers": "content-type",
            }
          : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON; the status says enough.
    }
    return { status: res.status, headers: res.headers, json };
  };

  const createWeb = async (origin: string, ticket: string) => {
    const r = await api("POST", "/v1/web-pairings", origin, { ticket });
    expect(r.status, JSON.stringify(r.json)).toBe(200);
    expect(r.json?.code).toMatch(/^\d{3}-\d{3}$/);
    return r.json!.code as string;
  };

  const errorCode = (r: ApiResult) =>
    (r.json?.error as { code?: string } | undefined)?.code;

  const randomCode = () => {
    const n = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
    return `${n.slice(0, 3)}-${n.slice(3)}`;
  };

  test("CORS, validation and code-pool isolation", async ({
    browser,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const evidence: Record<string, unknown> = { origin };

    for (const route of [
      "/v1/web-pairings",
      "/v1/web-pairings/resolve",
      "/v1/web-pairings/consume",
    ]) {
      const pre = await api("OPTIONS", route, origin);
      expect(pre.status, route).toBe(204);
      expect(pre.headers.get("access-control-allow-origin")).toBe(origin);
      expect(pre.headers.get("access-control-allow-methods")).toContain("POST");
      expect(
        pre.headers.get("access-control-allow-headers")?.toLowerCase(),
      ).toContain("content-type");
      expect(pre.headers.get("access-control-allow-credentials")).toBeNull();
      const foreign = await api("OPTIONS", route, "https://evil.example");
      expect(foreign.headers.get("access-control-allow-origin")).not.toBe(
        "https://evil.example",
      );
      evidence[`options ${route}`] = {
        status: pre.status,
        allowOrigin: pre.headers.get("access-control-allow-origin"),
        maxAge: pre.headers.get("access-control-max-age"),
        foreignAllowOrigin: foreign.headers.get("access-control-allow-origin"),
      };
    }

    // Error responses carry CORS headers too.
    const unknown = await api("POST", "/v1/web-pairings/resolve", origin, {
      code: randomCode(),
    });
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("access-control-allow-origin")).toBe(origin);
    const tooLong = await api("POST", "/v1/web-pairings", origin, {
      ticket: "x".repeat(4097),
    });
    expect(tooLong.status).toBe(400);
    expect(tooLong.headers.get("access-control-allow-origin")).toBe(origin);
    // The server fixes the TTL; a client value must not stretch it.
    const stretched = await api("POST", "/v1/web-pairings", origin, {
      ticket: "ttl-probe",
      ttlSecs: 86_400,
    });
    if (stretched.status === 200) {
      const ttl = (stretched.json!.expiresAtMs as number) - Date.now();
      expect(ttl).toBeLessThanOrEqual(300_000 + 5_000);
    } else {
      expect(stretched.status).toBe(400);
    }
    evidence.errors = {
      unknownResolve: [unknown.status, errorCode(unknown)],
      ticket4097: [tooLong.status, errorCode(tooLong)],
      clientTtl: stretched.status,
    };

    // Isolation: a web code is not a native code, and the other way round.
    const nativeLooking = await createWeb(origin, "native-looking-ticket");
    const viaNative = await api("POST", "/v1/pairings/resolve", origin, {
      code: nativeLooking,
    });
    const native = await api("POST", "/v1/pairings", origin, {
      sponsorDeviceId: "uc-website-e2e",
      sponsorDeviceName: "uc-website e2e",
      sponsorEndpointId: "uc-website-e2e",
      sponsorTicket: "native-e2e-ticket",
      ttlSecs: 60,
      codeLength: 6,
    });
    expect(native.status, JSON.stringify(native.json)).toBe(200);
    const nativeCode = native.json!.code as string;
    const nativeViaWeb = await api("POST", "/v1/web-pairings/resolve", origin, {
      code: nativeCode,
    });
    // The namespaces are separate, so the same digits may exist in both;
    // what must never happen is one side returning the other's record.
    expect(JSON.stringify(viaNative.json ?? {})).not.toContain(
      "native-looking-ticket",
    );
    expect(JSON.stringify(nativeViaWeb.json ?? {})).not.toContain(
      "native-e2e-ticket",
    );
    evidence.isolation = {
      webCodeOnNativeRoute: viaNative.status,
      nativeCodeOnWebRoute: nativeViaWeb.status,
      crossRecordReturned: false,
    };

    // The page: a web code with a foreign ticket, and a native code.
    const { ctx, page } = await newParty(browser, { clipboard: false });
    const tailcat: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/tailcat/")) tailcat.push(r.url());
    });
    await page.goto("/try");
    await enterCode(page, "row", nativeLooking);
    await expect(page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "invalid",
    );
    await shot(page, "live-desktop-code-invalid");
    // A native code is unknown to the web pool (unless the same digits were
    // independently issued there, which the service allows).
    if (nativeViaWeb.status === 404) {
      await enterCode(page, "row", nativeCode);
      await expect(page.getByTestId("try-code-error")).toHaveAttribute(
        "data-reason",
        "expired",
      );
    }
    expect(tailcat).toEqual([]);
    await ctx.close();
    evidence.page = {
      webCodeWithForeignTicket: "invalid",
      nativeCode: nativeViaWeb.status === 404 ? "expired" : "skipped",
      tailcatRequests: 0,
    };
    record("live-cors-and-isolation", evidence);
  });

  test("register → resolve → transfer → consume", async ({
    browser,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const sender = await newParty(browser, { clipboard: false });
    const receiver = await newParty(browser, {
      clipboard: false,
      mobile: true,
    });
    const seen: { url: string; status: number; allowOrigin: string | null }[] =
      [];
    let createdTicket: string | null = null;
    for (const party of [sender, receiver]) {
      party.page.on("response", (r) => {
        if (!r.url().startsWith(LIVE_RENDEZVOUS!)) return;
        seen.push({
          url: new URL(r.url()).pathname,
          status: r.status(),
          allowOrigin: r.headers()["access-control-allow-origin"] ?? null,
        });
      });
    }
    sender.page.on("request", (r) => {
      if (r.url() === `${LIVE_RENDEZVOUS}/v1/web-pairings`) {
        createdTicket = (r.postDataJSON() as { ticket: string }).ticket;
      }
    });

    const text = `Sent by code through a live rendezvous ${Date.now()}`;
    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill(text);
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();
    const value = sender.page.getByTestId("try-code-value");
    await expect(value).toHaveText(/^\d{3} \d{3}$/, { timeout: 90_000 });
    await shot(sender.page, "live-desktop-code-ready");
    const shown = (await value.textContent())!;
    const code = shown.replace(" ", "-");
    expect(JSON.parse(createdTicket!)).toMatchObject({
      v: 1,
      kind: "uc-web-try",
    });

    await receiver.page.goto("/try");
    await enterCode(receiver.page, "start", shown);
    await expect(receiver.page.getByTestId("try-received")).toBeVisible({
      timeout: 180_000,
    });
    await expect(receiver.page.getByTestId("try-received-text")).toHaveText(
      text,
    );
    await shot(receiver.page, "live-mobile-code-received");
    await expect(sender.page.getByTestId("try-delivered")).toBeVisible();

    // Used up on the server: a later lookup is refused as consumed.
    await expect
      .poll(async () => {
        const r = await api("POST", "/v1/web-pairings/resolve", origin, {
          code,
        });
        return `${r.status} ${errorCode(r)}`;
      })
      .toBe("409 pairing_already_consumed");
    const third = await newParty(browser, { clipboard: false });
    await third.page.goto("/try");
    await enterCode(third.page, "row", shown);
    await expect(third.page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "expired",
    );
    await third.ctx.close();

    // Every browser call succeeded across origins with the page's origin.
    const routes = seen.map((s) => `${s.url} ${s.status}`);
    expect(routes).toEqual(
      expect.arrayContaining([
        "/v1/web-pairings 200",
        "/v1/web-pairings/resolve 200",
        "/v1/web-pairings/consume 200",
      ]),
    );
    for (const s of seen) expect(s.allowOrigin).toBe(origin);
    record("live-round-trip", {
      text: "match",
      browserCalls: routes,
      afterwards: "409 pairing_already_consumed",
    });
    await sender.ctx.close();
    await receiver.ctx.close();
  });

  test("an expired code is replaced; cancel uses up the live one", async ({
    browser,
    baseURL,
  }) => {
    test.skip(
      !SHORT_TTL_MS,
      "set TRY_E2E_SHORT_TTL_MS to the local service's shortened TTL",
    );
    const origin = new URL(baseURL!).origin;
    const sender = await newParty(browser, { clipboard: false });
    const issued: { code: string; expiresAtMs: number; at: number }[] = [];
    sender.page.on("response", async (r) => {
      if (r.url() !== `${LIVE_RENDEZVOUS}/v1/web-pairings` || !r.ok()) return;
      const body = (await r.json()) as { code: string; expiresAtMs: number };
      issued.push({ ...body, at: Date.now() });
    });
    await sender.page.goto("/try");
    await sender.page.locator("textarea").fill("renewal");
    await sender.page
      .getByRole("button", { name: "Send", exact: true })
      .click();
    const value = sender.page.getByTestId("try-code-value");
    await expect(value).toHaveText(/^\d{3} \d{3}$/, { timeout: 90_000 });
    const first = (await value.textContent())!.replace(" ", "-");

    await expect
      .poll(() => issued.length, { timeout: SHORT_TTL_MS + 20_000 })
      .toBeGreaterThanOrEqual(2);
    await expect(value).toHaveText(/^\d{3} \d{3}$/);
    const expired = await api("POST", "/v1/web-pairings/resolve", origin, {
      code: first,
    });
    expect(expired.status).toBe(404);
    // The countdown follows the server's clock, not a client constant.
    const ttl = issued[0].expiresAtMs - issued[0].at;
    expect(Math.abs(ttl - SHORT_TTL_MS)).toBeLessThan(3_000);

    // Expired outranks consumed on the server, so check the cancel while the
    // code is fresh: wait for the next renewal, then cancel at once.
    const before = issued.length;
    await expect
      .poll(() => issued.length, { timeout: SHORT_TTL_MS + 20_000 })
      .toBeGreaterThan(before);
    const fresh = issued.at(-1)!;
    await expect(value).toHaveText(fresh.code.replace("-", " "));
    await sender.page.getByRole("button", { name: "Cancel" }).click();
    let afterCancel = 0;
    while (Date.now() < fresh.expiresAtMs - 500) {
      const r = await api("POST", "/v1/web-pairings/resolve", origin, {
        code: fresh.code,
      });
      afterCancel = r.status;
      if (r.status !== 200) break;
      await sender.page.waitForTimeout(100);
    }
    expect(afterCancel).toBe(409);
    record("live-renewal", {
      ttlMs: ttl,
      creates: issued.length,
      firstAfterExpiry: [expired.status, errorCode(expired)],
      cancelled: 409,
    });
    await sender.ctx.close();
  });

  test("outage copy, then 429 with CORS and Retry-After (runs last)", async ({
    browser,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const { ctx, page } = await newParty(browser, {
      clipboard: false,
      mobile: true,
    });
    await page.goto("/try");

    // A healthy service cannot fail on demand: these two are simulated.
    await page.route(`${LIVE_RENDEZVOUS}/v1/web-pairings/resolve`, (r) =>
      r.fulfill({
        status: 503,
        headers: { "access-control-allow-origin": origin },
        json: { error: { code: "internal" } },
      }),
    );
    await enterCode(page, "start", "123456");
    await expect(page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "unavailable",
    );
    await page.unroute(`${LIVE_RENDEZVOUS}/v1/web-pairings/resolve`);
    await page.route(`${LIVE_RENDEZVOUS}/**`, (r) => r.abort("failed"));
    await enterCode(page, "start", "123456");
    await expect(page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "unavailable",
    );
    await page.unroute(`${LIVE_RENDEZVOUS}/**`);

    // Real rate limiting: spend the budget from the page itself, so the
    // service sees the same client as the next lookup. A readable status in
    // the page already proves the CORS headers; Playwright's view of the
    // response shows the raw headers, which page scripts cannot read.
    // The local limiter uses minute-aligned windows: start well inside one,
    // so the burst and the next lookup land in the same window.
    const second = new Date().getSeconds();
    if (second > 40) await page.waitForTimeout((61 - second) * 1000);
    let limitedHeaders: Record<string, string> | null = null;
    const onResponse = (r: import("@playwright/test").Response) => {
      if (r.status() === 429 && !limitedHeaders) limitedHeaders = r.headers();
    };
    page.on("response", onResponse);
    const burst = await page.evaluate(async (url) => {
      const statuses: number[] = [];
      for (let i = 0; i < 40; i++) {
        const res = await fetch(`${url}/v1/web-pairings/resolve`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: "000-000" }),
        });
        statuses.push(res.status);
        if (res.status === 429) break;
      }
      return statuses;
    }, LIVE_RENDEZVOUS!);
    expect(burst.at(-1)).toBe(429);
    await expect.poll(() => limitedHeaders).not.toBeNull();
    page.off("response", onResponse);
    const headers = limitedHeaders! as Record<string, string>;
    expect(headers["access-control-allow-origin"]).toBe(origin);
    expect(Number(headers["retry-after"])).toBeGreaterThan(0);
    const limited = { retryAfter: headers["retry-after"] };

    await enterCode(page, "start", "123456");
    await expect(page.getByTestId("try-code-error")).toHaveAttribute(
      "data-reason",
      "rate-limited",
    );
    await expect(
      page.getByText("Too many tries. Wait a minute and try again."),
    ).toBeVisible();
    await shot(page, "live-mobile-code-rate-limited");
    record("live-errors", {
      simulated5xx: "unavailable",
      simulatedNetwork: "unavailable",
      requestsUntil429: burst.length,
      retryAfter: limited.retryAfter,
      rateLimitedCopy: true,
    });
    await ctx.close();
  });
});
