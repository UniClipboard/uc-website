---
phase: 01-release-feed-reliability-foundation
plan: 01
subsystem: api
tags: [release-feed, zod, validation, caching, security]
requires: []
provides:
  - Runtime-validated stable release feed parser contract
  - Explicit fetch timeout and revalidation behavior for stable feed retrieval
  - Approved-host-only download normalization with deterministic ok/degraded output
affects: [direct-download-experience, release-metadata-visibility]
tech-stack:
  added: []
  patterns: [schema-first parsing, degraded-result contract, host allowlist filtering]
key-files:
  created:
    - src/lib/release-feed/schema.ts
    - src/lib/release-feed/fetch-stable-release.ts
    - src/lib/release-feed/allowlist.ts
    - src/lib/release-feed/normalize-release.ts
  modified:
    - src/__tests__/unit/release-feed.spec.ts
key-decisions:
  - "Use a non-throwing fetch contract that always returns ok|degraded for server safety."
  - "Apply host filtering by allowlist and degrade when unsafe links are present or all links are dropped."
patterns-established:
  - "Release feed modules validate unknown JSON before exposing typed payloads."
  - "Normalization emits UI-safe defaults (`unavailable`, `notes unavailable`) for missing metadata."
requirements-completed: [SAFE-01, SAFE-03, SAFE-04]
duration: 11min
completed: 2026-03-10
---

# Phase 1 Plan 01: Build release-feed reliability core Summary

**Stable release feed pipeline now validates payload shape, fetches with explicit revalidation bounds, and normalizes host-filtered download output into a deterministic ok/degraded contract.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-10T09:45:00Z
- **Completed:** 2026-03-10T09:56:19Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added strict schema validation and a parse API with structured failure metadata for `stable.json`.
- Implemented stable feed retrieval with `next.revalidate`, timeout abort control, and non-throwing degraded failure mapping.
- Added approved-host filtering and normalization that prevents disallowed links from reaching downstream UI consumers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define stable feed schema and parser contract** - `aee569a` (feat)
2. **Task 2: Implement fetch + cache/revalidate behavior** - `a8103e7` (feat)
3. **Task 3: Add approved-host URL filtering and final normalization** - `cbbada0` (feat)

## Files Created/Modified
- `src/lib/release-feed/schema.ts` - zod schema definitions and parse contract for stable feed payloads.
- `src/lib/release-feed/fetch-stable-release.ts` - bounded fetch path with timeout, revalidate policy, and degraded failure mapping.
- `src/lib/release-feed/allowlist.ts` - approved-host URL policy and download filtering utility.
- `src/lib/release-feed/normalize-release.ts` - UI-safe model normalization with `ok | degraded` status output.
- `src/__tests__/unit/release-feed.spec.ts` - schema/cache/host safety unit coverage for this plan.

## Decisions Made
- Kept the fetch API side-effect free and non-throwing, so callers can safely render from deterministic result states.
- Used a strict host allowlist with protocol checks (`https`) before emitting any download URL.
- Marked normalization as degraded when unsafe links are filtered or no approved links remain, while preserving fallback release URL behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing release-feed unit test file used by plan verification commands**
- **Found during:** Task 1
- **Issue:** `src/__tests__/unit/release-feed.spec.ts` did not exist, so task verification commands could not run.
- **Fix:** Added targeted unit tests (`schema`, `cache`, `host`) aligned with plan verification filters.
- **Files modified:** `src/__tests__/unit/release-feed.spec.ts`
- **Verification:** `pnpm test -- src/__tests__/unit/release-feed.spec.ts -t schema|cache|host`
- **Committed in:** `aee569a`, `a8103e7`, `cbbada0`

**2. [Rule 3 - Blocking] Added explicit fetch stubbing in Jest tests**
- **Found during:** Task 2
- **Issue:** Runtime test environment lacked `global.fetch`, causing cache verification to fail before behavior assertions.
- **Fix:** Added deterministic `global.fetch` test stubbing and restoration in unit tests.
- **Files modified:** `src/__tests__/unit/release-feed.spec.ts`
- **Verification:** `pnpm test -- src/__tests__/unit/release-feed.spec.ts -t cache`
- **Committed in:** `a8103e7`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to execute planned verification in this repository; no scope creep beyond release-feed reliability goals.

## Issues Encountered
- Full-project `pnpm typecheck` reports pre-existing failures outside this plan scope (`navigation.spec.tsx`, `whitepaper/page.tsx`). Logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- P1 plan 02 can now consume `fetchStableRelease` and `normalizeStableRelease` to integrate degraded/filtered states into landing UI.
- Release-feed core constraints SAFE-01/03/04 are implemented and covered by focused unit tests.

---
*Phase: 01-release-feed-reliability-foundation*
*Completed: 2026-03-10*

## Self-Check: PASSED

```text
FOUND_FILE: src/lib/release-feed/schema.ts
FOUND_FILE: src/lib/release-feed/fetch-stable-release.ts
FOUND_FILE: src/lib/release-feed/allowlist.ts
FOUND_FILE: src/lib/release-feed/normalize-release.ts
FOUND_FILE: src/__tests__/unit/release-feed.spec.ts
FOUND_FILE: .planning/phases/01-release-feed-reliability-foundation/01-01-SUMMARY.md
FOUND_COMMIT: aee569a
FOUND_COMMIT: a8103e7
FOUND_COMMIT: cbbada0
```
