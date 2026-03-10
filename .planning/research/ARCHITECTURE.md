# Architecture Research

**Domain:** Next.js i18n marketing site with dynamic release metadata and download CTAs  
**Researched:** 2026-03-10  
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Route + Composition Layer                          │
├────────────────────────────────────────────────────────────────────────────┤
│  src/app/[locale]/page.tsx                                                 │
│  └─ Composes landing sections and passes release view model                │
├────────────────────────────────────────────────────────────────────────────┤
│                        Presentation (Server Components)                     │
├────────────────────────────────────────────────────────────────────────────┤
│  src/components/landing/HeroSection.tsx                                    │
│  src/components/landing/DownloadSection.tsx   (new)                        │
│  src/components/landing/CtaSection.tsx          (updated)                  │
├────────────────────────────────────────────────────────────────────────────┤
│                        Domain + Integration Layer                           │
├────────────────────────────────────────────────────────────────────────────┤
│  src/lib/releases/fetch-release.ts        (fetch stable.json)              │
│  src/lib/releases/normalize-release.ts    (typed normalization)            │
│  src/lib/releases/get-download-model.ts   (UI model mapping + locale text) │
├────────────────────────────────────────────────────────────────────────────┤
│                           External Source Layer                             │
├────────────────────────────────────────────────────────────────────────────┤
│  https://release.uniclipboard.app/stable.json                              │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `page.tsx` composition | Route-level orchestration and section ordering | Server component calling one domain entrypoint and passing props |
| `DownloadSection` | Render platform cards + primary direct-download actions | Server component with pure props; no fetch side effects |
| `CtaSection` | Keep message consistency with “official release” state | Existing section updated to consume optional release summary text |
| `fetch-release` | Retrieve stable metadata with timeout/revalidate policy | `fetch(url, { next: { revalidate } })` + explicit error handling |
| `normalize-release` | Convert raw payload into strict internal shape | Runtime guards + typed model, drop unknown fields safely |
| `get-download-model` | Produce locale-ready UI model from normalized release | deterministic mapping from platforms/changelog/version/date |

## Recommended Project Structure

```
src/
├── app/
│   └── [locale]/
│       └── page.tsx                      # compose sections with release model
├── components/
│   └── landing/
│       ├── DownloadSection.tsx           # new download metadata + CTA block
│       └── CtaSection.tsx                # updated messaging alignment
├── lib/
│   └── releases/
│       ├── types.ts                      # raw + normalized types
│       ├── fetch-release.ts              # external fetch with cache strategy
│       ├── normalize-release.ts          # schema/guard + shaping
│       └── get-download-model.ts         # view model for sections
└── i18n/
    └── (existing request/routing stack) # unchanged, reused

messages/
├── en.json                               # download section copy + labels
└── zh.json                               # download section copy + labels
```

### Structure Rationale

- **`src/lib/releases/`:** isolates remote contract and normalization away from UI components; prevents fetch logic from leaking into landing sections.
- **`src/components/landing/`:** keeps all marketing page blocks in the existing section architecture.
- **`src/app/[locale]/page.tsx`:** remains the single composition point for page-level data and sequencing.
- **`messages/*.json`:** preserves current i18n model where UI copy is locale-bound but release facts remain source-of-truth driven.

## Architectural Patterns

### Pattern 1: Server-Side BFF Adapter for Release Metadata

**What:** Route calls an internal adapter (`get-download-model`) that fetches and normalizes release JSON before rendering sections.  
**When to use:** External API shape is unstable or not guaranteed to match UI requirements.  
**Trade-offs:** Adds mapping layer code, but sharply reduces coupling and runtime rendering errors.

**Example:**
```typescript
// src/lib/releases/get-download-model.ts
export async function getDownloadModel(locale: "en" | "zh") {
  const raw = await fetchReleaseJson();
  const release = normalizeRelease(raw);
  return mapReleaseToViewModel(release, locale);
}
```

### Pattern 2: Pure Presentational Download Block

**What:** `DownloadSection` receives complete props (version/date/platform URLs/changelog) and only renders.  
**When to use:** You need reusable/testable UI and stable behavior across locales.  
**Trade-offs:** Slightly more props wiring in `page.tsx`, but clearer boundaries and easier tests.

**Example:**
```typescript
// src/components/landing/DownloadSection.tsx
type DownloadSectionProps = { model: DownloadViewModel };
export async function DownloadSection({ model }: DownloadSectionProps) {
  return <section>{/* render cards + direct download links */}</section>;
}
```

### Pattern 3: Stale-While-Revalidate Static-Friendly Fetching

**What:** Use Next fetch revalidation to keep page mostly static while refreshing release metadata periodically.  
**When to use:** Marketing pages need high cacheability but release links must stay current.  
**Trade-offs:** Data may be up to revalidate window stale, but avoids per-request latency and source overloading.

**Example:**
```typescript
await fetch("https://release.uniclipboard.app/stable.json", {
  next: { revalidate: 300 },
});
```

## Data Flow

### Request Flow

```
Visitor opens /[locale]
    ↓
src/middleware.ts resolves locale policy
    ↓
src/app/[locale]/page.tsx (server render)
    ↓
getDownloadModel(locale)
    ↓
fetchReleaseJson() -> stable.json
    ↓
normalizeRelease() -> typed release domain model
    ↓
mapReleaseToViewModel() -> localized download/changelog view model
    ↓
DownloadSection + CtaSection render direct-download CTAs
```

### State Management

```
No client store required
    ↓
Server-side derived state only (release model per render/revalidate window)
    ↓
Optional client behavior limited to UX polish (not data ownership)
```

### Key Data Flows

1. **Release source ingestion:** `stable.json` payload is fetched, validated, and converted into normalized internal fields.
2. **Locale render mapping:** normalized release facts combine with `messages/{locale}.json` labels to produce section-ready props.
3. **CTA emission:** platform-specific direct links are rendered as primary actions in the new download block and mirrored in global CTA wording.

## Suggested Build Order

1. Create `src/lib/releases/types.ts` and define raw/normalized interfaces for current `stable.json` fields.
2. Implement `fetch-release.ts` with timeout, revalidate policy, and safe failure return strategy.
3. Implement `normalize-release.ts` and `get-download-model.ts` (single domain entrypoint for route usage).
4. Add `DownloadSection.tsx` in `src/components/landing/` as pure props-based server component.
5. Update `src/app/[locale]/page.tsx` to fetch model once and inject it into `DownloadSection` and updated `CtaSection`.
6. Update `messages/en.json` and `messages/zh.json` with release/download copy keys (labels, platform names, fallback text).
7. Add/adjust unit tests for model normalization and section rendering; add e2e assertion for download links on localized routes.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k daily visitors | Keep monolith pattern with `revalidate` caching and server render |
| 1k-100k daily visitors | Add fetch timeout/fallback + CDN cache headers; monitor source availability |
| 100k+ daily visitors | Introduce edge-cached proxy endpoint or scheduled ingestion into internal cache store |

### Scaling Priorities

1. **First bottleneck:** upstream release endpoint latency/availability. Fix with cache policy, timeout, and graceful fallback UI.
2. **Second bottleneck:** repeated normalization and render overhead. Fix with memoized server cache or periodic pre-ingestion.

## Anti-Patterns

### Anti-Pattern 1: Fetching Release JSON Inside Multiple UI Sections

**What people do:** each section independently calls `fetch(stable.json)`.  
**Why it's wrong:** duplicate network requests, inconsistent data snapshots, harder error handling.  
**Do this instead:** fetch once at route/domain layer and pass down a single view model.

### Anti-Pattern 2: Embedding Raw API Shape in JSX

**What people do:** directly access nested release payload fields in components.  
**Why it's wrong:** tight coupling to remote contract and fragile rendering on payload drift.  
**Do this instead:** normalize to internal typed model in `src/lib/releases/` before rendering.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `release.uniclipboard.app/stable.json` | Server fetch with revalidation and normalization | Single source of truth for version/link/changelog |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/app/[locale]/page.tsx` ↔ `src/lib/releases/*` | Direct function call | Route owns orchestration; lib owns data logic |
| `src/lib/releases/*` ↔ `src/components/landing/*` | Typed props model | UI remains stateless/presentational |
| `src/components/landing/*` ↔ `messages/*.json` via next-intl | Existing i18n API | Text localized, release facts not duplicated per locale |

## Sources

- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `/home/wuy6/.codex/get-shit-done/templates/research-project/ARCHITECTURE.md`

---
*Architecture research for: dynamic release metadata + download CTA blocks in Next.js i18n marketing site*  
*Researched: 2026-03-10*
