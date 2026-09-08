# Device LOCK - live SKUs

When a model is **LOCKED**, do **not** change its wire/protocol data, flash
addresses, KeyFun / ShortCut encodings, button `flashIndex` map, HID
VID/PID filters, or connection/dongle IDs - unless the user explicitly
says to unlock that SKU for this task.

UI copy, i18n, SEO, and unrelated mice are fine. Do not “drive-by” edit a
locked tree while working on another mouse.

## Locked (live)

| Catalog id | Path | Locked since | Notes |
|---|---|---|---|
| `redragon-king-ultra` | `mice/redragon/king-ultra/` (web) · `tray-battery/.../Mice/Redragon/KingUltra/` | 2026-08-13 | LIVE - btn6 KeyFun mirrors `0x0C`+`0x05`+`0x0B` |
| `rampage-blitz-ultimate` | `mice/rampage/blitz-ultimate/` (web) · `tray-battery/.../Mice/Rampage/BlitzUltimate/` | 2026-08-13 | LIVE - do not touch protocol/addresses/HID |

### King Ultra - treat as frozen

- `protocol.ts` - flash addresses, encode/decode, UsbCommandId
- `actions.ts` - KeyFun catalog, ShortCut `@0x100`, media usages
- `macroFlash.ts` - macro blob / stride
- `buttons.ts` - `flashIndex`, btn6 mirrors, default KeyFun
- `identity.ts` - VID/PID / hid filters (`status: 'live'`)
- `driver.ts` - write paths that encode the above (no address/mapping edits)
- `defaults.ts` - DPI grades / stage count tied to OEM Config

### Blitz Ultimate - treat as frozen

- `protocol.ts` - flash addresses, encode/decode, UsbCommandId
- `actions.ts` - KeyFun catalog, ShortCut `@0x100`, media usages
- `macroFlash.ts` - macro blob / stride
- `buttons.ts` - `flashIndex`, default KeyFun
- `identity.ts` - VID/PID / hid filters
- `driver.ts` - write paths that encode the above (no address/mapping edits)
- `defaults.ts` - DPI grades / stage count tied to OEM Config

Allowed without unlock: pure typo fixes in comments only if user asks; never
silent refactors that change bytes on the wire.

Do **not** merge King Ultra and Blitz Ultimate protocol / actions / tray folders.

## Not locked

- `mice/gwolves/fenrir-max/`
- `mice/logitech/pro-x-superlight/`
- `mice/demo/`

## How to unlock

User must explicitly say e.g. “odblokuj King Ultra” / “unlock king-ultra”
or “odblokuj Blitz” / “unlock blitz-ultimate”.
Then note the unlock in the session; do not remove the row from this file
unless they ask to retire the lock permanently.
