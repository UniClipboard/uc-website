#!/bin/sh
set -eu
# Certbot calls this hook only after a successful renewal.
[ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/try.uniclipboard.app ] || exit 0
site=/opt/1panel/www/sites/try.uniclipboard.app/ssl
install -m 644 "$RENEWED_LINEAGE/fullchain.pem" "$site/fullchain.pem"
install -m 600 "$RENEWED_LINEAGE/privkey.pem" "$site/privkey.pem"
docker exec 1Panel-openresty-FqZQ openresty -t
docker exec 1Panel-openresty-FqZQ openresty -s reload
