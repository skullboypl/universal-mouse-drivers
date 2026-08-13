# -*- coding: utf-8 -*-
"""Extract const en: Dict from messages.ts → JSON."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "web" / "src" / "i18n" / "messages.ts"
OUT = ROOT / "web" / "src" / "i18n" / "_en.json"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    m = re.search(r"const en: Dict = \{([\s\S]*?)\n\}", text)
    if not m:
        raise SystemExit("en dict not found")
    body = m.group(1)
    out: dict[str, str] = {}
    # Match 'key': 'value' or "value" or `value` (possibly multiline)
    pattern = re.compile(
        r"'([^']+)':\s*((?:'(?:\\'|[^'])*')|(?:\"(?:\\\"|[^\"])*\")|(?:`(?:\\`|[^`])*`))",
        re.MULTILINE,
    )
    for key, raw in pattern.findall(body):
        quote = raw[0]
        s = raw[1:-1]
        if quote == "`":
            s = s.replace("\\`", "`").replace("\\n", "\n").replace("\\t", "\t")
        elif quote == "'":
            s = s.replace("\\'", "'").replace("\\n", "\n")
        else:
            s = s.replace('\\"', '"').replace("\\n", "\n")
        out[key] = s
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(out)} keys → {OUT}")


if __name__ == "__main__":
    main()
