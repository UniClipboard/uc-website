# Feature Research

**Domain:** Release-focused desktop app landing page (formal launch + multi-platform download UX)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Release-state hero + CTA copy ("Download now", not "join beta") | Users need immediate clarity that product is publicly available | LOW | Depends on i18n message updates in `messages/en.json` and `messages/zh.json` |
| Multi-platform download actions (Windows/macOS/Linux visible together) | Desktop visitors expect their OS option without hunting | MEDIUM | Depends on `stable.json` schema stability and platform mapping in landing UI |
| Direct download behavior (one click to installer) | Launch pages are judged by friction to install | MEDIUM | Depends on valid direct artifact URLs from release source |
| Version + publish date visibility | Users want confidence they are getting current stable build | LOW | Depends on release metadata from `stable.json` |
| Localized download UX (`en` / `zh`) | Existing site is bilingual; inconsistent localization feels broken | MEDIUM | Depends on locale routing and translated copy for platform labels and release states |
| Download failure/fallback handling | Broken links or missing platform assets are common release risks | MEDIUM | Depends on defensive UI states (disabled button, fallback text, retry path) |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-detected "Recommended for your OS" while still showing all platforms | Reduces decision time while preserving user control | MEDIUM | Enhances core multi-platform CTA; depends on client-side OS detection with SSR-safe fallback |
| Changelog highlights beside download CTA | Adds upgrade confidence and "why now" motivation | MEDIUM | Depends on concise parsing/rendering of release notes from `stable.json` |
| Manifest-driven downloads (no manual link edits per release) | Strong operational reliability and faster release cadence | MEDIUM | Depends on robust fetch + validation path for release manifest |
| Trust micro-signals near buttons (build channel = stable, publish timestamp, architecture label) | Improves conversion for technical desktop users | LOW | Depends on complete release metadata and consistent terminology in both locales |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Gated download via email/signup form | Teams want lead capture | Adds friction and hurts install conversion on launch page | Keep direct download primary; place optional newsletter/signup as secondary |
| Auto-starting download on page load | Perceived as "faster" UX | Feels unsafe, can trigger browser/security warnings, wrong-OS downloads | One clear primary button with explicit platform label |
| Mixing stable + beta/nightly choices in main CTA | "Power users want options" | Decision overload and weakens formal release message | Keep stable as default; move pre-release channels to docs/release notes |
| Separate deep flow per platform before download | Desire for tailored explanations | Increases clicks and maintenance burden for little launch benefit | Single unified download section with optional per-platform install tips below |
| Hardcoded links in static copy/components | Quick to ship initially | Link rot and manual release toil; high risk of stale binaries | Enforce single-source manifest (`stable.json`) and render dynamically |

## Feature Dependencies

```text
[Release Manifest Ingestion]
    ├──requires──> [stable.json schema contract + validation]
    ├──enables──> [Multi-platform direct download buttons]
    ├──enables──> [Version/date/changelog rendering]
    └──enables──> [Trust signals near CTA]

[Localized Release Messaging]
    └──requires──> [en + zh translation updates]

[Recommended OS CTA]
    ├──requires──> [Multi-platform button model]
    └──requires──> [Client OS detection + safe fallback]

[Gated Download]
    └──conflicts──> [Direct download conversion objective]

[Stable/Beta mixed CTA]
    └──conflicts──> [Formal release clarity objective]
```

### Dependency Notes

- **Release Manifest Ingestion requires schema contract:** UI safety depends on stable fields for version, date, links, and release notes.
- **Download buttons depend on manifest ingestion:** Without runtime manifest data, platform links become stale and manual.
- **Localized release messaging requires translation updates:** Hero/CTA consistency must hold across `en` and `zh` routes.
- **Recommended OS CTA enhances multi-platform downloads:** It accelerates first click while keeping all platform options visible.
- **Gated download conflicts with direct-download goal:** It directly opposes this milestone's conversion objective.
- **Stable/Beta mixed CTA conflicts with formal release narrative:** It weakens "officially released" positioning.

## MVP Definition

### Launch With (v1)

Minimum viable product for this milestone (formal release messaging + multi-platform download UX).

- [ ] Release-ready messaging across Hero + CTA in `en` and `zh`
- [ ] Manifest-driven Windows/macOS/Linux direct download buttons
- [ ] Version + publish date display from `stable.json`
- [ ] Clear fallback state when platform artifact is unavailable

### Add After Validation (v1.x)

- [ ] Recommended OS highlighting with robust fallback logic
- [ ] Changelog highlight cards near download actions
- [ ] Lightweight install guidance per platform (below CTA)

### Future Consideration (v2+)

- [ ] Optional integrity verification UX (checksums/signature guidance)
- [ ] Historical version selector (if release volume/user demand justifies)
- [ ] Channel picker (stable/beta) gated to advanced docs flow

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Formal release messaging replacement | HIGH | LOW | P1 |
| Multi-platform direct downloads from manifest | HIGH | MEDIUM | P1 |
| Version + publish date surfacing | HIGH | LOW | P1 |
| Missing-artifact fallback state | HIGH | MEDIUM | P1 |
| Recommended OS CTA | MEDIUM | MEDIUM | P2 |
| Changelog highlights in landing | MEDIUM | MEDIUM | P2 |
| Integrity verification UX | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Above-the-fold multi-platform downloads | Common in mature desktop product pages | Common in OSS desktop app pages | Keep all three platforms visible with one-click direct downloads |
| Release freshness signal (version/date) | Often shown near download or changelog | Common in release-centric pages | Show concise version/date from manifest in landing CTA block |
| Release-notes context | Usually linked out | Sometimes summarized inline | Provide short highlights inline, full notes optional secondary link |
| Primary stable channel focus | Typically default for general audience | Sometimes diluted by experimental channels | Keep stable dominant and relegate non-stable options outside primary CTA |

## Sources

- `.planning/PROJECT.md` (milestone scope, constraints, release source, conversion goal)
- `.planning/codebase/ARCHITECTURE.md` (i18n model, App Router structure, integration boundaries)
- Current desktop software landing-page norms (cross-platform direct download + release transparency patterns)

---
*Feature research for: UniClipboard release-focused desktop landing page*
*Researched: 2026-03-10*
