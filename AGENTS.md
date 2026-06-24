# Agent Instructions

UniClipboard marketing site — Next.js App Router, `bun`, Drizzle/Postgres, next-intl, Clerk (admin).

## Commands
| Task | Command |
|------|---------|
| Typecheck | `bun run typecheck` |
| Lint | `bun run lint` |
| Build / inspect route table | `bun run build` |

## Rendering & Performance (must follow)

Public pages run on the Vercel Hobby plan; every per-request DB read or SSR on a
public page burns Active CPU. Keep public pages static and cached. Prior art: `git log --grep=perf`.

- Public `[locale]` pages MUST stay static — never `export const dynamic = "force-dynamic"`, and never read `headers()`, `cookies()`, or `searchParams`. Any one opts the whole subtree into per-request SSR.
- Locale is primed once in `src/app/[locale]/layout.tsx` (`generateStaticParams` + `setRequestLocale`). Do not call `setRequestLocale` per page or resolve locale from headers.
- Public pages MUST set explicit ISR: `export const revalidate = N` (home `3600`; content/hub/list pages `1800`).
- DB-backed public data MUST be read through `unstable_cache` with a cache tag (e.g. `SPONSORS_PUBLIC_CACHE_TAG`, `articleCacheTag`). Never query the DB directly in a public render path.
- Every admin mutation route that changes cached public data MUST call `revalidateTag(...)` for that tag — see `src/app/api/admin/**`.
- Cache expensive transforms (markdown / Shiki render) via `unstable_cache` keyed on content identity + the same tag.
- `opengraph-image.tsx` routes MUST `export ... generateStaticParams` so images are prebuilt, not rendered per request.
- Admin / authed pages use `export const dynamic = "force-dynamic"` — direct `export const`, never a re-export (Next.js silently ignores the re-export form).

## LCP / Assets
- Do not wrap first-fold / LCP content in `AnimateIn` — it hides the LCP element until hydration. Keep above-the-fold content SSR-visible.
- Use `next/image` with `priority` for LCP images.
- Do not ship unused bytes (no CJK font subsets on Latin pages); register heavy deps in `experimental.optimizePackageImports`.

## Middleware (`src/middleware.ts`)
- Public 2xx responses: strip the `NEXT_LOCALE` Set-Cookie and set `public, s-maxage=1800, stale-while-revalidate=86400` so CDNs cache them. Keep cookies on 3xx redirects and on `/admin`.
- Middleware matches only pages and `/api/admin/*`; do not extend it to other API routes.

## Verify
- After any rendering/caching change, run `bun run build` and confirm affected routes show Static (○) / SSG / ISR — not Dynamic (ƒ).
