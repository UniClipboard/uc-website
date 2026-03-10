# Phase 1 Research: Release Feed Reliability Foundation

**Date:** 2026-03-10
**Phase:** P1
**Requirements:** SAFE-01, SAFE-02, SAFE-03, SAFE-04

## Objective

Establish a safe, deterministic release-feed ingestion path so landing page download UI only consumes validated, approved, and freshness-bounded data.

## Current Codebase Signals

- Landing page is server-rendered composition in `src/app/[locale]/page.tsx`.
- Localized copy uses `next-intl` JSON bundles in `messages/en.json` and `messages/zh.json`.
- No existing release feed ingestion module, runtime schema validation, or host allowlist enforcement found yet.
- Existing CTA and hero sections already include external-link patterns suitable for release fallback links.

## Recommended Architecture for P1

### 1) Release feed domain module

Create a dedicated domain module (e.g. `src/lib/release-feed/`) with:
- Types + runtime schema validation for the expected `stable.json` shape (SAFE-01).
- Fetch function that uses explicit Next.js cache/revalidation semantics and timeout/abort controls (SAFE-04).
- Host allowlist filtering utility for download URLs (SAFE-03).
- Normalization function that returns a UI-safe view model plus degraded-state metadata (SAFE-02).

### 2) Degraded-state contract

Return a stable contract regardless of failure mode:
- `status: "ok" | "degraded"`
- `downloads: ApprovedDownload[]`
- `fallbackReleaseUrl: string` (GitHub releases)
- `messages`: keys for locale rendering (not hardcoded strings)
- optional diagnostics for server logs only (not user-facing)

### 3) Host safety policy

Allowlist should default to:
- `release.uniclipboard.app`
- `github.com`
- `objects.githubusercontent.com` (if assets resolve there)

Policy: drop disallowed links rather than failing entire page. If all links dropped, keep page stable and expose degraded fallback action.

### 4) UX + i18n resilience

Add message keys for:
- degraded-state notice
- unavailable metadata labels
- notes unavailable fallback
- freshness hint

These keys should be present for both `en` and `zh` and referenced by server components.

## Risks and Mitigations

- **Schema drift risk:** upstream `stable.json` changes break parsing.
  - Mitigation: strict schema + safe fallback + test fixtures for malformed payloads.
- **Stale data risk:** cache too long or unspecified.
  - Mitigation: explicit `next: { revalidate: N }` and documented value in code comments.
- **Unsafe redirect risk:** malicious or accidental unapproved hosts.
  - Mitigation: centralized allowlist enforcement before any UI model exposure.

## Testing Strategy Inputs

- Unit tests for schema validation outcomes (valid, missing fields, wrong types).
- Unit tests for host filtering and all-links-filtered behavior.
- Unit tests for normalization to degraded state on fetch/parsing errors.
- Integration-level rendering test ensures page remains stable on degraded data path.

## Validation Architecture

Nyquist-oriented validation plan for this phase:
- Fast loop command: `pnpm test -- --runInBand src/__tests__/unit/release-feed`
- Full loop command: `pnpm test`
- Sampling:
  - after each task commit: targeted release-feed tests
  - after each plan wave: full test suite
- Manual checks:
  - Confirm degraded notice and fallback action render in both locales
  - Confirm no disallowed host links appear in rendered download actions

## Plan-Shaping Guidance

Split P1 into independent but ordered work:
1. Domain + validation primitives (foundation)
2. Fetch + caching + host filtering pipeline
3. UI integration for degraded/fallback messaging and contract consumption
4. Tests and docs hardening

## Deliverables for Planning

- A release feed module with strict schema + normalization
- Deterministic cache/revalidation behavior
- Approved-host-only download exposure
- Non-crashing degraded state surfaced to users
- Test coverage mapped to SAFE-01..SAFE-04
