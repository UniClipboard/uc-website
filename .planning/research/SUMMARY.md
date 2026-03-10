# Project Research Summary

**Project:** UniClipboard Website
**Domain:** Multilingual Next.js marketing site with release-driven desktop download distribution
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This milestone should stay on the current production stack (Next.js App Router + React + TypeScript + next-intl + Tailwind) and add a server-side release adapter around `stable.json` as the single source of truth for downloads, version, publish date, and release-note highlights. This is the fastest low-risk path to convert the site from "early access" messaging to "official release download" messaging.

For launch, the non-negotiable outcomes are bilingual release-state copy (`en`/`zh`), visible multi-platform direct-download CTAs, freshness signals (version + date), and graceful degraded states when release data is missing or invalid. Roadmap order should follow dependency reality: contract/fetch foundation first, then UI integration, then localization and quality hardening.

Main risk is operational reliability of a remote feed in a conversion-critical section. The mitigation strategy is explicit schema validation, bounded fetch + cache policy, fallback behavior, host allowlisting, and release-health monitoring.

## Key Findings

### Recommended Stack

Use the existing repo baseline for this milestone: Next.js 15.5.x App Router, React 19.2.x, TypeScript strict mode, next-intl 4.x, and Tailwind 4.x. Add `zod` for runtime feed validation and optional markdown rendering only for constrained changelog previews. Avoid framework migrations or i18n replatforming in this cycle.

**Core technologies:**
- Next.js App Router: route orchestration, server data fetching, revalidation caching; best fit for current codebase and delivery speed.
- TypeScript + Zod: typed domain model + runtime validation at feed boundary; prevents broken CTAs from schema drift.
- next-intl: locale routing and copy management for `en`/`zh`; preserves current localization architecture.

### Expected Features

**Must have (table stakes):**
- Release-state hero/CTA copy upgrade from beta language to official download language in `en` and `zh`.
- Multi-platform direct downloads (Linux, Windows, macOS) rendered from `stable.json`.
- Version and publish date visibility near download actions.
- Artifact-missing fallback state (clear status, no dead primary actions).

**Should have (competitive):**
- "Recommended for your OS" emphasis while still showing all platforms.
- Changelog highlights adjacent to download CTAs for upgrade confidence.

**Defer (v2+):**
- Checksums/signature verification UX enhancements.
- Historical version selector or stable/beta channel chooser in primary flow.

### Architecture Approach

Build a server-side release BFF adapter under `src/lib/releases/*` (`fetch-release`, `normalize-release`, `get-download-model`) and keep UI sections presentational. Fetch once at `src/app/[locale]/page.tsx`, normalize into typed view models, then inject into `DownloadSection` and aligned `CtaSection` copy. Use revalidation-based caching with explicit timeout/fallback semantics.

**Major components:**
1. Release integration layer (`src/lib/releases/*`): fetch, validate, normalize, map to UI model.
2. Route composition (`src/app/[locale]/page.tsx`): single orchestration point and single fetch path.
3. Landing presentation (`src/components/landing/*` + `messages/*.json`): localized rendering with no remote-shape coupling.

### Critical Pitfalls

1. **Feed schema drift breaks downloads**: enforce runtime schema validation + contract tests + safe fallback model.
2. **Stale cache serves old versions**: define explicit revalidate/TTL + purge rules tied to release publish workflow.
3. **Platform mapping errors deliver wrong binaries**: maintain explicit OS/arch mapping and automated per-platform link checks.
4. **No resilient outage path**: use timeout/retry policy + last-known-good fallback + user-visible degraded state.
5. **Trust/security regressions in direct links**: apply domain allowlist, HTTPS checks, and optional integrity metadata.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Contract & Fetch Foundation
**Rationale:** all downstream UI and localization depends on stable normalized release data.
**Delivers:** typed feed models, fetch policy (timeout/revalidate), validation, and fallback primitives.
**Addresses:** manifest-driven download requirement.
**Avoids:** schema-drift and hard-fail outage pitfalls.

### Phase 2: Download UX Integration
**Rationale:** once data contract is stable, implement conversion-critical interface safely.
**Delivers:** new download section, multi-platform direct CTAs, version/date surfacing, CTA alignment.
**Uses:** existing Next.js/React/Tailwind stack with server-rendered model.
**Implements:** page composition + presentational section boundaries.

### Phase 3: Localization & Messaging Migration
**Rationale:** release-state narrative must be consistent after UI integration points are fixed.
**Delivers:** `en`/`zh` copy upgrades, locale-safe date formatting, release language consistency.
**Addresses:** copy drift and trust pitfalls.

### Phase 4: SEO, Accessibility & Failure Quality
**Rationale:** polish and resilience should follow functional integration.
**Delivers:** canonical/hreflang/sitemap validation, accessible CTA/fallback states, malformed-feed handling verification.
**Avoids:** discoverability regressions and hidden failure modes.

### Phase 5: Security Hardening for Distribution
**Rationale:** direct-download trust controls are essential before scale.
**Delivers:** host allowlist enforcement, artifact link validation gates, security header checks.
**Avoids:** malicious/incorrect download target risk.

### Phase 6: Release Operations & Monitoring
**Rationale:** release UX is operationally critical and needs observability.
**Delivers:** feed freshness metrics, per-platform link health checks, locale conversion alerts.
**Avoids:** silent degradation and reactive incident response.

### Phase Ordering Rationale

- Contract-first sequencing reduces rework and prevents UI code from binding to unstable external JSON shape.
- Integration before optimization keeps delivery focused on release-conversion outcomes.
- Reliability and trust hardening after functional rollout closes the highest-impact production risks.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5:** integrity verification depth (checksums/signatures) and feasible UX surface for this repo scope.
- **Phase 6:** monitoring stack choice and alert thresholds aligned to traffic baseline.

Phases with standard patterns (skip research-phase):
- **Phases 1-4:** established Next.js App Router + i18n + server-fetch patterns with strong internal and official-doc support.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Strong alignment with existing production repo and official framework guidance |
| Features | HIGH | Scope directly mapped to active requirements and launch conversion objective |
| Architecture | HIGH | Clear dependency chain and low-risk boundaries within current structure |
| Pitfalls | HIGH | Common, well-understood failure modes for feed-driven download flows |

**Overall confidence:** HIGH

### Gaps to Address

- Feed contract versioning policy is not yet formalized; define compatibility guarantees during phase planning.
- Last-known-good storage strategy (in-memory vs persisted snapshot) needs implementation-time choice based on hosting/runtime constraints.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack direction, compatibility, fetch/revalidate guidance.
- `.planning/research/FEATURES.md` — table-stakes vs differentiator release-download feature priorities.
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow, and suggested build order.
- `.planning/research/PITFALLS.md` — critical failure modes and mitigation patterns.
- `.planning/PROJECT.md` — milestone scope, constraints, and active requirements.

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
