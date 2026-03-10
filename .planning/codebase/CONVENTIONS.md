# Coding Conventions

## Tooling-Defined Standards
- TypeScript strict mode is enabled in `tsconfig.json` (`"strict": true`) with path alias `"@/*"` mapped to `./src/*`.
- ESLint uses flat config in `eslint.config.mjs` via `next/core-web-vitals`, `next/typescript`, `plugin:jsx-a11y/recommended`, and `prettier`.
- Import sorting is enforced as warnings by `simple-import-sort` in `eslint.config.mjs`.
- Prettier is configured in `prettier.config.js` with `prettier-plugin-tailwindcss` (Tailwind class sorting).
- Formatting scripts target `*.ts`, `*.tsx`, and `*.mdx` through `package.json` (`format:check`, `format:write`).

## Repository-Wide Code Style
- Module imports use absolute alias paths (for example `@/components/...`) in app and test files such as `src/app/[locale]/layout.tsx` and `src/__tests__/unit/navigation.spec.tsx`.
- Files generally use double quotes and semicolons (consistent across `src/components/landing/Navigation.tsx`, `src/lib/utils.ts`, `src/components/theme-switcher.tsx`).
- Export style is mixed by purpose:
  - Named exports for reusable utilities/components (`src/lib/utils.ts`, `src/components/theme-switcher.tsx`).
  - Default exports for route-level modules (`src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`).
- Components commonly define local typed props aliases (`ThemeSwitcherProps` in `src/components/theme-switcher.tsx`) and typed helper functions (`switchLocalePathname` in `src/components/landing/Navigation.tsx`).

## React and Next.js Patterns
- App Router conventions are followed under `src/app/` with locale-segmented routes in `src/app/[locale]/...`.
- Client components are explicitly marked with `"use client"` when using hooks/browser APIs (`src/components/landing/Navigation.tsx`, `src/components/theme-switcher.tsx`).
- Async route components/layouts destructure typed `params: Promise<{ locale: string }>` and `await` params (`src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`).
- Metadata generation is centralized per locale layout via `generateMetadata` in `src/app/[locale]/layout.tsx`.

## Styling Conventions
- Tailwind CSS v4 is imported in `src/styles/globals.css` with custom design tokens defined through CSS variables and `@theme inline`.
- Utility composition favors semantic helper classes and custom utilities (`@utility glass-panel`, `@utility rounded-card` in `src/styles/globals.css`).
- Class name merging uses `cn()` helper (`src/lib/utils.ts`) built on `clsx` + `tailwind-merge`.
- Theme support is class-based (`.dark`) and wired via `next-themes` (`src/components/theme-provider.tsx`, `src/components/theme-switcher.tsx`, `src/components/landing/Navigation.tsx`).

## Accessibility and UX Conventions
- Interactive controls include explicit labels (`aria-label="Toggle theme"` in `src/components/theme-switcher.tsx`; language/theme buttons in `src/components/landing/Navigation.tsx`).
- Motion usage adds testable state hooks through `data-*` attributes (`data-nav-variant`, `data-nav-shape` in `src/components/landing/Navigation.tsx`).
- External links consistently include `target="_blank"` and `rel="noopener noreferrer"` (`src/components/landing/Navigation.tsx`).

## Commit and Pre-Commit Conventions
- Pre-commit runs lint-staged via `.husky/pre-commit` with staged JS/TS files auto-fixed by ESLint and formatted by Prettier (configured in `package.json`).
- Commit messages are linted through `.husky/commit-msg` and `commitlint.config.cjs` (`@commitlint/config-conventional`).

## Conventions Gaps and Implications
- `simple-import-sort` is warning-only, so import order is encouraged but not a hard CI blocker unless warnings are treated as failures.
- There is no explicit local style-guide document; practical conventions are inferred from config and current code in `src/`.
- `allowJs: true` in `tsconfig.json` permits JS files, though current `src/` is TypeScript-heavy.
