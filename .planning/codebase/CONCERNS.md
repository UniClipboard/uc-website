# Codebase Concerns

## Scope and Method
- Focused on technical debt, fragility, security/performance risk, and operational gaps across runtime code, tests, and CI.
- Evidence source paths include `src/`, `.github/workflows/`, `package.json`, and `README.md`.
- Local verification signals used:
- `npm run test -- --runInBand` passed but emitted a Jest haste-map collision warning.
- `npm run build` failed with Google Fonts fetch timeout and unresolved modules in whitepaper route.

## High-Priority Risks

### 1) Broken sitemap URL construction (SEO + crawler correctness)
- File: `src/app/sitemap.ts`
- `page.path` values are defined without a leading slash (`""`, `"whitepaper"`), but URL concatenation assumes leading slashes.
- Current logic can generate malformed URLs such as:
- `${baseUrl}${page.path}` -> `https://example.comwhitepaper`
- `${baseUrl}/${locale}${page.path}` -> `https://example.com/zhwhitepaper`
- Risk:
- Search engines may index broken URLs.
- Canonical/discovery integrity is reduced for non-default locale pages.
- Planning action:
- Normalize path join logic (`/${page.path}` or explicit route map with full paths).
- Add a unit test for URL generation edge cases.

### 2) Production build fragility from external font fetches and missing runtime packages
- Files: `src/lib/fonts.ts`, `src/app/[locale]/whitepaper/page.tsx`, `package.json`, `package-lock.json`
- `next/font/google` in `src/lib/fonts.ts` requires network access at build time and failed with `ETIMEDOUT`.
- Whitepaper route imports `react-markdown` and `remark-gfm` from `src/app/[locale]/whitepaper/page.tsx`; build reported module resolution failure in current environment.
- Risk:
- Build/release reliability depends on external network health and local dependency state.
- CI/CD or restricted network environments can fail unpredictably.
- Planning action:
- Consider `next/font/local` or self-hosted fallbacks for deterministic builds.
- Ensure lockfile + install path consistency (`npm ci` in CI and local onboarding).
- Add a dependency validation step in CI (`npm ls --depth=0` or similar sanity check).

### 3) E2E smoke test likely stale and may not validate actual product behavior
- Files: `src/__tests__/e2e/home.spec.ts`, `src/lib/site-config.ts`, `src/app/[locale]/layout.tsx`
- E2E test expects title `/Next.js Starter/`, while metadata now derives from `siteConfig.title` (`UniClipboard | Safe & Efficient Universal Clipboard`).
- Risk:
- If currently failing, pipeline noise increases and confidence drops.
- If title matching accidentally passes in some contexts, test still provides low signal on core flows.
- Planning action:
- Update test to current product metadata and meaningful user journeys (locale switch, CTA links, whitepaper navigation).

### 4) Security hardening gaps at app boundary
- Files: `next.config.ts`, `src/app/[locale]/page.tsx`
- `next.config.ts` does not define security headers (CSP, frame-ancestors, x-content-type-options, etc.).
- `dangerouslySetInnerHTML` is used for JSON-LD in `src/app/[locale]/page.tsx`. Current payload is static, but pattern increases risk if future dynamic fields are introduced without strict sanitization.
- Risk:
- Broader attack surface for XSS/content injection regressions over time.
- Missing defense-in-depth for a public landing site.
- Planning action:
- Add baseline response headers in Next config/middleware.
- Encapsulate JSON-LD generation in a typed helper with explicit allowed fields.

## Medium-Priority Concerns

### 5) Runtime fragility in whitepaper content loading
- File: `src/app/[locale]/whitepaper/page.tsx`
- Direct `fs.readFile` of `content/whitepaper.md` has no error handling/fallback UI.
- Risk:
- Missing file or filesystem issues become hard 500 failures.
- Planning action:
- Add guarded read path (`try/catch`) with user-facing fallback and telemetry.

### 6) Locale/path switching logic can drop URL state
- File: `src/components/landing/Navigation.tsx`
- `switchLocalePathname` only rewrites pathname; query string/hash are not preserved.
- Risk:
- Deep links with query params or anchors can break when language is switched.
- Planning action:
- Use structured URL handling and preserve `search`/`hash`.

### 7) Config and documentation drift from starter template
- Files: `README.md`, `src/env.mjs`, `drizzle/*`, `package.json`
- README still advertises capabilities not present in current code (auth, Stripe flows, broader stack claims).
- `src/env.mjs` defines many optional auth/payment/database vars that appear unused by runtime routes.
- Drizzle artifacts remain (`drizzle/`) without corresponding active app integration.
- Risk:
- Onboarding confusion, misleading operational expectations, and maintenance overhead.
- Planning action:
- Decide target scope (lean landing vs full SaaS scaffold) and prune or implement missing subsystems.

### 8) CI quality gate hygiene can be stricter
- Files: `.github/workflows/lint.yml`, `.github/workflows/playwright.yml`
- `lint.yml` uses `actions/checkout@v2` and `npm install` instead of deterministic `npm ci`.
- No explicit test coverage threshold configured in `jest.config.js`.
- Playwright workflow injects many secrets tied to unused subsystems, adding operational complexity.
- Risk:
- Less reproducible CI and weaker signal-to-noise ratio from automation.
- Planning action:
- Standardize on `npm ci`, update action versions, tighten required checks, and trim unnecessary secret dependencies.

### 9) Local DX warning from worktree package collision
- Files: `jest.config.js`, `.worktrees/font-build-proxy/package.json`, `package.json`
- Running Jest in this workspace emits haste-map collision due duplicate package names between root and `.worktrees`.
- Risk:
- Developer confusion and potential future test resolution edge cases.
- Planning action:
- Add ignore patterns for `.worktrees` in Jest module discovery, or isolate worktrees outside repo root.

## Lower-Priority Debt and Drift

### 10) Orphaned locale/messages and content drift risk
- Files: `messages/pl.json`, `src/i18n/routing.ts`
- `messages/pl.json` exists while routing only enables `en` and `zh`.
- Risk:
- Dead content and translation drift.
- Planning action:
- Remove inactive locale files or formally add locale support with tests and routing changes.

### 11) Metadata/robots environment coupling
- Files: `src/app/robots.ts`, `src/lib/site-config.ts`, `src/env.mjs`
- `robots.ts` depends on `env.APP_URL`; default in env config is localhost and can leak incorrect URLs if environment config is wrong.
- Risk:
- Incorrect sitemap URL in robots metadata in misconfigured environments.
- Planning action:
- Add stronger production guardrails/validation for canonical base URL.

## Cross-Cutting Risk Themes
- Release reliability: build depends on external network and environment quality.
- Verification depth: tests exist but coverage breadth and E2E relevance are limited.
- Product boundary clarity: current repo mixes landing-page reality with starter/SaaS scaffolding residue.
- SEO correctness: routing/metadata generation needs tighter validation.

## Suggested Remediation Sequence
1. Fix shipping blockers: `src/app/sitemap.ts` URL generation and build reliability issues in `src/lib/fonts.ts` plus whitepaper dependencies.
2. Repair trust in automation: update `src/__tests__/e2e/home.spec.ts`, tighten CI install strategy and action versions in `.github/workflows/*.yml`.
3. Reduce scope drift: align `README.md`, `src/env.mjs`, and dependency surface with actual product scope.
4. Harden boundaries: add security headers and safer JSON-LD encapsulation.
5. Expand focused tests for locale routing, metadata, sitemap generation, and whitepaper fault handling.
