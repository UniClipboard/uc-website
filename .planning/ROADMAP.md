# Roadmap: UniClipboard Website (v1)

**Generated:** 2026-03-10  
**Scope:** v1 release-focused website upgrade (download conversion milestone)

## Phase Overview

| Phase | Name | Primary Outcome | Depends On |
|------|------|------------------|------------|
| P1 | Release Feed Reliability Foundation | Release data is safely fetched, validated, and bounded before UI exposure | — |
| P2 | Direct Download Experience | Users can find and trigger all desktop downloads directly with accessible, responsive UI | P1 |
| P3 | Release Metadata Visibility | Version, publish date, and changelog highlights are visible and resilient in UI | P1, P2 |
| P4 | Official Release Messaging Alignment | Site copy consistently communicates official release state in both locales | P2, P3 |

## P1: Release Feed Reliability Foundation

**Requirement ownership:** `SAFE-01`, `SAFE-02`, `SAFE-03`, `SAFE-04`

**Plan progress:** 1/2 plans complete (`01-01` complete, `01-02` pending)

**Observable success criteria:**
1. Invalid or schema-breaking `stable.json` payloads are rejected by runtime validation before download UI model generation.
2. Feed fetch failure renders a user-visible degraded state while page rendering remains stable (no page crash).
3. Download URLs from non-approved hosts are excluded from rendered actions.
4. Feed fetch path has explicit cache/revalidation behavior configured and documented in code.

## P2: Direct Download Experience

**Requirement ownership:** `DL-01`, `DL-02`, `DL-03`, `DL-04`, `DL-05`, `DL-06`, `UX-01`, `UX-02`, `UX-03`

**Observable success criteria:**
1. Landing page renders direct download actions for Linux, Windows, macOS Apple Silicon, and macOS Intel.
2. All desktop platform actions are grouped within one download section without extra navigation.
3. Platform labels distinguish OS and architecture where applicable (including both macOS variants).
4. All download actions are keyboard reachable and activatable in a logical tab sequence.
5. Download section remains usable at mobile and desktop breakpoints with meaningful accessible labels for assistive tech.

## P3: Release Metadata Visibility

**Requirement ownership:** `REL-01`, `REL-02`, `REL-03`, `REL-04`

**Observable success criteria:**
1. Stable version displayed in the download context is sourced from `stable.json`.
2. Stable publish date is displayed and localized according to active locale (`en`/`zh`).
3. Concise changelog highlights are rendered adjacent to download actions.
4. Missing or malformed release notes produce an intentional fallback message instead of broken metadata UI.

## P4: Official Release Messaging Alignment

**Requirement ownership:** `MSG-01`, `MSG-02`, `MSG-03`

**Observable success criteria:**
1. `en` hero copy communicates official release/download availability and removes early-testing phrasing.
2. `zh` hero copy communicates official release/download availability and removes early-testing phrasing.
3. Hero, CTA, and download-adjacent copy use a consistent release-state narrative across locales.

## Coverage Validation

| Check | Result |
|-------|--------|
| Total v1 requirements | 20 |
| Requirements mapped to phases | 20 |
| Unmapped requirements | 0 |
| Requirements mapped more than once | 0 |
| Coverage | 100% |

---
*Roadmap status: phase execution in progress (P1 plan 01 complete)*
