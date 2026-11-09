# Website operations on primaryserver

## Deployment state

The migration is in progress.
Do not treat this runbook as proof of production activation.
Use the final acceptance receipt for source, image, data, and routing identities.
The transfer site remains on Vercel.

## Files and ownership

The deployment directory is `/opt/uc-website`.

| Path                      | Owner or purpose                                               |
| ------------------------- | -------------------------------------------------------------- |
| `compose.yml`             | Compose service definitions from this repository.              |
| `.env`                    | Immutable local Docker image IDs and the loopback port.        |
| `website.env`             | Restricted website runtime configuration.                      |
| `data/website.sqlite`     | Persistent SQLite database; runtime UID/GID 1000.              |
| `secrets/cron_secret`     | Credential for the release synchronization job.                |
| `secrets/backup.env`      | Bucket-scoped R2 S3 credentials and the restic repository URL. |
| `secrets/backup_password` | Restic encryption password; keep an off-host copy.             |
| `backups/`                | Verified local snapshots and isolated restore directories.     |
| `build/public.sqlite`     | Public bootstrap snapshot before the first activation.         |
| `bin/read-build-snapshot` | Forced SSH command that exports current public data for CI.    |

Keep secret files at mode 0600.
Keep the data directory writable by UID/GID 1000.
Do not put database files or credentials in Git.
Do not delete data volumes during routine deployment.

## Inspect the deployment

Run these commands through `ssh primaryserver` from an authorized operator host:

```sh
cd /opt/uc-website
docker compose ps
docker compose logs --tail 100 website scheduler
docker inspect uc-website-website-1 --format '{{.Image}} {{index .Config.Labels "org.opencontainers.image.revision"}}'
curl --fail http://127.0.0.1:3320/api/health/live
curl --fail http://127.0.0.1:3320/api/health/ready
```

The image ID identifies the runtime image configuration.
The OCI revision label identifies the source commit.
The CI image receipt also records the registry manifest digest.
Do not substitute one identity for another.

## Build and activate a release

The `Website container` workflow builds the website and scheduler images.
The workflow reads only a sanitized public snapshot through a forced SSH command.
BuildKit receives a compressed snapshot through a secret mount.
The snapshot/configuration digest invalidates the build cache when those inputs change.
The workflow runs HTTP acceptance and publishes the image digests and configuration IDs.
The operator pulls the verified public image digests on primaryserver.
The server does not retain a registry access token.
An image pull does not activate a deployment.

After the workflow passes:

1. Download its `website-image-receipt` artifact.
2. Pull both registry manifest references and verify their source commit and image IDs on primaryserver.
3. Run a verified backup with the current scheduler image.
4. Save the current `.env` as the rollback manifest.
5. Stop the website and scheduler before any schema migration.
6. Run the reviewed SQLite migrations with the maintenance image when needed.
7. Set `.env` to the receipt's `websiteLocalImageId` and `schedulerLocalImageId`.
8. Recreate the website with `docker compose up -d --force-recreate website`.
9. Verify readiness and public HTTP behavior.
10. Start jobs with `docker compose --profile jobs up -d scheduler`.

Keep only one active website instance.
Do not run old and new versions against the same database during schema changes.
Do not assume an old image can read a newer schema.

## Database maintenance mode

Set `WEBSITE_READ_ONLY=1` in `website.env` and recreate the website to disable SQLite writes.
The database connection enforces `query_only` for every writer in that process.
The gate can make mutation endpoints return errors during maintenance.
Restore `WEBSITE_READ_ONLY=0` and recreate the website only after validation.
Do not use this gate instead of freezing the old Postgres deployment during the first cutover.

The one-time source gate uses statement triggers on the eight business tables and empty legacy `shareholders` table.
The source owner inherits `pg_write_all_data`, so revoking ordinary table privileges does not freeze writes.
The trigger rehearsal must pass before applying the gate.

```sh
bunx tsx scripts/migration/freeze-postgres.ts rehearse
bunx tsx scripts/migration/freeze-postgres.ts apply
```

The converter uses `.env.migration-production` only on the operator host.
Keep that file restricted and outside Git.
Use `release` only for an approved recovery to the old database before new SQLite writes.

## Scheduled jobs

The scheduler uses Debian cron in UTC.
The release job runs at 03:00 UTC each day.
The backup job runs at 02:00 UTC each day.
The repository integrity job runs at 04:00 UTC on Sundays.
`flock` prevents overlapping instances of each job.

Run one release synchronization through the active website:

```sh
cd /opt/uc-website
docker compose --profile jobs run --rm scheduler node deploy/jobs.mjs sync
```

The job reports HTTP errors and `skipped` results as failures.
Keep the old Vercel scheduler inactive after cutover.

## R2 backup and recovery

The dedicated private bucket is `uc-website-backups`.
Restic encrypts data before upload.
Use bucket-scoped object read/write credentials in `secrets/backup.env`:

```dotenv
AWS_ACCESS_KEY_ID=<bucket-scoped-access-key>
AWS_SECRET_ACCESS_KEY=<bucket-scoped-secret>
AWS_DEFAULT_REGION=auto
RESTIC_REPOSITORY=s3:https://10bd9b12698da3c8aa30ff9ebfa81c71.r2.cloudflarestorage.com/uc-website-backups
```

Initialize the repository once:

```sh
docker compose --profile jobs run --rm scheduler node --env-file=/run/secrets/backup_env deploy/jobs.mjs init
```

Run and validate a backup:

```sh
docker compose --profile jobs run --rm scheduler node --env-file=/run/secrets/backup_env deploy/jobs.mjs backup
docker compose --profile jobs run --rm scheduler node --env-file=/run/secrets/backup_env deploy/jobs.mjs check
```

The job creates a consistent SQLite Online Backup API snapshot before upload.
The retention policy keeps ten recent snapshots, seven daily snapshots, and four weekly snapshots.
Keep the snapshot before the latest schema migration separately.
The initial recovery objectives are 24 hours of data loss and 60 minutes to restore.
Validate those objectives with measured restore results.

Warning: restore into a new directory first.
An in-place restore can destroy the current recovery source.

```sh
docker compose --profile jobs run --rm scheduler node --env-file=/run/secrets/backup_env deploy/jobs.mjs restore /backups/restore-YYYY-MM-DD
```

The restored database is under the new directory's `backups/` subtree.

1. Verify the restored database's integrity, foreign keys, and expected data.
2. Take a current backup before replacing production data.
3. Stop the website and scheduler.
4. Move the complete current `data` directory to a dated recovery directory.
5. Create a new `data` directory for UID/GID 1000.
6. Install the verified restored database as `data/website.sqlite` with mode 0600.
7. Recreate the website so Docker mounts the new directory.
8. Verify readiness, authentication, and expected public data before reopening writes.
9. Start the scheduler after acceptance.

Keep the old directory intact until recovery acceptance.
Do not mix old WAL files with the restored database.

## TLS and routing

Install `deploy/openresty.conf` as a separate virtual host.
Keep other virtual hosts intact.
The website uses a Cloudflare Origin CA certificate for the apex and www hostnames.
The initial certificate expires on 2027-11-09.
Renew the origin certificate before expiry and test OpenResty configuration before reloading it.
Cloudflare edge certificates have a separate lifecycle.

The origin certificate path is `/opt/1panel/www/sites/www.uniclipboard.app/ssl` on the host.
OpenResty sees that path under `/www/sites/www.uniclipboard.app/ssl`.
Keep the private key at mode 0600.
Use the Cloudflare Origin CA root for direct origin TLS checks.
Ordinary browsers reach the public site through Cloudflare.

Keep the apex redirect to www.
Keep the www CNAME pointing to the apex.
Change only the website apex origin A record during the first cutover.
Do not change try, docs, cloud, relay, release, or rendezvous records.

## Rollback boundary

Before new SQLite writes, the old website and Neon can provide a platform rollback after the source gate release.
After new SQLite writes, prefer a compatible SQLite application image.
Returning to Neon then requires data reconciliation.
Do not reactivate consumed invitations or revoked tokens by restoring stale data.
Retain the old website and frozen Neon recovery source for the agreed rollback window.
