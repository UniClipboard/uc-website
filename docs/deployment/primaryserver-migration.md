# Website migration to primaryserver and SQLite

## Status and scope

This document defines a migration plan, not a completed deployment.
The user selected the scope on 2026-11-09, Asia/Shanghai.
The reviewed source is `3cd7a923b3d36dd5f4a7b6de6c1ef4c82a3eebcb` on `main`.

Migrate only the marketing website from Vercel to primaryserver.
Replace Neon Postgres with a local SQLite database.
Retain Next.js, Drizzle, Clerk, public URLs, and application contracts.
Keep `try.uniclipboard.app` on its existing Vercel deployment.
Keep its project settings, DNS, environment, builds, and credentials intact.
Keep the website links and redirects to that transfer site.
Do not relocate documentation, release distribution, rendezvous, or relay services.

## Target architecture

```text
Browser -> Cloudflare -> existing primaryserver OpenResty :443
                           -> www.uniclipboard.app -> website container
                           -> uniclipboard.app -> redirect to www

website container -> /data/website.sqlite on local persistent storage
website container -> Clerk, release feed, GitHub, Google Fonts
scheduler container -> active website internal HTTP API
backup job -> SQLite Online Backup API -> encrypted off-host storage

try.uniclipboard.app -> existing Vercel deployment
```

Use Docker Compose with one active website instance.
Reuse OpenResty and the current TLS configuration mechanism.
Publish the website port only on loopback.
Give internal jobs a private Compose network.
Do not add a database server, Redis, or Kubernetes.

Prior read-only checks on 2026-11-09 found Ubuntu 24.04, x86_64, Docker, Compose, and active 1Panel core and agent services.
The host already runs OpenResty and other workloads.
Recheck resources, free ports, service identities, and ingress paths before deployment.
Do not stop unrelated containers or replace their ingress configuration.

## SQLite driver and storage

Use `better-sqlite3` through `drizzle-orm/better-sqlite3` in the Node.js runtime.
Retain Bun for dependency installation and project commands.
Drizzle already exists, but the SQLite driver is not a declared dependency.
Add the driver and its type package when implementation starts.
Pin versions compatible with the current Drizzle version and selected Node.js runtime.
Do not combine the migration with an ORM major upgrade.

Keep the schema in `src/db/schema.ts` and the connection in `src/db/client.ts`.
Do not introduce a permanent Postgres/SQLite provider abstraction.
Keep the Postgres reader in an isolated, one-time conversion tool.
Remove the Postgres application dependency when conversion and acceptance no longer need it.

Use an absolute `SQLITE_PATH`, proposed as `/data/website.sqlite`.
Fail runtime startup if the database or expected schema is absent.
Do not let a mistyped path create an empty production database.
Use a separate initialization command for new databases.
Keep the connection out of middleware and client bundles.

Bind a dedicated local directory, proposed as `/opt/uc-website/data`, to `/data`.
Mount the complete directory to preserve the database, WAL file, and shared-memory file.
Do not mount only the database file or use NFS.
Restrict directory access to the runtime user and authorized maintenance jobs.
Keep the database separate from disposable Next.js caches.
Do not use `docker compose down -v` during deployment or rollback.

| Connection setting | Initial target          | Purpose                                                          |
| ------------------ | ----------------------- | ---------------------------------------------------------------- |
| `journal_mode`     | `WAL`                   | Allow reads during a write transaction.                          |
| `foreign_keys`     | `ON` on each connection | Enforce references and delete actions.                           |
| `busy_timeout`     | 5000 milliseconds       | Bound writer-lock waiting; validate this value under contention. |
| `synchronous`      | `FULL`                  | Prefer committed-write durability.                               |

Record `sqlite_version()` from the driver in the deployment receipt.
Check that version against upstream WAL fixes before production use.
SQLite permits one writer at a time.
Keep writes short and move network requests and image processing outside transactions.
Monitor lock errors, write duration, WAL growth, disk space, and backup age.

## Schema and query conversion

The current schema uses Postgres-specific types and defaults.
Changing a connection string cannot migrate the database.

| Current representation     | SQLite target                                       | Preservation requirement                                       |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| UUID and `defaultRandom()` | UUID text; new IDs from `crypto.randomUUID()`       | Import existing IDs unchanged.                                 |
| `pgEnum`                   | Text plus SQL `CHECK` constraints                   | Preserve category, status, locale, and tier values.            |
| `jsonb`                    | Text with Drizzle JSON mode and `json_valid` checks | Preserve JSON values without double encoding.                  |
| Timezone-aware timestamp   | Integer UTC epoch milliseconds with `timestamp_ms`  | Preserve the JavaScript `Date` and API ISO-string contracts.   |
| Boolean                    | Integer boolean mode plus a 0/1 check               | Preserve values and nullability.                               |
| `defaultNow()` and `now()` | Explicit millisecond defaults in application writes | Import original timestamps explicitly.                         |
| Keys and indexes           | SQLite keys, indexes, and foreign keys              | Preserve uniqueness, composite keys, cascades, and `SET NULL`. |
| Monetary checks            | Integer cents plus SQL checks                       | Preserve null values and reject negative amounts.              |

Drizzle text enum typing does not enforce values at runtime.
Retain SQL checks in addition to API validation.
Keep date-only fields such as `date_published`, `joined_at`, and sponsorship months as text.
Define millisecond normalization before comparing source and target timestamps.
Postgres can retain more precision than the current JavaScript API.
Report that normalization instead of claiming byte-identical timestamp storage.
Preserve existing case rules and unique-key behavior.

| Source                        | Known incompatibility                   | Required change                                                        |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/ios-beta-signups.ts` | `count(*)::int`                         | Use a SQLite-compatible numeric count.                                 |
| `src/lib/sponsor-invites.ts`  | Async transaction and `.for("update")`  | Use a synchronous immediate transaction with atomic consumption.       |
| `src/lib/sponsors-store.ts`   | Async sponsor-order transaction         | Execute both order updates synchronously in one transaction.           |
| `src/db/schema.ts`            | `updateUpdatedAt` uses `now()`          | Replace the expression and audit its callers.                          |
| Article mutation routes       | Related writes span multiple statements | Keep article and translation changes atomic before cache invalidation. |
| Migration and seed scripts    | Postgres imports and SQL                | Replace the application scripts with SQLite equivalents.               |

`better-sqlite3` transaction callbacks must not return promises.
Remove `async` and `await` inside those callbacks.
Use synchronous `.get()`, `.all()`, or `.run()` execution for the selected query shape.
Outer service and HTTP functions can retain async contracts.
The installed Drizzle adapter executes transactions synchronously.
Do not copy generic async SQLite examples into this driver path.

For invitation redemption, begin an immediate transaction before reading the invitation.
Check existence, expiry, and consumption inside that transaction.
Create the sponsor and consume the invitation in the same transaction.
Use a conditional consumption update and verify its affected-row count.
Roll back sponsor creation if consumption fails.
Concurrent claims must create exactly one sponsor.

Translate unique-constraint failures into the existing conflict or duplicate result.
Do not identify failures through Postgres-only error codes.
Return success and invalidate cache tags only after the transaction commits.

## Migration history and data conversion

Create a separate SQLite migration history, proposed as `drizzle/sqlite`.
Archive the Postgres history without changing its SQL.
Do not replay Postgres SQL or import its migration journal into SQLite.
Update `drizzle.config.ts`, `scripts/migrate.ts`, and the seed script for SQLite.
Run a one-shot migration command before starting the new application version.
Stop the website for schema migrations in the initial deployment design.
Take a verified backup before each schema migration.

Use one repeatable-read, read-only Postgres transaction for the complete source export.
Import explicit columns into a fresh SQLite candidate in one target transaction.
Keep foreign-key enforcement enabled and use dependency order.
Do not merge into the active database or use replace-on-conflict imports.

| Table                  | Data that must survive                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| `articles`             | IDs, category, slug, publication state, and dates.                       |
| `article_translations` | Composite keys, locales, payloads, and dates.                            |
| `api_tokens`           | Hashes, labels, revocation dates, and last-use dates.                    |
| `releases`             | Versions, notes, platform and raw payloads, and manual overrides.        |
| `founders`             | IDs, names, platform, dates, notes, and ordering.                        |
| `ios_beta_signups`     | Emails, locale, notes, user agent, invitation state, and dates.          |
| `sponsors`             | IDs, status, tier, amounts, ordering, URLs, and uploaded avatar bytes.   |
| `sponsor_invites`      | Hashes, expiry, consumption state, amount, tier, and sponsor references. |

Import articles before translations and sponsors before invitations.
Preserve hashes so current API tokens and unused invitation links remain valid.
Never print raw tokens, credentials, or private row values in the acceptance receipt.

Validate the candidate before promotion:

1. Compare per-table row counts and primary-key sets.
2. Compare canonical row digests after documented type normalization.
3. Run `PRAGMA foreign_key_check` and require no violations.
4. Run `PRAGMA integrity_check` and require `ok`.
5. Check enum values, unique keys, nullability, amounts, and JSON payloads.
6. Compare avatar byte digests and token hashes without printing private values.
7. Check publication states, invitation states, and release manual overrides.

Keep the full conversion report under restricted access.
Publish only counts, outcomes, tool versions, and non-sensitive identities in the acceptance receipt.

## Image build and static content

Build a Linux amd64 standalone image in CI with a pinned glibc Node.js runtime.
Preserve the Bun lockfile and existing Next.js font-loader patch.
Include `public`, `.next/static`, `better-sqlite3`, `sharp`, and Takumi runtime files.
Verify native modules inside the final image.
Provide a separate maintenance image target for migration and backup tools.
Standalone tracing does not include every maintenance script.

Static generation currently reads the database.
Create a sanitized SQLite build snapshot with only public data that the build needs.
Include published articles, approved sponsor fields, public avatar content, releases, and public founder fields.
Keep private tables empty.
Exclude drafts, token hashes, invitation hashes, signups, private notes, and sponsor amounts.
Record the shared source snapshot identity for the full database and build snapshot.

Supply the build snapshot through a BuildKit secret mount.
Use temporary build storage if SQLite needs sidecar files.
Remove temporary snapshot copies before the build step creates a persistent layer.
Exclude the temporary database from standalone output.
Do not put the full database, exports, or build snapshot into image layers.
Inspect the final image for database files, secrets, drafts, and private records.
Generated public HTML can contain public content from the build snapshot.

Use the final frozen export for the first cutover build snapshot.
Build the final image during the write freeze and keep the freeze through acceptance.
For later deployments, check content changes between snapshot creation and activation.
Refresh affected application caches before treating stale prebuilt content as current.

Set `APP_URL=https://www.uniclipboard.app` before the build.
Provide Clerk public configuration, analytics settings, video identifiers, and verification metadata before the build where used.
Keep `NEXT_PUBLIC_TRY_SITE_URL` consistent with existing transfer redirects.
Keep `DOCS_ORIGIN` explicit rather than depending on `VERCEL_ENV`.
Preserve browser-transfer settings if the website still serves a legacy transfer page.
`NEXT_PUBLIC_*` values do not change through runtime Compose variables after the build.

Replace application `DATABASE_URL` configuration with `SQLITE_PATH`.
Keep `CLERK_SECRET_KEY`, `ADMIN_EMAILS`, and `CRON_SECRET` in restricted runtime configuration.
Keep `GITHUB_TOKEN` only if existing requests need it.
Use a variable allowlist instead of copying the complete Vercel environment.

## Operations and backup

The Compose deployment has one website service and one scheduler service.
The scheduler calls the active website over internal HTTP.
Do not start a second application instance for scheduled writes.
The backup job uses a backup connection.
Stop the website before running the migration job.
Serialize deployments and label images with the source revision.
Keep fixed image digests, bounded logs, restart policies, and a known-good rollback target.

Retain static routes, explicit ISR, `unstable_cache`, and tag invalidation.
Do not turn public routes dynamic to avoid the build snapshot requirement.
Keep Next.js cache paths writable for the runtime user.
Do not mount an empty volume over `.next` or share it across image versions.
Measure cold-cache behavior after container replacement.

Preserve streaming and forwarded host/protocol headers in OpenResty.
Do not add an OpenResty HTML cache for the first cutover.
Inspect existing Cloudflare cache rules before changing the origin.
Separate HTML, Markdown, and RSC variants if the CDN caches page responses.
Bypass shared caching for admin, invitations, token APIs, and Cron.
Application tags do not purge an independent CDN cache.
Purge affected CDN entries at cutover or define an accepted freshness bound.

Preserve `0 3 * * *` in UTC, which is 11:00 in Asia/Shanghai.
Reject Cron requests when `CRON_SECRET` is absent or incorrect.
Treat HTTP failures and release-sync `skipped` results as job failures.
Bound job duration and prevent overlap.
Add liveness outside Clerk-protected admin paths and separate database readiness from liveness.
Remove or replace Vercel Speed Insights for the website.

Create an Online Backup API snapshot before deployments and on a daily schedule.
Do not copy only the live `.sqlite` file with a filesystem command.
Validate each backup and send an encrypted copy outside primaryserver.
Use initial recovery objectives of 24 hours for data loss and 60 minutes for restoration.
Measure a complete restore before accepting those objectives.
Keep at least seven daily recovery points and the snapshot before the latest schema migration.
Alert on failed or stale backups and disk exhaustion.

## Rehearsal and production cutover

Rehearse with a restricted snapshot or representative dataset before freezing production writes.
Prevent the rehearsal from calling production mutation endpoints or sending real notifications.
Measure export, import, build, validation, and restore durations to schedule the maintenance window.

Disable automatic production deployment for the root Vercel project before merging SQLite-only application changes.
Keep the transfer project's automatic deployment unchanged.
Prepare the old website write gate on a Postgres-compatible revision.
Retain that revision as the Vercel recovery target.
Do not deploy the SQLite runtime to the old Vercel website during the migration.

Warning: freeze every old writer before the final export.
Otherwise, the old website and its jobs can write data that SQLite never receives.
DNS changes alone do not stop direct requests to the old Vercel deployment.
Use a verified write gate on every mutation path and stop the old scheduler.
Cover API token last-use updates and writes outside explicit mutation endpoints.
Keep public reads available where the gate permits them.

1. Record the old deployment identity, website DNS, and Neon recovery point.
2. Enable the old website write gate and stop its scheduler.
3. Verify rejection through the custom domain and direct Vercel deployment URL.
4. Create the consistent final export and sanitized build snapshot.
5. Import and validate a fresh SQLite candidate.
6. Build and inspect the final image from matching source and snapshot identities.
7. With the application stopped, back up the candidate and install it in persistent storage.
8. Start one website container with external writes gated and its scheduler disabled.
9. Validate through controlled host routing and the acceptance procedure.
10. Configure OpenResty and switch only the website apex and www origin records.
11. Verify TLS, canonical redirects, content, and authentication on the canonical host.
12. Open writes only on the SQLite website after the checks pass.
13. Enable the new scheduler and verify one successful execution.
14. Monitor writes, cache behavior, availability, disk usage, and backups.

Keep the old website gated after DNS propagation.
Keep Neon unchanged as a recovery source during the rollback window.
Do not disable the transfer deployment or change its DNS records.

## Rollback and retirement

Before SQLite accepts new writes, restore website routing to Vercel if acceptance fails.
Verify Neon and the old website before reopening old writes.
Stop the new scheduler and gate the SQLite website.

After SQLite accepts new writes, prefer a compatible prior image against the current SQLite database.
Back up the current database before changing images.
Do not automatically restore an older database with an older image.
If an image cannot read the current schema, keep writes frozen until a compatible recovery path exists.

Warning: do not switch back to Neon after new SQLite writes without reconciliation.
That switch can lose data and reactivate consumed invitations or revoked tokens.
Validate reverse data conversion before promising a platform rollback after writes reopen.
Without that procedure, Vercel routing is a pre-write rollback option only.

Retain the old website and Neon for a proposed seven-day rollback window after acceptance.
Retire only the website project and its unused credentials after that window.
Audit integrations before removing Marketplace resources or shared secrets.
Keep the transfer Vercel project, its automation, and credentials that it still needs.
Update deployment instructions and root repository guidance after implementation.

## End-to-end acceptance and evidence

Write acceptance scenarios before implementation.
Use end-to-end tests for behavior verification; do not add unit tests after implementation.
The current default Playwright configuration starts a development server.
Add a production-container target rather than treating the default command as deployment proof.
Keep visual acceptance with the user unless the user authorizes browser automation.

| Scenario                | Required result                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Data conversion         | Eight tables pass counts, key sets, normalized digests, integrity, and foreign-key checks.        |
| Public routes           | Home, download, articles, changelog, sitemap, robots, and social images show expected content.    |
| Rendering               | The production route table keeps public pages Static, SSG, or ISR.                                |
| Authentication          | Clerk and the admin allowlist work; unauthorized requests remain rejected.                        |
| Content mutation        | Article and translation writes commit together; public reads reflect cache invalidation.          |
| Invitation race         | Concurrent claims create one pending sponsor; the other request reports consumption.              |
| Transaction failure     | Failed invitation or sponsor-order writes leave no partial change.                                |
| Constraints             | Duplicate email and slug behavior matches existing contracts; invalid values fail.                |
| Continuity              | Existing tokens and avatars work; revoked tokens remain revoked.                                  |
| Contention              | Concurrent API, admin, and scheduled writes finish or fail within bounds without partial commits. |
| Restart and restore     | Container replacement retains committed rows; a restored backup serves expected data.             |
| Cache variants          | HTML, Markdown, and RSC responses never mix in shared cache.                                      |
| Cron                    | Invalid credentials fail; one authorized execution succeeds; runs do not overlap.                 |
| Transfer boundary       | Website links reach the existing try origin; its deployment and DNS remain unchanged.             |
| Deployment and rollback | Existing browser sessions recover from asset changes; rollback preserves accepted data.           |

Run mutation scenarios against disposable database copies.
Do not consume real invitations, revoke real tokens, or change production articles for acceptance.
Use controlled records for required production smoke checks.

Generate a repeatable acceptance receipt with source SHA, image digest, snapshot identity, versions, and sanitized commands.
Include the route table, conversion summary, HTTP assertions, scheduler result, restore result, and user acceptance results.
Mark unexecuted checks as `NOT RUN`.
Keep private snapshots and conversion details out of that receipt.

## Implementation deliverables

- SQLite schema, connection, queries, error mapping, and transaction conversion.
- SQLite migrations and an isolated Postgres conversion tool.
- Data validation and sanitized build-snapshot commands.
- Website Dockerfile, `.dockerignore`, Compose configuration, and maintenance image target.
- Liveness, readiness, write gates, and Cron authorization.
- Image CI, serialized deployment, scheduler, backup, restore, and rollback procedures.
- Updated environment examples, deployment guidance, and an end-to-end acceptance receipt.

Implementation, exports, image builds, restore rehearsal, browser acceptance, and deployment remain `NOT RUN`.
This documentation change does not install a driver or change production services.

## References

These references define API behavior, not permission to upgrade project dependencies.
Check examples against the lockfile and installed Drizzle source during implementation.

- [Next.js 15 self-hosting](https://nextjs.org/docs/15/app/guides/self-hosting)
- [Next.js 15 standalone output](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/output)
- [Drizzle SQLite drivers](https://orm.drizzle.team/docs/sqlite/get-started-sqlite)
- [Drizzle SQLite column types](https://orm.drizzle.team/docs/sqlite/column-types)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [SQLite WAL](https://sqlite.org/wal.html)
- [SQLite transactions](https://sqlite.org/lang_transaction.html)
- [SQLite Online Backup API](https://sqlite.org/backup.html)
