# Pitfalls Research

**Domain:** Localized marketing website with remote JSON-driven desktop release downloads
**Researched:** 2026-03-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Feed Schema Drift Breaks Download CTA

**What goes wrong:**
Download buttons disappear, point to wrong URLs, or show blank version/changelog after a release feed format change.

**Why it happens:**
The site treats `stable.json` as trusted shape without schema validation, compatibility checks, or fallback defaults.

**How to avoid:**
Define and enforce a versioned feed contract (runtime schema validation + CI contract test + graceful fallback content for invalid payloads).

**Warning signs:**
- Runtime logs show undefined fields (e.g., missing platform assets/version).
- UI renders placeholders in production.
- A feed update ships without website code changes but CTA behavior changes.

**Phase to address:**
Phase 1 - Data Contract & Fetch Foundation

---

### Pitfall 2: Stale Release Data from Incorrect Caching

**What goes wrong:**
Users download outdated binaries because cached JSON lags behind the latest release.

**Why it happens:**
No explicit cache strategy between server fetch, CDN, and browser; default framework caching gets misinterpreted.

**How to avoid:**
Set intentional caching semantics (e.g., ISR/revalidate window, cache headers, purge strategy on release publish) and test freshness after each release.

**Warning signs:**
- Feed URL returns new version but page still shows old version for minutes/hours.
- Regional users see different versions simultaneously.
- Support reports “website behind release” incidents.

**Phase to address:**
Phase 2 - Remote Feed Integration

---

### Pitfall 3: Platform Mapping Errors Cause Wrong Binary Downloads

**What goes wrong:**
macOS users receive Intel build on Apple Silicon (or vice versa), Linux users get incompatible package type, or Windows link targets unsigned/wrong artifact.

**Why it happens:**
Platform labels in UI are simplified while release artifacts include finer variants (arch, packaging, signing channel).

**How to avoid:**
Create explicit platform/architecture mapping rules and display compatible options clearly; add automated link validation for each artifact in feed.

**Warning signs:**
- High bounce rate after download click for a specific OS.
- Repeated support tickets: “downloaded but cannot install.”
- Feed includes extra variants not represented by UI model.

**Phase to address:**
Phase 2 - Remote Feed Integration

---

### Pitfall 4: Locale Copy Drift Around Version and Date Metadata

**What goes wrong:**
Localized pages show inconsistent release status, malformed dates, or mistranslated changelog summaries that reduce trust.

**Why it happens:**
Release metadata is technical/fast-moving, but localization workflow is static and not coupled to feed-driven updates.

**How to avoid:**
Define translatable vs non-translatable release fields, apply locale-aware date formatting, and add release-specific localization QA checklist for `en` and `zh`.

**Warning signs:**
- Version/date format differs unexpectedly between locales.
- One locale still uses “beta/early access” language after launch.
- Changelog bullet meaning diverges between languages.

**Phase to address:**
Phase 3 - Localization & Content Migration

---

### Pitfall 5: SEO and Sitemap Mismatch for Locale Download Routes

**What goes wrong:**
Crawlers index broken locale URLs, wrong canonical targets, or duplicate pages, lowering discoverability of download content.

**Why it happens:**
Route generation and metadata logic are fragile (path joining, locale prefixes, canonical/sitemap inconsistencies), especially when new download sections are added quickly.

**How to avoid:**
Centralize URL builders, validate sitemap output in CI, and test canonical/hreflang tags per locale route.

**Warning signs:**
- Generated sitemap contains malformed URLs.
- Search Console reports duplicate or invalid alternate language pages.
- Locale switch lands on broken/non-canonical URL.

**Phase to address:**
Phase 4 - SEO, Accessibility & Fallback Quality

---

### Pitfall 6: No Resilient Fallback When Feed Is Unavailable

**What goes wrong:**
Release section fails hard (blank/error) during feed outage, DNS issue, timeout, or malformed response.

**Why it happens:**
Assumption that remote feed is always reachable; missing timeout control, retry policy, stale-cache fallback, and user-facing degraded state.

**How to avoid:**
Implement defensive fetch behavior: bounded timeout, retry/backoff, last-known-good payload cache, and explicit fallback copy with status messaging.

**Warning signs:**
- Page renders 500/edge errors tied to release endpoint availability.
- Spikes in fetch timeout logs.
- Download section intermittently disappears.

**Phase to address:**
Phase 4 - SEO, Accessibility & Fallback Quality

---

### Pitfall 7: Trust and Security Regressions in Direct Download Links

**What goes wrong:**
Users receive tampered or suspicious binaries due to link spoofing, unsigned artifacts, or untrusted domains.

**Why it happens:**
“Direct download” optimization bypasses trust controls (allowlist, signature/checksum display, integrity checks, domain pinning).

**How to avoid:**
Restrict download hosts by allowlist, surface checksum/signing evidence, validate HTTPS endpoints in CI, and treat feed URL fields as untrusted input.

**Warning signs:**
- Download URLs unexpectedly point outside release domain.
- Security scans flag mixed/tracking redirects.
- Users report OS security warnings on installer launch.

**Phase to address:**
Phase 5 - Security Hardening for Distribution

---

### Pitfall 8: “Looks Live” Releases Without Operational Observability

**What goes wrong:**
A broken release experience persists unnoticed because there is no monitoring for feed freshness, CTA click-through integrity, and artifact health.

**Why it happens:**
Marketing pages often skip production telemetry and synthetic checks considered standard in app backends.

**How to avoid:**
Add monitoring for feed age, fetch failure rate, per-platform link health, and download CTA funnel by locale; alert on SLO breaches.

**Warning signs:**
- Team learns about outages from user reports only.
- Sudden drop in one-platform download conversion without alerts.
- No dashboard showing current release version on site vs feed.

**Phase to address:**
Phase 6 - Release Operations & Monitoring

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode release version in translation files | Fast launch copy updates | Frequent stale data and manual sync errors | Only as short-lived outage fallback |
| Parse feed with loose `any` typing | Faster implementation | Runtime breakage from schema drift | Never for production release paths |
| Single “Download” URL reused for all platforms | Simple UI | Wrong binary/compatibility failures | Only for a single-platform MVP |
| Ignore locale-specific date formatting | Fewer i18n tasks | Trust loss and confusing release chronology | Never on public localized pages |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Remote release JSON feed | Assume stable field names forever | Version schema and validate payload at runtime + CI |
| CDN/cache layer | Leave default caching behavior | Configure explicit revalidation and purge on release |
| Locale router + download section | Build links via string concatenation | Use centralized route/url helpers with locale tests |
| Artifact hosting | Trust any URL returned by feed | Enforce domain allowlist and verify endpoint health |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Client-side fetch of release data only | Layout shift, delayed CTA readiness, SEO misses metadata | Fetch server-side with stable fallback render | Noticeable on slower networks/mobile |
| Rendering oversized changelog in hero area | Main thread/UI jank and lower LCP | Limit preview bullets and lazy-load full notes | When release notes exceed a few KB |
| No timeout on upstream feed fetch | Long TTFB and intermittent page stalls | Set strict timeout + fallback to last-known-good | During upstream latency spikes/outages |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering unsanitized feed fields into rich content | XSS or malicious link injection | Escape by default, sanitize any rich content paths |
| Accepting arbitrary download domains from feed | Malware distribution or phishing redirection | Host allowlist + signature/checksum verification |
| Missing security headers on marketing pages | Increased exploitability of content injection | Configure baseline headers (CSP, frame-ancestors, etc.) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mixing “early access” and “stable release” messaging | Users doubt whether download is official | Keep launch-state language consistent across all locales |
| Hiding compatibility details | Users download wrong installer and churn | Show OS/arch/package details near each button |
| No explicit degraded-state message when feed fails | Users see missing section and assume site is broken | Show fallback copy and a secondary trusted download path |

## "Looks Done But Isn't" Checklist

- [ ] **Feed integration:** Runtime schema validation exists and fails safely with fallback UI.
- [ ] **Localization:** `en` and `zh` both reflect stable-release messaging and locale-correct date formatting.
- [ ] **Download links:** Every platform link is validated for domain, status, and expected artifact naming.
- [ ] **SEO metadata:** Sitemap/canonical/hreflang are verified for locale routes with download section present.
- [ ] **Failure handling:** Feed outage path is tested (timeout, malformed JSON, upstream 5xx).
- [ ] **Observability:** Alerts exist for feed freshness and CTA conversion anomalies by platform/locale.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema drift outage | MEDIUM | Roll back to last-known-good payload, patch parser with backward compatibility, add contract tests |
| Stale cache serving old version | LOW | Purge CDN/app cache, force revalidation, verify version parity across regions |
| Wrong platform artifact links | HIGH | Disable impacted CTA, hotfix mapping rules, run full per-platform link audit before re-enable |
| Feed unavailability | MEDIUM | Switch to cached payload/static fallback section, monitor endpoint recovery, post incident note |
| Security/trust link anomaly | HIGH | Revoke suspect URLs, rotate feed data, enforce stricter allowlist and integrity gate in CI |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Feed schema drift breaks CTA | Phase 1 - Data Contract & Fetch Foundation | Contract tests fail on incompatible payload changes |
| Stale release data from caching | Phase 2 - Remote Feed Integration | Fresh release visible within defined SLO window |
| Platform mapping errors | Phase 2 - Remote Feed Integration | Automated per-platform artifact link checks pass |
| Locale copy/version/date drift | Phase 3 - Localization & Content Migration | Locale QA checklist pass for `en` and `zh` |
| SEO/sitemap mismatch | Phase 4 - SEO, Accessibility & Fallback Quality | Sitemap/canonical/hreflang tests pass in CI |
| Missing feed failure fallback | Phase 4 - SEO, Accessibility & Fallback Quality | Chaos test for timeout/invalid JSON yields graceful UI |
| Direct-download trust/security regressions | Phase 5 - Security Hardening for Distribution | Domain allowlist + integrity/security checks enforced |
| No operational observability | Phase 6 - Release Operations & Monitoring | Alerts fire for stale feed and broken link probes |

## Sources

- Internal project requirements: `.planning/PROJECT.md`
- Internal risk baseline: `.planning/codebase/CONCERNS.md`
- Template guidance: `/home/wuy6/.codex/get-shit-done/templates/research-project/PITFALLS.md`
- Domain practice synthesis from release engineering and localized marketing operations patterns

---
*Pitfalls research for: Remote-feed-powered localized release download landing pages*
*Researched: 2026-03-10*

