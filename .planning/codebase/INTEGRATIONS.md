# External Integrations

## Classification
- **Active**: integration is used by current runtime paths/pages.
- **Configured/latent**: environment/dependency/migration support exists, but no active runtime wiring in the current `src/` implementation.

## Active Integrations

### 1) `next-intl` (Localization infrastructure)
- Purpose: locale routing, middleware negotiation, translated copy, locale-aware navigation.
- Evidence:
  - Plugin enabled in Next config (`next.config.ts`).
  - Middleware hooked for locale handling (`src/middleware.ts`).
  - Routing + request config (`src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`).
  - Translations consumed in components/pages (`src/components/landing/*.tsx`, `src/app/[locale]/whitepaper/page.tsx`).
  - Message catalogs (`messages/en.json`, `messages/zh.json`).

### 2) Google Fonts via `next/font/google`
- Purpose: load and apply Manrope + Noto Sans SC typography.
- Evidence:
  - Font imports and exports (`src/lib/fonts.ts`).
  - Applied in root layout body classes (`src/app/[locale]/layout.tsx`).

### 3) Google Forms (external CTA destination)
- Purpose: outbound lead/signup form links for primary CTA actions.
- Evidence:
  - Form URL constants (`src/lib/form-config.ts`).
  - CTA usage in navigation/hero/cta components (`src/components/landing/Navigation.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/CtaSection.tsx`).

### 4) Social and repository links (GitHub + X)
- Purpose: outbound social/repo navigation.
- Evidence:
  - Footer links to X and GitHub (`src/components/landing/Footer.tsx`).
  - Hero CTA links to GitHub repository (`src/components/landing/HeroSection.tsx`).

### 5) Search/SEO ecosystem integration (Google verification + crawlers)
- Purpose: search engine ownership verification and crawl/index control.
- Evidence:
  - Google site verification value wired into metadata (`src/lib/site-config.ts`, `src/app/[locale]/layout.tsx`).
  - `robots.txt` and `sitemap.xml` generation (`src/app/robots.ts`, `src/app/sitemap.ts`).
  - Source env variable definition (`src/env.mjs`, `.env.example`).

### 6) GitHub Actions (CI integration)
- Purpose: automated lint/typecheck/unit and e2e validation in GitHub-hosted runners.
- Evidence:
  - Lint/typecheck/format/test workflow (`.github/workflows/lint.yml`).
  - Playwright workflow with secret-backed env injection (`.github/workflows/playwright.yml`).

## Configured or Latent Integrations (Not actively wired in runtime app flows)

### 1) PostgreSQL/Neon + Drizzle schema lineage
- Signals:
  - `DATABASE_URL` in env schema and examples (`src/env.mjs`, `.env.example`).
  - Drizzle SQL migrations + snapshots committed (`drizzle/*.sql`, `drizzle/meta/*.json`).
  - `.env.example` references Neon (`.env.example`).
- Current status:
  - No active DB access layer or query usage detected in current `src/` pages/components.

### 2) NextAuth + GitHub OAuth
- Signals:
  - Auth-related env vars exist (`src/env.mjs`, `.env.example`).
  - Historical auth tables in SQL (`drizzle/0000_tearful_wendell_rand.sql`).
  - GitHub avatar domain allowed in image config (`next.config.ts`).
- Current status:
  - No auth route handlers/session providers/callback wiring detected in current `src/`.

### 3) Stripe (payments/billing)
- Signals:
  - Stripe env vars present (`src/env.mjs`, `.env.example`).
  - Legacy schema field `user.stripeCustomerId` in migration (`drizzle/0001_small_sabra.sql`).
  - CI secret wiring includes Stripe keys (`.github/workflows/playwright.yml`).
- Current status:
  - No active Stripe SDK usage or webhook/billing endpoints in current runtime code.

## Operational Notes for Planning
- Integration inventory is currently mixed: strong frontend/i18n/SEO integrations are active, while backend commerce/auth/data integrations appear intentionally dormant from a prior starter template baseline.
- Any phase that introduces auth, billing, or persistence should begin by reconciling dormant env/migration artifacts with the desired production architecture instead of assuming they are already operational.
