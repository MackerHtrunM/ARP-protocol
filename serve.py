#!/usr/bin/env python3
"""Serve this static learning site locally with Python's standard library."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


if __name__ == "__main__":
    address = ("127.0.0.1", 8000)
    print(f"ARP learning site: http://{address[0]}:{address[1]}")
    ThreadingHTTPServer(address, SiteHandler).serve_forever()
