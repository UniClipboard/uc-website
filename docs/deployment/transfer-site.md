# Independent browser transfer site

`apps/try` is a separate Next.js application in this repository, intended for
`https://try.uniclipboard.app`. The marketing site remains the root application.
Each has its own Vercel project and build. Do not alias the transfer domain to
`uc-website`: that would expose the entire marketing site on the new origin.

## Source and dependency boundary

The transfer app has its own `package.json` and `bun.lock`, pinned to the same
versions as the marketing site's current lock. Install from **apps/try** only.
It needs nine runtime dependencies and no database, Clerk, blog, cron, analytics,
Tailwind pipeline, or marketing-site environment configuration.

`apps/try/scripts/prepare.mjs` materializes a short allowlist of shared source
into ignored `.shared/`, and pinned assets into ignored `public/tailcat/` before
dev/build/typecheck. Edit the originals in `src/components/try`,
`src/lib/web-transfer`, and `messages`, never the generated copies. Only `try`
and navigation messages are included. This keeps one maintained transfer
implementation without making the new project install the whole website.
Restart dev after editing shared inputs. The new app owns only its layout,
locale middleware, minimal header/styles, and route metadata.

Vercel must include repository files outside its Root Directory in the build
step (`sourceFilesOutsideRootDirectory: true`). Its Root Directory is
`apps/try`, install command `bun install --frozen-lockfile`, build command
`bun run build`, framework Next.js, Node 24.x. The root site's settings and
`vercel.json` cron configuration are not reused.

## Local commands

From the repository root:

```sh
bun install --cwd apps/try --frozen-lockfile
NEXT_PUBLIC_TRY_SHORT_CODE=1 NEXT_PUBLIC_TRY_RENDEZVOUS_URL=http://localhost:18787 bun run --cwd apps/try dev --port 3210
bun run --cwd apps/try typecheck
bun run --cwd apps/try build
bun run --cwd apps/try start --port 3210
```

For a production build, set the two public values below at **build time**:

```dotenv
NEXT_PUBLIC_TRY_SHORT_CODE=1
NEXT_PUBLIC_TRY_RENDEZVOUS_URL=https://rendezvous.uniclipboard.app
```

These values are public browser configuration, not credentials. Production
rendezvous permits the canonical try origin, not arbitrary `*.vercel.app`
previews. Preview the shell/link/QR flows with short codes disabled, or use an
explicitly authorized non-production backend. Never widen production CORS to
all preview origins to make a preview pass.

The new routes `/`, `/zh`, `/ru` are prebuilt with 3600-second ISR. Locale
detection/cookies are disabled in this app so English links always remain
English. `/en` canonicalizes to `/`; `/try`, `/en/try`, `/zh/try`, `/ru/try`
also redirect to their corresponding new root routes. The pinned wasm is only
loaded after send/receive intent, and has immutable caching.

## Cutover and privacy

Leave `NEXT_PUBLIC_TRY_SITE_URL` **unset on the website** until the coordinator
has confirmed the backend production handoff, new domain, and site acceptance.
Once ready, set it on `uc-website` to `https://try.uniclipboard.app` and rebuild.
This one build-time switch updates all website try entry points and enables
307 redirects for old locale paths at the start of the website middleware,
before locale negotiation, markdown rewriting, or HTML rendering.

The redirects set `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
Their Location has **no fragment component**. Browsers inherit the original
fragment per RFC 9110 §10.2.2. The old HTML never loads, so its fragment capture
cannot consume the ticket. On the destination, the inline head capture script
moves it into memory and removes it from the URL before hydration. The new site
has no analytics. Tickets must never be put into a query string or a server
request for redirecting. The short-code registry intentionally receives its
opaque ticket through the existing API protocol; that is separate from URL
leakage.

Both old and new sites continue using the same protocol, 20 MB cap, and public
tailcat relays. Old links remain usable while their original sender is open.
The sender's deployment need not generate new-root links for recovery to work.

## Reproducible browser acceptance

Use synthetic content only. macOS with Swift/Vision is required by the QR
acceptance helper; it decodes QR screenshots entirely in memory without saving
tickets. Chromium must be installed for Playwright. The suite uses actual
wasm/public relay transport and a **simulated** short-code registry, so it does
not prove production CORS/TTL/rate limits. A real backend browser pass on the
canonical domain remains a cutover requirement.

```sh
bun install --frozen-lockfile
bun install --cwd apps/try --frozen-lockfile
NEXT_PUBLIC_TRY_SHORT_CODE=1 NEXT_PUBLIC_TRY_RENDEZVOUS_URL=https://rendezvous.e2e.test bun run --cwd apps/try build
# The website build uses its normal existing environment, independently.
NEXT_PUBLIC_TRY_SITE_URL=http://localhost:3210 bun run build
TRY_E2E_ARTIFACTS=.herdr-project/uni-t-0049/library/e2e-production bunx playwright test --config playwright.transfer.config.ts
```

Ports 3210 and 3211 must be free; the suite owns and closes its servers and
will not reuse another process. Artifacts are idle layout screenshots and
boolean assertions/file digests; traces, videos and automatic screenshots are
disabled to avoid retaining tickets. Do not add live connection URLs, codes or
QR screenshots to logs/reports. The suite covers three languages at desktop
and phone widths, themes, idle loading, SSR/cache headers, fragment capture and
redirects, link/QR matching, real text/file integrity, and the 20 MB guard.

Physical devices, Safari/Firefox, production DNS/TLS/CORS, preview deployment
integration, and backend rate-limit/expiry behavior need separate acceptance.

## Release order and rollback

1. Review the source, build evidence, proposed project/domain/DNS/env operations.
2. Confirm rendezvous t-0050's **actual production** revision/version and smoke
   results (PR checks alone are insufficient). Keep old website CORS origins.
3. Create the independent project; verify root directory, outside-root source
   access, repository integration, install/build settings, and env targets.
   Obtain a preview deployment first; record its exact Git SHA and build logs.
4. Add `try.uniclipboard.app` only if no conflicting project owns it. It is in
   the existing Cloudflare-managed `uniclipboard.app` zone. Use the CNAME target
   returned by Vercel's domain configuration at that time; do not change the
   zone's nameservers or existing apex/www records. Prefer DNS-only for this
   dedicated hostname so Cloudflare cannot inject an analytics beacon into a
   ticket-bearing initial document. Verify any zone-wide redirects/Workers.
5. Deploy and verify the new canonical origin, TLS, CORS on real short-code
   requests, text/small file, QR/link and three-language flows. Record project,
   deployment ID, source SHA and DNS before enabling the website switch.
6. Enable the website switch and deploy the website. Recheck its exact live
   deployment, old links (including apex -> www -> try), fragment privacy,
   locale paths, main-site download links, and cache headers.

To roll back the old-site cutover, remove `NEXT_PUBLIC_TRY_SITE_URL` from
`uc-website` and redeploy its last known-good revision/config. The temporary,
no-store redirects avoid a permanent browser redirect cache. Roll the new
project back independently if needed; keep the hostname and assets alive for
links already issued. Do not delete shared infrastructure or change backend
protocol/CORS during a website rollback.

References: [Vercel monorepo source access](https://vercel.com/docs/monorepos/monorepo-faq),
[RFC 9110 Location fragment inheritance](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.2).
