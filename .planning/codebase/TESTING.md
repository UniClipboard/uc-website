# Testing Patterns

## Testing Stack
- Unit/integration tests use Jest + React Testing Library:
  - Jest config: `jest.config.js`
  - Jest setup: `jest.setup.js` (loads `@testing-library/jest-dom`)
  - Test scripts: `package.json` (`test`, `test:watch`)
- End-to-end tests use Playwright:
  - Config: `playwright.config.ts`
  - E2E script: `package.json` (`e2e`, `e2e:ui`)

## Test Organization
- Unit tests live under `src/__tests__/unit/`:
  - `src/__tests__/unit/navigation.spec.tsx`
  - `src/__tests__/unit/theme-switcher.spec.tsx`
- E2E tests live under `src/__tests__/e2e/`:
  - `src/__tests__/e2e/home.spec.ts`
- Jest excludes E2E directory via `testPathIgnorePatterns` in `jest.config.js`.

## Unit Test Conventions
- Test files use `*.spec.tsx` naming and colocate feature-focused suites by component behavior.
- Primary patterns in `src/__tests__/unit/navigation.spec.tsx`:
  - Heavy use of `jest.mock(...)` for framework dependencies (`framer-motion`, `next-intl`, `next/navigation`, `next-themes`).
  - Behavior assertions via accessible queries (`getByRole`, `getByLabelText`) and explicit `data-testid` hooks.
  - Event simulation with `fireEvent` and state-transition checks with `act`.
  - Mock reset between tests in `beforeEach`.
- Simpler smoke-style component rendering is used where appropriate (`src/__tests__/unit/theme-switcher.spec.tsx`).

## E2E Test Conventions
- Playwright runs against local dev server started by config `webServer.command: "npm run dev"` in `playwright.config.ts`.
- Default base URL is `http://127.0.0.1:3000` and trace collection is enabled on first retry.
- Browser matrix includes Chromium, Firefox, and WebKit projects in `playwright.config.ts`.
- Current E2E scope is minimal (single title check in `src/__tests__/e2e/home.spec.ts`).

## Quality Gates in Automation
- PR CI (`.github/workflows/lint.yml`) runs:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run format:check`
  - `npm run test`
- Separate Playwright workflow (`.github/workflows/playwright.yml`) runs on push to `main`, `master`, `develop` and on pull requests.
- Pre-commit only enforces lint/format on staged JS/TS files (`.husky/pre-commit`, `package.json` lint-staged config); tests are not pre-commit gated.

## Observed Coverage and Gaps
- Unit tests are strongest around navigation interaction behavior (`src/__tests__/unit/navigation.spec.tsx`).
- Component coverage is currently sparse relative to number of UI sections in `src/components/landing/`.
- E2E coverage is currently a smoke check and does not yet validate key landing page flows, locale switching, theme switching, or CTA navigation.
- No explicit coverage threshold configuration is present in `jest.config.js`.

## Practical Planning Notes
- New UI features should follow existing unit-test style:
  - Mock external framework hooks/services.
  - Assert via roles/labels first, fallback to `data-testid` for motion/state internals.
- Priority testing expansion areas:
  - Additional unit tests for section components in `src/components/landing/`.
  - E2E scenarios for locale route handling in `src/app/[locale]/...` and primary conversion actions.
