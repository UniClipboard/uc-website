#!/bin/sh
# This is the only command allowed by the CI snapshot SSH key.
set -eu
if image=$(docker inspect uc-website-website-1 --format '{{.Image}}' 2>/dev/null); then
    temp_dir=$(mktemp -d /opt/uc-website/build/public-XXXXXX)
    trap 'rm -f "$temp_dir/public.sqlite"; rmdir "$temp_dir"' EXIT
    docker run --rm --network none --user 0 \
        -v /opt/uc-website/data:/data:ro \
        -v "$temp_dir":/snapshot \
        "$image" node deploy/public-snapshot.mjs /data/website.sqlite /snapshot/public.sqlite >/dev/null
    cat "$temp_dir/public.sqlite"
else
    # Bootstrap only. Replace this snapshot with the frozen export at cutover.
    cat /opt/uc-website/build/public.sqlite
fi
