# Technology Stack

## Summary
- App type: marketing/landing website with localized routes and a markdown whitepaper page.
- Primary platform: Next.js App Router + React + TypeScript.
- Current codebase state: frontend-heavy; database/auth/payments are scaffolded in config/env and historical migrations, but not actively wired into runtime request handlers.

## Runtime and Framework
- Node.js + npm scripts are the operational baseline (`package.json`).
- Next.js 15 App Router is the web framework (`package.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`).
- React 19 is the UI runtime (`package.json`).
- TypeScript 5 with strict mode and path aliases (`tsconfig.json`).
- Next.js i18n plugin wrapping Next config (`next.config.ts`).

## Frontend UI and Styling
- Tailwind CSS v4 is the styling engine with PostCSS integration (`package.json`, `postcss.config.mjs`, `src/styles/globals.css`).
- Shadcn-style component setup with Radix Slot + CVA utility patterns (`components.json`, `src/components/ui/button.tsx`).
- Utility-class composition uses `clsx` + `tailwind-merge` (`src/lib/utils.ts`).
- Theme switching uses `next-themes` (`src/components/theme-provider.tsx`, `src/components/theme-switcher.tsx`, `src/components/landing/Navigation.tsx`).
- Motion/interaction effects use Framer Motion (`src/components/landing/Navigation.tsx`).
- Icons are from Lucide (`src/components/icons.tsx`, `src/components/landing/*.tsx`).

## Internationalization and Content
- Localization framework: `next-intl` with locale routing and middleware (`src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `next.config.ts`).
- Active locales in routing: `en`, `zh` (`src/i18n/routing.ts`).
- Locale message catalogs are JSON files (`messages/en.json`, `messages/zh.json`; `messages/pl.json` exists but is not in active routing).
- Long-form content uses markdown rendered server-side with `react-markdown` + `remark-gfm` (`src/app/[locale]/whitepaper/page.tsx`, `content/whitepaper.md`).

## SEO and Metadata
- Dynamic metadata, Open Graph/Twitter cards, canonical/hreflang, and Google site verification are set per locale layout (`src/app/[locale]/layout.tsx`, `src/lib/site-config.ts`).
- Programmatic `robots.txt` and `sitemap.xml` generation use Next metadata routes (`src/app/robots.ts`, `src/app/sitemap.ts`).

## Data and Backend Capabilities (Current vs. Present-in-Repo)
- Environment schema includes DB/Auth/Stripe variables via T3 Env + Zod (`src/env.mjs`, `.env.example`).
- SQL migration history indicates a PostgreSQL + Drizzle lineage (`drizzle/0000_tearful_wendell_rand.sql`, `drizzle/0001_small_sabra.sql`, `drizzle/meta/*.json`).
- No active DB client, API routes, auth handlers, or Stripe runtime flows are present in `src/` for current website behavior.

## Testing and Quality Tooling
- Unit tests: Jest + React Testing Library (`jest.config.js`, `src/__tests__/unit/*.spec.tsx`).
- E2E tests: Playwright with local web server orchestration (`playwright.config.ts`, `src/__tests__/e2e/home.spec.ts`).
- Linting/formatting: ESLint flat config + Prettier (`eslint.config.mjs`, `prettier.config.js`).
- Git hooks: Husky + lint-staged for pre-commit checks (`package.json`, `.husky/`).
- Commit message policy: commitlint conventional config (`commitlint.config.cjs`).

## CI/CD and Deployment Signals
- GitHub Actions run lint/typecheck/format/tests and Playwright suites (`.github/workflows/lint.yml`, `.github/workflows/playwright.yml`).
- Repository is deploy-oriented for Vercel (deployment docs + Next.js defaults) (`README.md`).
