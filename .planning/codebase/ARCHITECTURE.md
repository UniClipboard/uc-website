# Architecture

## System Summary
- The repository is a Next.js App Router web app with locale-prefixed routes and mostly server-rendered landing pages.
- Primary runtime entry points are `src/middleware.ts` and `src/app/[locale]/layout.tsx`.
- UI is built from composable sections in `src/components/landing/` and shared primitives in `src/components/ui/`.
- Internationalization is centralized in `src/i18n/` and locale message bundles in `messages/`.

## Architectural Style
- Pattern: component-oriented monolith (single Next.js deployment).
- Rendering mix:
  - Server Components by default for page sections (for translated content and SSR output).
  - Client Components only where browser APIs/state are required (theme toggle, scroll-driven nav behavior).
- Config-first boundaries:
  - Environment validation and runtime config in `src/env.mjs`.
  - Site metadata and canonical URL config in `src/lib/site-config.ts`.
  - Locale routing contract in `src/i18n/routing.ts`.

## Request and Routing Flow
1. Incoming request is filtered through locale middleware in `src/middleware.ts`.
2. Locale policy (supported locales + default) is read from `src/i18n/routing.ts`.
3. Request-level i18n config resolves message file from `messages/en.json` or `messages/zh.json` via `src/i18n/request.ts`.
4. Route is handled by App Router entrypoints in `src/app/[locale]/`.
5. Root layout `src/app/[locale]/layout.tsx` validates locale and wraps UI with:
   - `NextIntlClientProvider`
   - `ThemeProvider` from `src/components/theme-provider.tsx`
6. Page tree renders `src/app/[locale]/page.tsx` (landing) or `src/app/[locale]/whitepaper/page.tsx`.

## Layering and Dependency Direction
- App/route layer:
  - `src/app/[locale]/layout.tsx`
  - `src/app/[locale]/page.tsx`
  - `src/app/[locale]/whitepaper/page.tsx`
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
- Presentation layer:
  - `src/components/landing/*.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/icons.tsx`
  - `src/components/theme-switcher.tsx`
- Domain/config utilities:
  - `src/lib/form-config.ts`
  - `src/lib/site-config.ts`
  - `src/lib/fonts.ts`
  - `src/lib/utils.ts`
- Platform/infrastructure:
  - `src/env.mjs`
  - `src/i18n/*.ts`
  - `src/middleware.ts`

Dependency direction is inward from route/components to `src/lib/` and `src/i18n/`; there is no separate backend service layer in this repository.

## Server vs Client Boundaries
- Explicit client components (`"use client"`):
  - `src/components/landing/Navigation.tsx`
  - `src/components/theme-provider.tsx`
  - `src/components/theme-switcher.tsx`
- Server components/functions:
  - Landing sections using `getTranslations` in `src/components/landing/*.tsx` (except `Navigation.tsx`)
  - Locale layout/page files in `src/app/[locale]/`
  - Metadata generators in `src/app/sitemap.ts` and `src/app/robots.ts`
- Mixed concern caution:
  - `src/components/lang-switcher.tsx` uses `useLocale` but has no `"use client"` marker and is currently not referenced by routes.

## Data and Content Flow
- Translation content:
  - Defined in `messages/*.json`.
  - Loaded per request in `src/i18n/request.ts`.
  - Consumed through `getTranslations` (server) and `useTranslations`/`useLocale` (client).
- Marketing CTA destinations:
  - Resolved by locale via `getFormUrl` in `src/lib/form-config.ts`.
- Whitepaper content:
  - Markdown source in `content/whitepaper.md`.
  - Loaded on server with `fs.readFile` in `src/app/[locale]/whitepaper/page.tsx`.
  - Rendered via `react-markdown` + `remark-gfm`.
- SEO metadata:
  - Global metadata from `src/app/[locale]/layout.tsx` + `src/lib/site-config.ts`.
  - Dynamic sitemap/robots in `src/app/sitemap.ts` and `src/app/robots.ts`.

## Styling and Theming Architecture
- Global design tokens and Tailwind v4 theme variables are in `src/styles/globals.css`.
- Utility composition uses `cn` helper from `src/lib/utils.ts` (`clsx` + `tailwind-merge`).
- Component variants are modeled with `cva` in `src/components/ui/button.tsx`.
- Theme state provider uses `next-themes` via `src/components/theme-provider.tsx`.
- Font variables are produced in `src/lib/fonts.ts` and injected at layout root.

## Testing Architecture
- Unit tests (Jest + RTL) under `src/__tests__/unit/`.
- End-to-end tests (Playwright) under `src/__tests__/e2e/`.
- Jest config in `jest.config.js` excludes e2e folder and `.worktrees/`.
- Playwright config in `playwright.config.ts` starts dev server and runs browser matrix.

## External Boundary Points
- Runtime config surface via env vars in `src/env.mjs`.
- External links/targets currently include:
  - Google Form URLs in `src/lib/form-config.ts`
  - GitHub org link in `src/components/landing/HeroSection.tsx`
- i18n plugin integration at build level in `next.config.ts`.

## Planning Implications
- Fastest safe extension path is adding/adjusting landing sections in `src/components/landing/` and wiring in `src/app/[locale]/page.tsx`.
- Locale expansion requires coordinated updates in:
  - `src/i18n/routing.ts`
  - `messages/<locale>.json`
  - locale-aware URL helpers (for example `switchLocalePathname` in `src/components/landing/Navigation.tsx`)
- If backend features are introduced, a missing domain/service layer should be added rather than embedding logic in route components.
