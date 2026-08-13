# Reverse engineering — Rampage Blitz Ultimate

## Short answer

Same OEM **Mouse Drive Beta** / **HIDUsb V11** stack as Redragon King Ultra.
**UsbCommandID** and **MouseConfig / FlashDataMap** decompile **byte-identical** to King Ultra.
What changes for WebHID is mostly **VID/PID + Config.ini branding**, not flash layout.

| Item | Blitz Ultimate | King Ultra |
|------|----------------|------------|
| Exe | `Mouse Drive Beta.exe` v1.0.0.43 | same name / version |
| SHA256 | `F59265CD…E5832` (5 352 960 B) | `F7C2690D…20B4C` (5 353 472 B) |
| VID | `0x3554` | `0x3554` |
| Wired PID | `0xF562` | `0xF54D` |
| Dongle PID | `0xF563` | `0xF54F` / `0xF510` |
| Sensor | PAW3950 | PAW3950 |
| MCU (ini) | NRF52840 + CH32V305 | NRF52833 + CX52650N + CH32V305 |
| MID | `2` | `36` |
| CS_Usb* API | 73 | 78 (+5 `CS_UsbUpgrade_*`) |

## Config.ini decode (Base64 brand-prefix)

```
VID  = Rampage3554     → 0x3554
M_PID= RampageF562     → 0xF562
D_PID= RampageF563     → 0xF563
Sensor = 3950
MM = NRF52840
D8M = CH32V305
```

Source install: `C:\Program Files (x86)\Blitz Ultimate Mouse Driver\`

## Inventory

```
bin/MouseDriveBeta.exe
extracted/Config.ini
extracted/Description.xml
extracted/driver_sensor.h
extracted/Language/
extracted/res/dev1.png, logo.ico
extracted/hidusb-api-exports.txt
extracted/api-diff-vs-king-ultra.txt
extracted/exe-hash-compare.txt
extracted/strings-interesting.txt
extracted/strings-all.txt
extracted/ilspy-structs/   # MouseConfig, UsbCommandID, FlashDataMap, …
NOTES-api-to-ops.md
captures/                  # USBPcap dumps go here
```

## What to reuse from King Ultra

- Wire frame: report id `0x08`, cmd / status / addr / dataLen / payload / checksum `0x55-sum`
- Commands: same enum (`WriteFlashData=7`, `ReadFlashData=8`, `SetLongRangeMode=22`, …)
- Flash map: same as `web/.../redragon-king-ultra/protocol.ts` `FlashAddr`
- **0x80 online-bit trap** likely same — prove with live probe on `3554:F563`

Do **not** assume dongle behaviour until a live `king_ultra_hid_probe`-style run on Blitz PIDs.

## Next steps

1. Live USB probe: `python tools/blitz_ultimate_hid_probe.py` (or `king_ultra_hid_probe.py --sku blitz`).
2. WebHID module: `web/src/devices/rampage-blitz-ultimate/` (own identity/buttons; shared wire via protocol re-export).
3. Optional Ghidra on native HIDUsb only if probe shows different packing (unlikely).
