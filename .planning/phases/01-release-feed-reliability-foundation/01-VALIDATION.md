---
phase: 1
slug: release-feed-reliability-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 30.x |
| **Config file** | `jest.config.ts` (existing project config) |
| **Quick run command** | `pnpm test -- src/__tests__/unit/release-feed.spec.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- src/__tests__/unit/release-feed.spec.ts`
- **After every plan wave:** Run `pnpm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SAFE-01 | unit | `pnpm test -- src/__tests__/unit/release-feed.spec.ts -t schema` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SAFE-04 | unit | `pnpm test -- src/__tests__/unit/release-feed.spec.ts -t cache` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | SAFE-03 | unit | `pnpm test -- src/__tests__/unit/release-feed.spec.ts -t host` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | SAFE-02 | integration | `pnpm test -- src/__tests__/integration/landing-release-state.spec.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/unit/release-feed.spec.ts` — stubs for SAFE-01, SAFE-03, SAFE-04
- [ ] `src/__tests__/integration/landing-release-state.spec.tsx` — degraded-state render checks for SAFE-02
- [ ] Shared release feed fixtures under `src/__tests__/fixtures/release-feed/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Degraded notice copy quality in `en` and `zh` | SAFE-02 | Tone/clarity is UX-semantic | Run app, force feed failure, review download section copy in both locales |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
