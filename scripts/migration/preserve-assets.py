"""Preserve public Next.js assets for the first website origin cutover."""

import concurrent.futures
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
from urllib.parse import unquote, urljoin, urlparse

snapshot_path, destination, deployment = sys.argv[1:]
root = Path(destination).resolve()
if root.exists():
    raise SystemExit("Use a new asset snapshot directory")
root.mkdir(parents=True, mode=0o700)
origin = "https://www.uniclipboard.app"


def fetch(path):
    result = subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--max-time", "25", origin + path],
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(f"Public request failed: {path}")
    return result.stdout


def asset_path(value, base="/"):
    parsed = urlparse(urljoin(origin + base, value))
    path = parsed.path
    if parsed.netloc != "www.uniclipboard.app" or not path.startswith("/_next/static/"):
        return None
    decoded = unquote(path)
    if ".." in PurePosixPath(decoded).parts or "\\" in decoded:
        raise RuntimeError("Invalid public asset path")
    return path


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value:
                path = asset_path(value)
                if path:
                    self.paths.add(path)


snapshot = json.loads(Path(snapshot_path).read_text())
pages = {"/", "/download", "/blog", "/compare", "/use-cases", "/changelog", "/sponsor", "/whitepaper", "/admin/sign-in"}
locales = ["zh", "ru", "es", "fr", "de", "pt-BR", "ja", "ko", "ar", "hi", "zh-TW"]
for locale in locales:
    pages.update((f"/{locale}", f"/{locale}/download"))
for row in snapshot["tables"]["articles"]:
    if row["status"] == "published":
        pages.update((f'/{row["category"]}/{row["slug"]}', f'/zh/{row["category"]}/{row["slug"]}'))

pending = set()
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for page, body in zip(sorted(pages), pool.map(fetch, sorted(pages))):
        parser = References()
        parser.feed(body.decode("utf-8"))
        pending.update(parser.paths)

assets = {}
while pending:
    batch = sorted(pending - assets.keys())
    pending = set()
    if not batch:
        break
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for path, body in zip(batch, pool.map(fetch, batch)):
            # Nginx resolves its normalized URI against filesystem paths.
            output = root / unquote(path).lstrip("/")
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(body)
            assets[path] = {"bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
            if path.endswith(".css"):
                for ref in re.findall(r"url\(([^)]+)\)", body.decode("utf-8")):
                    ref = asset_path(ref.strip("\"'"), path)
                    if ref:
                        pending.add(ref)
            if "/webpack-" in path:
                text = body.decode("utf-8")
                pattern = r'\.u=\w+=>"static/chunks/"\+\w+\+"\."\+\(\{([^}]+)\}\)\[\w+\]\+"\.js"'
                match = re.search(pattern, text)
                if not match:
                    raise RuntimeError("Review the source webpack chunk filename pattern before cutover")
                for chunk, digest in re.findall(r'(\d+):"([a-f0-9]+)"', match.group(1)):
                    pending.add(f"/_next/static/chunks/{chunk}.{digest}.js")

receipt = {"sourceDeployment": deployment, "origin": origin, "pages": sorted(pages), "assets": assets, "bytes": sum(row["bytes"] for row in assets.values())}
(root / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"status": "public-assets-preserved", "pages": len(pages), "assets": len(assets), "bytes": receipt["bytes"]}))
