# Stack Research

**Domain:** Multilingual Next.js marketing/landing website (desktop app download distribution)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js (App Router) | 15.5.x for this milestone (target 16.x next cycle) | Rendering, routing, metadata, server data fetching | Project already runs on Next 15.5.x; fastest path for download-section delivery. Next 16 is current and should be a planned upgrade after Node/runtime validation. | HIGH |
| React | 19.2.x | UI rendering for landing + download cards | Already adopted in repo; current stable React line with modern APIs and no migration burden for this scope. | HIGH |
| TypeScript | 5.x (strict) | Type-safe release JSON parsing and UI contracts | Prevents runtime mistakes when mapping platform keys/URLs/version fields from `stable.json`. | HIGH |
| next-intl | 4.x | Locale routing + translated copy (`en`/`zh`) | Existing i18n architecture already matches App Router flow; minimal risk for adding new localized download copy. | HIGH |
| Tailwind CSS | 4.x | Styling for new download block and responsive layout | Already integrated in codebase; fastest and consistent for landing-section extension. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.x | Runtime validation for `stable.json` payload | Use in server-side fetch layer to reject malformed/missing platform URLs before rendering CTA buttons. |
| `react-markdown` + `remark-gfm` | 10.x + 4.x | Render release notes snippet from markdown safely | Use for short changelog preview in download section (trimmed to latest highlights). |
| `lucide-react` | 0.545+ | Platform and action icons | Use in platform cards and download CTA affordances (already used by landing sections). |
| `next-themes` | 0.4.x | Theme consistency | Reuse existing theme behavior for the new section so it matches current light/dark design system. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Jest + RTL | Unit/component tests | Add tests for release-data parser and download CTA rendering per locale/platform matrix. |
| Playwright | E2E validation | Add smoke tests for visible version string and platform links on `en` and `zh` routes. |
| ESLint + Prettier + Husky/lint-staged | Quality gate | Keep same hooks; no tooling change needed for this milestone. |

## Installation

```bash
# Existing stack already contains required packages.
# Only install if missing in a fresh branch:
npm install zod react-markdown remark-gfm next-intl next-themes lucide-react

# Test/quality toolchain (already present in this repo):
npm install -D jest @testing-library/react @playwright/test eslint prettier typescript
```

## Prescriptive Implementation Pattern (This Milestone)

1. Fetch `https://release.uniclipboard.app/stable.json` on the server (App Router), not in a client component.
2. Validate payload with Zod schema (`version`, `pub_date`, `notes`, `platforms.*.url` required).
3. Cache with Next `fetch` controls (`next.revalidate` TTL) so downloads stay fresh without per-request latency spikes.
4. Map release platform keys to UX labels/icons (`linux-x86_64`, `windows-x86_64`, `darwin-aarch64`, `darwin-x86_64`).
5. Localize only surrounding UI text via `next-intl`; keep release version/date/data source language-agnostic.
6. Degrade gracefully: if release API fails, show fallback copy and keep section visible with status messaging.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Server-side `fetch` in Next App Router | Client-side SWR/TanStack Query fetch | Use client fetching only if the section must live-update while user stays on page for long sessions. |
| Zod validation at boundary | Trust raw JSON shape | Only acceptable for throwaway prototypes; not for production download links. |
| Keep `next-intl` route model | Migrate to i18next/react-i18next | Use only if product requires runtime CMS-driven translation outside Next routing model. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Hardcoded download URLs in locale JSON/content files | Links drift every release and break trust/conversion | Read from `stable.json` as single source of truth |
| Pure client-side fetch for first render | Slower first paint and failure-prone for core CTA content | Server fetch + cache revalidation |
| Full markdown HTML injection (`dangerouslySetInnerHTML`) for notes | Increases XSS/security risk surface | `react-markdown` with controlled rendering |
| Major framework/tooling migration in this milestone (new i18n system, design system rewrite) | High regression risk for a focused release-goal milestone | Incremental changes inside current Next.js stack |

## Stack Patterns by Variant

**If release endpoint is stable and fast (<500ms p95):**
- Use `fetch(..., { next: { revalidate: 300 } })`
- Because this balances freshness with CDN/server efficiency.

**If release endpoint is intermittently unstable:**
- Keep last known good response in process cache or static fallback JSON snapshot
- Because download CTA reliability is more important than minute-level freshness.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.5.x` | `react@19.2.x`, `next-intl@4.x`, `tailwindcss@4.x` | Best short-term fit for current repo state. |
| `next@16.x` | Node.js `>=20.9.0` | Plan this upgrade separately; validate infra/runtime first. |
| `react-markdown@10.x` | `remark-gfm@4.x` | Current mainstream pairing for markdown+GFM rendering. |

## Sources

- https://nextjs.org/blog/next-16 — verified current Next major and Node requirement (`>=20.9.0`) for Next 16. (HIGH)
- https://nextjs.org/docs/app/api-reference/functions/fetch — verified App Router fetch caching/revalidation options. (HIGH)
- https://next-intl.dev/docs/getting-started/app-router — verified App Router integration model for `next-intl`. (HIGH)
- https://tailwindcss.com/blog/tailwindcss-v4 — verified Tailwind CSS v4 current architecture direction. (HIGH)
- https://react.dev/blog/2025/10/01/react-19-2 — verified React 19.2 release line. (HIGH)

---
*Stack research for: UniClipboard website (download section + release JSON integration)*
*Researched: 2026-03-10*
