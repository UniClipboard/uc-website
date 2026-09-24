#!/usr/bin/env bash
# Build the tailcat js/wasm client used by the /try page from a pinned commit.
#
# Output (committed to the repo, served with an immutable cache):
#   public/tailcat/main.<sha8>.wasm.gz
#   public/tailcat/wasm_exec.<sha8>.js
#   public/tailcat/manifest.json
#
# The build is reproducible: -trimpath, no VCS stamping, and a deterministic
# gzip (no name, no timestamp). Running it twice yields identical SHA-256s.
#
# Requires network access the first time, to fetch the tailcat source and the
# Go toolchain named by GO_VERSION (via GOTOOLCHAIN).
set -euo pipefail

TAILCAT_REPO="${TAILCAT_REPO:-https://github.com/tailscale/tailcat.git}"
TAILCAT_SHA="83921d7141b80db20fd733ee195c805d2721e489"
GO_VERSION="go1.27.1"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/public/tailcat"
SHA8="${TAILCAT_SHA:0:8}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

sha256() { shasum -a 256 "$1" | cut -d' ' -f1; }
size() { wc -c <"$1" | tr -d ' '; }

echo "==> Fetching tailcat@$SHA8"
git init -q "$WORK/src"
git -C "$WORK/src" remote add origin "$TAILCAT_REPO"
git -C "$WORK/src" fetch -q --depth 1 origin "$TAILCAT_SHA"
git -C "$WORK/src" checkout -q FETCH_HEAD

echo "==> Building with $GO_VERSION"
export GOTOOLCHAIN="$GO_VERSION"
export GOFLAGS="-trimpath -buildvcs=false"
export CGO_ENABLED=0
(cd "$WORK/src" && GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o "$WORK/main.wasm" ./web)
GOROOT_BUILD="$(cd "$WORK/src" && go env GOROOT)"
GO_REPORTED="$(cd "$WORK/src" && go env GOVERSION)"

WASM_EXEC="$GOROOT_BUILD/lib/wasm/wasm_exec.js"
[ -f "$WASM_EXEC" ] || WASM_EXEC="$GOROOT_BUILD/misc/wasm/wasm_exec.js"

echo "==> Writing $OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
WASM_GZ="main.$SHA8.wasm.gz"
EXEC_JS="wasm_exec.$SHA8.js"
gzip -9 -n -c "$WORK/main.wasm" >"$OUT_DIR/$WASM_GZ"
cp "$WASM_EXEC" "$OUT_DIR/$EXEC_JS"

cat >"$OUT_DIR/manifest.json" <<JSON
{
  "source": "$TAILCAT_REPO",
  "commit": "$TAILCAT_SHA",
  "go": "$GO_REPORTED",
  "license": "BSD-3-Clause",
  "files": {
    "wasm": {
      "path": "/tailcat/$WASM_GZ",
      "sha256": "$(sha256 "$OUT_DIR/$WASM_GZ")",
      "bytes": $(size "$OUT_DIR/$WASM_GZ"),
      "uncompressedSha256": "$(sha256 "$WORK/main.wasm")",
      "uncompressedBytes": $(size "$WORK/main.wasm")
    },
    "wasmExec": {
      "path": "/tailcat/$EXEC_JS",
      "sha256": "$(sha256 "$OUT_DIR/$EXEC_JS")",
      "bytes": $(size "$OUT_DIR/$EXEC_JS")
    }
  }
}
JSON

cat "$OUT_DIR/manifest.json"
