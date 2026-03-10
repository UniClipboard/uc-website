# Requirements: UniClipboard Website

**Defined:** 2026-03-10
**Core Value:** 用户进入官网后，能快速理解产品价值并无障碍下载到适配自己系统的最新稳定版本。

## v1 Requirements

Requirements for initial release-focused milestone. Each requirement will map to roadmap phases.

### Release Messaging

- [ ] **MSG-01**: User sees official-release positioning (not early-testing language) in hero area for `en` locale.
- [ ] **MSG-02**: User sees official-release positioning (not early-testing language) in hero area for `zh` locale.
- [ ] **MSG-03**: User sees consistent release-state copy across hero, CTA, and download-related sections.

### Download Distribution

- [ ] **DL-01**: User can directly download Linux package from landing page.
- [ ] **DL-02**: User can directly download Windows package from landing page.
- [ ] **DL-03**: User can directly download macOS (Apple Silicon) package from landing page.
- [ ] **DL-04**: User can directly download macOS (Intel) package from landing page.
- [ ] **DL-05**: User can view all supported platform download actions in one section without additional navigation.
- [ ] **DL-06**: User sees platform labeling that clearly distinguishes OS and architecture where needed.

### Release Metadata

- [ ] **REL-01**: User sees current stable version number sourced from `stable.json`.
- [ ] **REL-02**: User sees publish date for the current stable release, formatted for active locale.
- [ ] **REL-03**: User sees concise changelog highlights for the current release near download actions.
- [ ] **REL-04**: Site gracefully handles missing or malformed release notes by showing a fallback message instead of broken UI.

### Reliability and Safety

- [ ] **SAFE-01**: System validates release feed shape before rendering download UI.
- [ ] **SAFE-02**: System renders a clear degraded-state message if release feed fetch fails, without crashing page rendering.
- [ ] **SAFE-03**: System only exposes download links from approved release host(s) to avoid unsafe redirect targets.
- [ ] **SAFE-04**: System applies predictable caching/revalidation for release feed so users see timely stable version updates.

### Accessibility and Discoverability

- [ ] **UX-01**: Keyboard users can reach and activate every download action in logical tab order.
- [ ] **UX-02**: Screen reader users get meaningful labels for platform-specific download actions.
- [ ] **UX-03**: Download section maintains usable layout on mobile and desktop breakpoints.

## v2 Requirements

Deferred to future release.

### Distribution Enhancements

- **DIST-01**: User can verify checksums/signatures directly in website UI before download.
- **DIST-02**: User can switch between channels (stable/beta/nightly) from website.
- **DIST-03**: User can browse and download historical versions from website.

### Operational Enhancements

- **OPS-01**: Team can monitor per-platform download link health with automated alerting.
- **OPS-02**: Team can monitor release-feed freshness and detect stale publish artifacts automatically.

## Out of Scope

Explicitly excluded for this milestone.

| Feature | Reason |
|---------|--------|
| Desktop app auto-update protocol redesign | Belongs to client app architecture, not landing site scope |
| Account/authentication features on website | Not required for release download conversion goal |
| Mobile app distribution (iOS/Android) | Current release artifacts and scope are desktop-focused |
| New backend product APIs unrelated to release feed | Adds complexity without supporting immediate conversion objective |

## Traceability

Finalized traceability from `.planning/ROADMAP.md`.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MSG-01 | P4 | Planned |
| MSG-02 | P4 | Planned |
| MSG-03 | P4 | Planned |
| DL-01 | P2 | Planned |
| DL-02 | P2 | Planned |
| DL-03 | P2 | Planned |
| DL-04 | P2 | Planned |
| DL-05 | P2 | Planned |
| DL-06 | P2 | Planned |
| REL-01 | P3 | Planned |
| REL-02 | P3 | Planned |
| REL-03 | P3 | Planned |
| REL-04 | P3 | Planned |
| SAFE-01 | P1 | Planned |
| SAFE-02 | P1 | Planned |
| SAFE-03 | P1 | Planned |
| SAFE-04 | P1 | Planned |
| UX-01 | P2 | Planned |
| UX-02 | P2 | Planned |
| UX-03 | P2 | Planned |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✅
- Duplicate mappings: 0 ✅
- Coverage: 100% ✅

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap finalization*
