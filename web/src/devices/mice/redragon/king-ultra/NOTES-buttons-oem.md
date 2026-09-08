# King Ultra (M916OB-ULT) - OEM button map

Source install:
`C:\Program Files (x86)\Redragon  M916OB-ULT  3 modes Gaming Mouse\`

Copied snapshots: `oem-Config.ini`, `oem-0-English.xml` (KeyFunction section).

## Flash layout (shared HIDUsb V11 map, King-owned copy in `protocol.ts`)

| Region | Address | Notes |
|---|---|---|
| KeyFunMap[i] | `0x60 + i×4` | `[type, param1, param2, ck]` |
| ShortCutKey[i] | `0x100 + i×0x20` | Media/combo events (type=5 leaves) |
| MacroKey[i] | `0x300 + i×0x180` | Macro body when type=6 |

## Physical KeyParam (Config.ini) - remappable on mouse art

Format: `x,y,flashIndex,type,param1,param2`

| # | flash | Default | UI xy |
|---|---|---|---|
| 1 | `0x00` | Left `01/01/00` | 159,223 |
| 2 | `0x01` | Right `01/02/00` | 43,186 |
| 3 | `0x02` | Middle `01/04/00` | 127,145 |
| 4 | `0x04` | Forward `01/10/00` | 286,169 |
| 5 | `0x03` | Back `01/08/00` | 322,127 |
| 6 | `0x0C` (+ mirrors `0x05`,`0x0B`) | DPI Loop `02/01/00` | 313,240 |

> **Button 6:** Config Tag / primary KeyFun = `0x0C`. Factory also stores DPI Loop at `0x05` and `0x0B`. UMD remaps primary `0x0C` and mirrors the other two - writing only one slot left the physical key stuck or dead.

## Extra KeyParam7-16 (OEM Config - not on UMD 6-button overlay)

| # | flash | Default | xy |
|---|---|---|---|
| 7 | `0x06` | DPI- `02/03/00` | 117,132 |
| 8 | `0x0B` | DPI- `02/03/00` | 384,46 |
| 9-16 | `0x05,0x0A,0x07-0x09,0x0D-0x0F` | Left `01/01/00` | x=384 column |

## Action catalog (`actions.ts`)

From `Language/0-English.xml` KeyFunction + SubKeyFunction:

- Mouse: Left/Right/Middle/Back/Forward
- System: Polling Rate Switch, Fire, Combo, Disabled
- Scroll: Up/Down/Left/Right
- DPI: Loop / + / - + DPI Lock 100…1200 (`param1 = dpi/50 - 1`)
- Media: type=5 + ShortCut Consumer usage (0183, 00CD, …)
- Lighting: Light Strip On/Off (`08/0003`), Loop effects (`08/0004`) - **no** all-toggle in King XML
- Macro: type=6 (pull submenu)

Do **not** import Blitz `actions.ts` - keep catalogs separate even when labels match.
