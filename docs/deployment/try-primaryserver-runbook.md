# Transfer site on primaryserver


Routine releases use [the automatic deployment workflow](automatic-deployment.md) after its merge into `main`.
Use the shared deployment program for manual retries from 1Panel.
The low-level Docker commands below remain available for operator recovery.

## Scope and state

The transfer site routes to primaryserver as of 2026-11-09T07:07:38Z.
Automatic HTTP verification passes. User browser transfer acceptance remains pending.
Use [the cutover receipt](receipts/2026-11-09-try-cutover.json) for source, image, and routing evidence.
The independent application is `apps/try`.
The canonical origin remains `https://try.uniclipboard.app`.
The marketing website keeps its separate deployment and maintenance state.

The browser loads pages and pinned WASM assets from this application.
The browser connects directly to the existing rendezvous service and Tailcat relays.
The application has no database, authentication service, or server-side file storage.

## Build and release

The `Try container` workflow builds an independent linux/amd64 image.
Its build context includes only the application and its reviewed shared inputs.
The application uses its own `bun.lock` and the existing source preparation script.
Keep the deployed send/receive routes and paste fix from source `f2a17b8e5c26beeeca273bcb839851649bb5f66c`.

The two build-time public values are:

```dotenv
NEXT_PUBLIC_TRY_SHORT_CODE=1
NEXT_PUBLIC_TRY_RENDEZVOUS_URL=https://rendezvous.uniclipboard.app
```

The workflow records the source commit, registry manifest reference, and HTTP acceptance receipt.
The HTTP suite verifies all 60 locale/mode routes, referenced assets, redirects, pinned WASM, and gzip semantics.
A successful HTTP suite does not prove a real browser transfer.

After a successful build:

1. Download the `try-container-acceptance` artifact.
2. Pull its immutable image reference on primaryserver.
3. Save the previous `/opt/uc-try/.env` as the rollback manifest.
4. Set `TRY_IMAGE` to the new image reference in `/opt/uc-try/.env`.
5. Run `docker compose up -d --force-recreate` from `/opt/uc-try`.
6. Verify the image revision and health.
7. Run the HTTP suite against the origin and canonical host.
8. Verify actual text, file, short-code, link, and QR transfers in a browser.

No database migration or R2 backup job applies to this application.
Keep only the deployment manifests, public assets, certificate configuration, and immutable release identities for recovery.

## Server paths

| Path | Purpose |
| --- | --- |
| `/opt/uc-try/compose.yml` | Independent Compose project. |
| `/opt/uc-try/.env` | Immutable `TRY_IMAGE` reference. |
| `/opt/1panel/www/conf.d/uc-try.conf` | Dedicated OpenResty virtual host. |
| `/opt/1panel/www/sites/try.uniclipboard.app/assets/tailcat/` | Pinned WASM bytes. |
| `/opt/1panel/www/sites/try.uniclipboard.app/legacy-assets/` | Preserved old hashed assets. |
| `/opt/1panel/www/sites/try.uniclipboard.app/acme/` | HTTP-01 renewal webroot. |
| `/opt/1panel/www/sites/try.uniclipboard.app/ssl/` | Public certificate and restricted private key. |
| `/etc/letsencrypt/live/try.uniclipboard.app/` | Certbot certificate lineage. |
| `/etc/letsencrypt/renewal-hooks/deploy/uc-try.sh` | Certificate copy and OpenResty validation/reload hook. |

The application listens only on `127.0.0.1:3321`.
OpenResty serves public HTTPS on port 443.
Keep private keys at mode 0600.

## DNS and TLS

Keep the try record DNS-only.
The initial certificate uses DNS-01 before the origin switch.
Remove only the temporary TXT record created for that challenge.
Certbot now uses the webroot authenticator for automated HTTP-01 renewal.
Run a staging renewal before declaring automatic renewal ready.
The deploy hook copies renewed files into the existing OpenResty mount and tests configuration before reload.
Do not stop OpenResty to renew the certificate.
Do not use the marketing site's Cloudflare Origin CA certificate for this DNS-only hostname.

## Privacy and caching

Keep `Referrer-Policy: no-referrer`.
Keep locale detection and locale cookies disabled.
Keep connection secrets in URL fragments and remove them before hydration.
Do not inject analytics, retain connection URLs, or capture live QR codes in artifacts.
Do not add a proxy for rendezvous or relay traffic.
The canonical origin is unchanged, so production CORS must continue to allow the same try origin.
Verify that preflight directly against the production rendezvous service.

Serve `main.<build>.wasm.gz` as original gzip bytes without `Content-Encoding: gzip`.
The browser application decompresses gzip bytes itself.
Keep the WASM and runtime filenames and hashes aligned with `public/tailcat/manifest.json`.
Keep one-year immutable caching for versioned assets and existing ISR for pages.
Preserve any available old hashed assets for seven days and through browser acceptance.
The old Vercel origin returned HTTP 402 `DEPLOYMENT_DISABLED` before this cutover.
The deployment file API also returned 404, so the initial migration could not capture its old hashed assets.
Do not claim compatibility for resources that were unavailable from the old origin.

## Verification and rollback

```sh
cd /opt/uc-try
docker compose ps
docker inspect uc-try-try-1 --format '{{.Config.Image}} {{index .Config.Labels "org.opencontainers.image.revision"}}'
curl --fail http://127.0.0.1:3321/api/health/live
certbot renew --cert-name try.uniclipboard.app --dry-run --run-deploy-hooks --no-random-sleep-on-renew
systemctl list-timers certbot.timer
```

From a checkout with Node.js, run the public HTTP suite:

```sh
TRY_E2E_URL=https://try.uniclipboard.app node apps/try/e2e/http.mjs
```

The suite emits `.migration/try/http.json` without connection secrets.
Browser acceptance remains user-owned.
Use synthetic text and files and compare file SHA-256 digests.
Keep traces, videos, and live connection screenshots disabled.

Warning: verify the old Vercel deployment before restoring its DNS route.
A stored deployment record does not prove that Vercel can serve it.

For an application-only rollback, restore the previous immutable image reference and recreate the try service.
For a platform rollback, resume the old Vercel project and verify its direct deployment first.
Then restore the old DNS-only CNAME from the cutover receipt.
Do not change apex, www, rendezvous, or relay records.
Do not delete the old Vercel project during the seven-day recovery window.
