#!/usr/bin/env python3
"""Dev preview server for the work hub.

Why not `python -m http.server`:
    SimpleHTTPRequestHandler sends no `Cache-Control` header at all. Browsers
    then fall back to "heuristic caching" driven by `Last-Modified`, so a
    freshly edited index.html / shell.js / works.json stays invisible until a
    hard refresh. It bites hardest on navigation: clicking "back" from a
    detail page hits the bare `../../index.html` link, which has no cache
    buster, so you get the OLD page back.

This server sends `no-store` on every response and refuses conditional
requests, so the browser always re-fetches. Local preview only -- do not
deploy this to production.

Usage:
    python3 serve.py [-p PORT] [-d DIRECTORY]
"""

import argparse
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    server_version = "WorkHubDev/1.0"

    def end_headers(self):
        # Kill every layer of browser + intermediary caching.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        # Strip conditional-request headers so the handler never short-circuits
        # into a 304 with an empty body. The browser must get real bytes.
        for hdr in ("If-Modified-Since", "If-None-Match"):
            if hdr in self.headers:
                del self.headers[hdr]
        return super().send_head()


def main():
    ap = argparse.ArgumentParser(description="No-cache static preview server")
    ap.add_argument("-p", "--port", type=int, default=8791)
    ap.add_argument("-d", "--directory", default=".")
    args = ap.parse_args()

    handler = lambda *a, **kw: NoCacheHandler(*a, directory=args.directory, **kw)
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"serving {args.directory} on http://127.0.0.1:{args.port}/  (no-store)", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    sys.exit(main())
