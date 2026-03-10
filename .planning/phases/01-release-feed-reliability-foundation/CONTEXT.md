# Phase 1: Release Feed Reliability Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Safely fetch, validate, and bound `stable.json` release data before exposing it to UI paths. This phase covers runtime validation, failure/degraded behavior, host safety filtering, and explicit feed freshness behavior. It does not add new release capabilities beyond the P1 roadmap scope.

</domain>

<decisions>
## Implementation Decisions

### Degraded-state visibility and tone
- Degraded messaging appears in the download section context (not only globally).
- Message tone is neutral and factual.
- Fallback action should link users to GitHub Releases.
- Error-detail level should stay short and non-diagnostic in UI.

### Unsafe download source handling
- If one or more links are from unapproved hosts, hide only the unsafe links; keep approved links available.
- If blocked links are represented in UI, use simple availability language (not heavy security-warning copy).
- Provide GitHub Releases as fallback source when unsafe links are filtered out.
- Trusted source policy should align with `release.uniclipboard.app` primary and GitHub Releases fallback.

### Freshness communication
- UX expectation should be near-real-time updates within hours, not instant guarantees.
- Prefer wording like “current stable release” over absolute “latest now” claims.
- Show a subtle freshness indicator.
- Show timestamp/freshness note consistently (always visible), not only on failure.

### Partial payload strictness and fallback
- If download links are valid but metadata fields are malformed, keep downloads available and show metadata fallback text.
- For missing key metadata (version/date), show explicit “unavailable” labels rather than failing closed.
- For malformed or missing release notes, use short “notes unavailable” fallback text.
- Fallback copy must be locale-specific in both `en` and `zh`.

### Claude's Discretion
- Exact microcopy phrasing within the selected neutral tone.
- Exact visual style of freshness note and unavailable labels.
- Exact threshold expression behind “within hours” (as long as copy promise remains accurate and non-absolute).

</decisions>

<specifics>
## Specific Ideas

- Keep failures non-scary and actionable: users should always understand what they can do next.
- Prefer continuity over hard failure: valid downloads should remain accessible when possible.
- Favor trust-preserving wording (“current stable release”) over over-promising recency language.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/page.tsx`: central landing composition point where reliability-driven state can be wired into section rendering.
- `messages/en.json` and `messages/zh.json`: existing locale message stores for adding degraded/fallback/freshness copy.
- `src/components/landing/HeroSection.tsx` and `src/components/landing/CtaSection.tsx`: established external-link CTA patterns (`target="_blank"`, `rel="noopener noreferrer"`) suitable for fallback release links.
- `src/app/[locale]/layout.tsx` + `next-intl`: established locale-aware rendering model for consistent `en`/`zh` fallback messaging.

### Established Patterns
- Landing sections are componentized and mostly server-rendered with `next-intl/server` translation loading.
- Localized copy is key-driven and maintained in message JSON files.
- External actions are rendered as explicit anchor CTAs rather than client-only imperative flows.
- Current product copy still reflects beta/waitlist language, so reliability-state copy must be explicit and separated from legacy CTA phrasing.

### Integration Points
- P1 decisions should feed the upcoming download surface state model used by future phases (P2/P3).
- Runtime feed validation and host filtering should provide a stable, UI-safe output contract consumed by page sections.
- Degraded and partial-data outcomes must map cleanly to localized message keys and existing section composition flow.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-release-feed-reliability-foundation*
*Context gathered: 2026-03-10*
