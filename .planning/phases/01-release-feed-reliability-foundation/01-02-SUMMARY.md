---
phase: 01-release-feed-reliability-foundation
plan: 02
subsystem: ui
tags: [next-intl, release-feed, resiliency, jest]
requires:
  - phase: 01-release-feed-reliability-foundation
    provides: stable release-feed fetch/normalize contract with allowlist filtering
provides:
  - landing download section wired to stable release model with degraded fallback UX
  - localized reliability-state copy for en/zh download context
  - integration and unit regression coverage for SAFE-01..SAFE-04 behaviors
affects: [landing, i18n, release-feed, regression-testing]
tech-stack:
  added: []
  patterns: [non-throwing page-level fallback model, locale-key parity assertions for critical copy]
key-files:
  created: [src/components/landing/DownloadSection.tsx, src/__tests__/integration/landing-release-state.spec.tsx]
  modified: [src/app/[locale]/page.tsx, messages/en.json, messages/zh.json, src/__tests__/unit/release-feed.spec.ts]
key-decisions:
  - "Resolve feed-fetch exceptions at page boundary with a deterministic degraded view model."
  - "Use message-key parity tests across en/zh to guard localized fallback UX completeness."
patterns-established:
  - "Landing release modules consume normalized release view-model only."
  - "Reliability copy in UI is sourced from `landing.download` locale namespace."
requirements-completed: [SAFE-02, SAFE-01, SAFE-03, SAFE-04]
duration: 44min
completed: 2026-03-10
---

# Phase 1 Plan 02: Wire degraded-state UI and validate resilience Summary

**Landing page now renders a localized release-download module that degrades safely on feed failures while preserving fallback access and reliability regressions in tests.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-03-10T10:40:00Z
- **Completed:** 2026-03-10T11:24:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added `DownloadSection` to landing flow with degraded notice, fallback action, notes display, and freshness hint.
- Wired `src/app/[locale]/page.tsx` to fetch + normalize release-feed data and fall back to a non-throwing degraded model.
- Added locale-safe reliability copy in `messages/en.json` and `messages/zh.json` under `landing.download`.
- Backfilled release-feed unit/integration tests covering schema rejection, host filtering degradation, fetch failure mapping, and non-crashing degraded page path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Introduce download section contract and degraded-state rendering** - `18b7ecd` (feat)
2. **Task 2: Add locale-safe fallback and freshness copy** - `fce4329` (feat)
3. **Task 3: Backfill unit/integration tests for P1 reliability requirements** - `4021f1a` (test)

**Plan metadata:** pending final docs commit

## Files Created/Modified
- `src/components/landing/DownloadSection.tsx` - New localized download-state UI for ok/degraded release data.
- `src/app/[locale]/page.tsx` - Release-feed wiring with normalized model and exception-safe degraded fallback.
- `messages/en.json` - Added `landing.download` keys for degraded notices, metadata/notes unavailable, and freshness hint.
- `messages/zh.json` - Added parity `landing.download` key set with consistent semantics in Chinese.
- `src/__tests__/integration/landing-release-state.spec.tsx` - Non-crashing degraded rendering and locale parity coverage.
- `src/__tests__/unit/release-feed.spec.ts` - Reliability-path unit assertions for schema, host filtering, and fetch failure mapping.

## Decisions Made
- Kept all download UI logic driven by `StableReleaseViewModel` so fetch/parse variability never leaks into rendering branches.
- Tested localization safety by asserting key parity between `en` and `zh` dictionaries instead of only checking a single hardcoded string.
- Preserved existing out-of-scope typecheck failures and did not expand scope into unrelated files per phase boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan-referenced files did not exist in current tree**
- **Found during:** Task 1
- **Issue:** `DownloadSection.tsx` and `landing-release-state.spec.tsx` paths were listed in plan but absent from repository.
- **Fix:** Created both files in their planned locations and wired page imports to match current app structure.
- **Files modified:** `src/components/landing/DownloadSection.tsx`, `src/__tests__/integration/landing-release-state.spec.tsx`, `src/app/[locale]/page.tsx`
- **Verification:** `pnpm test -- src/__tests__/integration/landing-release-state.spec.tsx -t degraded`
- **Committed in:** `18b7ecd`

**2. [Rule 3 - Blocking] Integration test harness failed on path-alias mocking/lint constraints**
- **Found during:** Task 3
- **Issue:** Jest module mocking for alias paths and forbidden `require()` imports blocked commit checks.
- **Fix:** Reworked test harness to use virtual mocks for release-feed modules and direct JSON imports for locale dictionaries.
- **Files modified:** `src/__tests__/integration/landing-release-state.spec.tsx`
- **Verification:** `pnpm test -- src/__tests__/integration/landing-release-state.spec.tsx`
- **Committed in:** `4021f1a`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to execute planned tasks in current repository shape; no scope creep beyond SAFE requirements.

## Issues Encountered
- `pnpm typecheck` still fails for pre-existing out-of-scope errors (`src/__tests__/unit/navigation.spec.tsx`, `src/app/[locale]/whitepaper/page.tsx`), consistent with prior phase state.
- Local commit hooks enforced commitlint body line length; Task 3 commit message was wrapped and retried.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 reliability UI + regression coverage is complete and traceable to SAFE-01..SAFE-04.
- Remaining blocker for clean project-wide typecheck is unrelated legacy errors already tracked in deferred items/state.

---
*Phase: 01-release-feed-reliability-foundation*
*Completed: 2026-03-10*

## Self-Check: PASSED
