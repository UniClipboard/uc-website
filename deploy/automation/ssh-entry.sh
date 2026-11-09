#!/bin/sh
set -eu
[ "${SSH_ORIGINAL_COMMAND:-}" = deploy ] || { printf '%s\n' 'Only the deployment protocol is allowed' >&2; exit 64; }
case "${1:-}" in website|try) ;; *) exit 64 ;; esac
exec python3 /opt/uc-deploy/deploy.py --app "$1" --stdin
