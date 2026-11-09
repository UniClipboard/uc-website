# Automatic production deployment

## Release contract

A push to `main`, including a merged pull request, deploys each affected application after its workflow succeeds.
The website and try workflows build, verify HTTP behavior, and exercise the deployment program with disposable Docker projects.
A deployment job starts only after all build-job steps succeed.
Feature branches build and verify images but cannot deploy production.
Documentation-only changes do not trigger application releases.

The production environments are `production-website` and `production-try`.
Each environment allows only the `main` branch.
Neither environment requires a reviewer or wait timer.
Each environment has a separate forced-command SSH key.
The public build-snapshot key remains a separate read-only credential.
Actions does not receive production SQLite data, Clerk secrets, R2 credentials, or a 1Panel API token.

## Server deployment program

The program is `/opt/uc-deploy/deploy.py`.
Its server-owned configuration is `/opt/uc-deploy/config.json`.
The configuration maps the two applications to their existing directories, loopback ports, public URLs, and OpenResty asset directories.
Keep this configuration at mode 0600.
Keep the deployment program and SSH entry script writable only by root.

The SSH entry script permits only the `deploy` command.
The key binds the caller to one application.
The JSON request has a 16 KiB limit and a fixed schema.
Every image must use the approved GHCR repository and an immutable SHA-256 manifest reference.
Every image revision label must match the requested source commit.

The program locks each application before deployment.
The program compares workflow run numbers and retry attempts to reject stale releases.
An identical release can be retried.
A newer workflow cannot be overwritten by an older workflow that finishes later.

Deployment records are under each application's `releases/` directory:

| File | Purpose |
| --- | --- |
| `approved.json` | Latest validated workflow request; source for a manual retry. |
| `current.json` | Last successful deployment request. |
| `last-result.json` | Latest deployment result, including a failed attempt. |
| `<run>-<time>/receipt.json` | Source, images, outcome, maintenance state, and timestamps. |
| `<run>-<time>/deployment.log` | Restricted server-side command output. |
| `<run>-<time>/previous.env` | Previous immutable image references. |
| `<run>-<time>/before.sqlite` | Website snapshot before the offline migration. |

Keep the release directory at mode 0700.
Do not upload the directory or its database files as public workflow artifacts.
Actions uploads only the deployment request and result JSON.

## Website upgrade sequence

1. Pull and verify the website, scheduler, and maintenance images.
2. Retain the old and new hashed static assets for OpenResty fallback.
3. Rehearse the SQLite migration on an online backup in an isolated directory.
4. Record the current read-only flag and scheduler activation state.
5. Stop the website and scheduler.
6. Save a consistent local snapshot.
7. Complete the encrypted R2 backup with the existing scheduler image.
8. Apply the reviewed SQLite migrations with the matching maintenance image.
9. Start the candidate website with database writes disabled.
10. Verify readiness and public pages through both loopback and the public hostname.
11. Restore the previous write state and verify the public hostname again.
12. Restore the previous scheduler activation state.
13. Save the successful deployment receipt.

The program preserves the initial migration's read-only state.
A normal release does not reopen writes or activate previously stopped jobs.
The program does not replace runtime secrets or recreate an empty database.
The existing data directory remains the production database mount.
A single-instance upgrade has a short restart window; it is not a zero-downtime release.

## Try upgrade sequence

1. Pull and verify the candidate image.
2. Retain the old and new hashed static assets.
3. Copy versioned WASM and runtime assets from the image to the OpenResty asset directory.
4. Update the immutable image reference.
5. Recreate the try container.
6. Verify health, pages, and pinned asset digests through loopback and the public hostname.
7. Save the successful deployment receipt.

The unversioned Tailcat manifest uses `no-store`.
The versioned Tailcat assets keep immutable caching and original gzip bytes.
The browser continues to connect directly to the existing rendezvous service and relays.
An HTTP deployment check does not prove an actual browser transfer.
Browser acceptance remains user-owned.

## Failure and recovery

Before container replacement, a failed pull, label check, or migration rehearsal leaves the active application running.
If a candidate fails verification before SQLite writes reopen, the program restores the old image and complete pre-migration database state.
If writes reopen without a schema change, the program can restore the old image while retaining the current database.

Warning: do not restore an old database after new application writes.
That restore would lose committed data.

If writes reopen after a schema change, a later failure keeps the candidate in read-only mode and reports `FAILED_REQUIRES_FORWARD_FIX`.
An operator must review the data and deploy a compatible correction.
The program does not attempt an automatic destructive schema downgrade.
A failed rollback reports `FAILED_ROLLBACK` and retains the recovery files and logs.

## 1Panel manual entry

The existing projects remain local Compose projects.
1Panel can display their containers, logs, resource usage, and image identities.
Use a Shell task to call the same deployment program for a manual retry.
A verified `approved.json` must exist before that retry.

For the website task:

```sh
python3 /opt/uc-deploy/deploy.py --app website
```

For the try task:

```sh
python3 /opt/uc-deploy/deploy.py --app try
```

Run these tasks on demand through 1Panel's execution control.
Do not schedule periodic updates from a mutable `latest` tag.
Inspect the task's JSON result and the server receipt before declaring success.
The panel task and Actions share the same application lock and upgrade steps.
Creating these optional panel task records is separate from the main-branch automatic deployment.

## Operator bootstrap

1. Install the reviewed `deploy/automation` program and configuration under `/opt/uc-deploy`.
2. Add one restricted authorized key per application with a forced SSH entry command.
3. Pin the server host key in each GitHub production environment.
4. Store `DEPLOY_SSH_KEY`, `DEPLOY_TARGET`, `DEPLOY_PORT`, and `DEPLOY_KNOWN_HOSTS` in each environment.
5. Restrict each environment's deployment branch policy to `main`.
6. Verify that arbitrary shell commands and cross-application requests fail.
7. Run the disposable deployment E2E on the target Docker platform.
8. Merge the reviewed workflow changes into `main`.
9. Confirm that both first production jobs succeed and match the live image revisions.

Application releases do not rewrite the trusted deployment helper, Compose definitions, proxy configuration, TLS setup, or runtime secrets.
Install reviewed infrastructure changes separately when those files change.
Do not move the existing data or secret directories when importing a Compose project into a panel.

## Validation boundaries

The deployment E2E uses disposable Compose projects and an isolated SQLite fixture.
It verifies upgrade, real HTTP behavior, failed-public-check rollback, data preservation, rejected requests, and concurrent ordering.
No unit tests or browser automation apply to this deployment program.
Record the exact CI runs and target-host rehearsal in the acceptance receipt.
A passing feature-branch build does not prove that a `main` production job has run.
