# Decompile layout

Mirrors `web/src/devices/`:

```
Decompile/
  mice/
    <brand>/
      <model>/     # OEM dumps, ILSpy, captures, notes
  keyboards/       # (future)
```

## Current mice

| Brand | Model folder | Notes |
|---|---|---|
| Redragon | `mice/redragon/king-ultra/` | M916OB-ULT — separate from Rampage |
| Rampage | `mice/rampage/blitz-ultimate/` | LOCKED live SKU in UMD — do not mix with King |
| Logitech | `mice/logitech/superlight-v1/`, `omm-2.6.1749/` | HID++ / OMM |

**Rule:** Redragon ≠ Rampage. Never copy protocol notes or Language XML between those trees as a shared source of truth — each SKU keeps its own OEM dump.
