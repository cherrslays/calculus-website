#!/usr/bin/env python3
"""Compatibility entry point; the shared Node build uses the existing jsdom dependency."""
import subprocess
from pathlib import Path
subprocess.run(["node", "scripts/build-search.cjs"], cwd=Path(__file__).resolve().parent.parent, check=True)
