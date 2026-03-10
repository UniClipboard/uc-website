# Deferred Items

## 2026-03-10 — Plan 01-01 out-of-scope verification findings

- `pnpm typecheck` fails in pre-existing files outside this plan scope:
- `src/__tests__/unit/navigation.spec.tsx:108` (`TS7006`, implicit any `key`)
- `src/app/[locale]/whitepaper/page.tsx` multiple type/import errors (`TS2307`, `TS7031`)

These files are unrelated to `src/lib/release-feed/*` and were not modified during plan `01-01`.
