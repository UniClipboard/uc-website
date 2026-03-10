# Structure

## Repository Layout (Top-Level)
- `.agents/` - local skill definitions used by this workspace.
- `.claude/` - agent-related local metadata.
- `.decisions/` - project-level decision notes.
- `.github/` - CI/workflow and issue templates.
- `.husky/` - git hook scripts.
- `.planning/` - planning artifacts, including generated codebase maps in `.planning/codebase/`.
- `content/` - markdown content files (currently `content/whitepaper.md`).
- `docs/` - planning and architectural decision records (`docs/plans/`, `docs/decisions/`).
- `drizzle/` - SQL migrations and drizzle metadata snapshots.
- `messages/` - locale message bundles (`messages/en.json`, `messages/zh.json`, `messages/pl.json`).
- `public/` - static assets, including favicon set and social image.
- `src/` - application source code.

Primary root config files:
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `jest.config.js`
- `playwright.config.ts`
- `components.json`
- `commitlint.config.cjs`

## Source Tree (`src/`)

### `src/app/` (Next App Router)
- `src/app/[locale]/layout.tsx` - locale-aware root layout and metadata generation.
- `src/app/[locale]/page.tsx` - landing page composition entrypoint.
- `src/app/[locale]/whitepaper/page.tsx` - whitepaper route rendering markdown content.
- `src/app/sitemap.ts` - sitemap generator.
- `src/app/robots.ts` - robots.txt generator.

### `src/components/`
- `src/components/landing/` - feature sections for the marketing site:
  - `Navigation.tsx`
  - `HeroSection.tsx`
  - `FeaturesSection.tsx`
  - `HowItWorksSection.tsx`
  - `TrustSection.tsx`
  - `AudienceSection.tsx`
  - `FaqSection.tsx`
  - `CtaSection.tsx`
  - `Footer.tsx`
- `src/components/ui/` - reusable UI primitives:
  - `button.tsx`
- Shared components:
  - `src/components/theme-provider.tsx`
  - `src/components/theme-switcher.tsx`
  - `src/components/lang-switcher.tsx`
  - `src/components/icons.tsx`

### `src/i18n/`
- `src/i18n/routing.ts` - locale list and default locale.
- `src/i18n/request.ts` - per-request message loading.
- `src/i18n/navigation.ts` - locale-aware navigation helpers.

### `src/lib/`
- `src/lib/site-config.ts` - SEO/site metadata config.
- `src/lib/form-config.ts` - locale-to-form URL mapping.
- `src/lib/fonts.ts` - next/font setup.
- `src/lib/utils.ts` - utility helpers (class merging).

### `src/styles/`
- `src/styles/globals.css` - global tokens, themes, and custom utilities.

### `src/__tests__/`
- `src/__tests__/unit/navigation.spec.tsx`
- `src/__tests__/unit/theme-switcher.spec.tsx`
- `src/__tests__/e2e/home.spec.ts`

### Source Root Files
- `src/middleware.ts` - request middleware for locale routing.
- `src/env.mjs` - environment schema and runtime bindings.

## Structure by Concern

### Routing and Entry Points
- Request entry filter: `src/middleware.ts`.
- Route entry modules: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/whitepaper/page.tsx`.
- SEO entry modules: `src/app/sitemap.ts`, `src/app/robots.ts`.

### Localization
- Policy and adapters: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`.
- Message catalogs: `messages/en.json`, `messages/zh.json`, `messages/pl.json`.

### Presentation
- Page-level sections: `src/components/landing/*.tsx`.
- Design-system primitive(s): `src/components/ui/button.tsx`.
- Global styles/tokens: `src/styles/globals.css`.

### Configuration and Build
- Build/runtime framework config: `next.config.ts`, `tsconfig.json`.
- Quality tooling: `eslint.config.mjs`, `prettier.config.js`, `commitlint.config.cjs`.
- Test runners: `jest.config.js`, `playwright.config.ts`.
- UI generator aliases/settings: `components.json`.

## Naming and Organization Conventions
- Absolute import alias `@/*` points to `src/*` (configured in `tsconfig.json`).
- Route files follow Next conventions (`layout.tsx`, `page.tsx`, metadata routes).
- Components use `PascalCase` file names in `src/components/landing/`.
- Utility/config modules use `kebab-case` in `src/lib/` and `src/i18n/`.
- Tests colocated under a central test root (`src/__tests__/unit`, `src/__tests__/e2e`) instead of alongside component files.

## Notable Gaps / Drift Signals in Current Structure
- `messages/pl.json` exists, but locale policy in `src/i18n/routing.ts` currently includes only `en` and `zh`.
- `src/components/lang-switcher.tsx` references `/pl` and `/en`, while active locale routing is `en`/`zh`.
- `README.md` still describes template-era folders (`prisma`, `actions`) that are not present in current `src/`.

## Planning-Oriented Navigation Shortcuts
- Start architecture changes from `src/app/[locale]/layout.tsx` and `src/app/[locale]/page.tsx`.
- For locale behavior, inspect `src/i18n/routing.ts` first, then `src/i18n/request.ts` and `messages/*.json`.
- For visual system work, use `src/styles/globals.css` plus `src/components/ui/button.tsx`.
- For route content additions, mirror `src/app/[locale]/whitepaper/page.tsx` and add content files under `content/`.
