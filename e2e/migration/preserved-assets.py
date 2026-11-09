"""Verify preserved assets through the real OpenResty HTTPS virtual host."""

import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import sys

manifest, ca_file = sys.argv[1:]
receipt = json.loads(Path(manifest).read_text())
curl = ["curl", "--silent", "--show-error", "--noproxy", "*", "--cacert", ca_file, "--resolve", "www.uniclipboard.app:443:127.0.0.1"]


def verify(item):
    path, expected = item
    body = subprocess.check_output(curl + ["--fail", "https://www.uniclipboard.app" + path])
    if hashlib.sha256(body).hexdigest() != expected["sha256"]:
        raise RuntimeError("Asset digest mismatch: " + path)
    return len(body)


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    sizes = list(pool.map(verify, receipt["assets"].items()))
missing = subprocess.check_output(curl + ["-o", "/dev/null", "-w", "%{http_code}", "https://www.uniclipboard.app/_next/static/migration-acceptance-missing.js"], text=True)
if missing != "404":
    raise RuntimeError("Unknown static asset must return 404")
print(json.dumps({"sourceDeployment": receipt["sourceDeployment"], "assetsVerified": len(sizes), "bytesVerified": sum(sizes), "allDigestsMatch": True, "unknownAssetStatus": 404, "transport": "server-loopback HTTPS with Origin CA validation"}))
