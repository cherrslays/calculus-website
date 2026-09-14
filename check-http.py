"""Smoke-test the complete static site over HTTP using only Python's standard library."""
import os
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.request import urlopen

os.chdir(Path(__file__).resolve().parent.parent)
assets = {"calculator-worker.js", "vendor/nerdamer.js"}

class AssetParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        source = a.get("src") if tag == "script" else a.get("href") if tag == "link" and a.get("rel") in ("stylesheet", "icon") else None
        if source and not source.startswith("http"):
            assets.add(source)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/"
try:
    for page in ("index.html", "limits.html", "derivatives.html", "integrals.html", "practice.html"):
        with urlopen(base + page, timeout=5) as response:
            assert response.status == 200, page
            AssetParser().feed(response.read().decode())
    for asset in sorted(assets):
        with urlopen(base + asset, timeout=5) as response:
            assert response.status == 200 and response.read(), asset
    print(f"HTTP audit passed: 5 pages and {len(assets)} complete local assets, including worker dependencies.")
finally:
    server.shutdown()
    server.server_close()
