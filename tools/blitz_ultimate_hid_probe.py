#!/usr/bin/env python3
"""Rampage Blitz Ultimate probe — wrapper around king_ultra_hid_probe --sku blitz."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# Ensure --sku blitz is present for the shared probe.
if "--sku" not in sys.argv:
    sys.argv[1:1] = ["--sku", "blitz"]

from king_ultra_hid_probe import main  # noqa: E402

if __name__ == "__main__":
    main()
