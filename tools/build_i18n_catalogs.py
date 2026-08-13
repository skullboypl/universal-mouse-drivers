# -*- coding: utf-8 -*-
"""Validate catalogs/*.json cover every EN key."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / "web" / "src" / "i18n"
EN = json.loads((I18N / "_en.json").read_text(encoding="utf-8"))
CATALOGS = I18N / "catalogs"
LANGS = ["de", "fr", "es", "pt", "it", "zh", "ja", "ko", "ru"]


def main() -> int:
    CATALOGS.mkdir(parents=True, exist_ok=True)
    en_keys = set(EN)
    ok = True
    for lang in LANGS:
        path = CATALOGS / f"{lang}.json"
        if not path.exists():
            print(f"MISSING {path}")
            ok = False
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        missing = sorted(en_keys - set(data))
        extra = sorted(set(data) - en_keys)
        if missing or extra:
            ok = False
            print(f"{lang}: missing={len(missing)} extra={len(extra)}")
            if missing[:8]:
                print("  missing sample:", missing[:8])
            if extra[:8]:
                print("  extra sample:", extra[:8])
        else:
            print(f"{lang}: OK ({len(data)})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
