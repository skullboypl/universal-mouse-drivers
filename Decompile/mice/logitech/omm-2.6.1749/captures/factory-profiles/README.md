# Factory onboard profiles (PRO X SUPERLIGHT gen1)

Captured live from `046D:C547` after **OMM → Restore defaults** (2026-08-12).

| File | Content |
|------|---------|
| `sector-0.bin` | Profile directory (`00 01 01 00` … `00 05 01 00` + `FF FF` + CRC) |
| `sector-1.bin` … `sector-5.bin` | Profile payloads (255 B) |

## Buttons @ offset 32 (all profiles)

```
80 01 00 01   Left
80 01 00 02   Right
80 01 00 04   Middle
80 01 00 08   Back
80 01 00 10   Forward
```

Left + Right are locked in OMM/UMD.

## DPI header

Profiles **1, 2, 3, 5** (identical):

- rate = `01` (1000 Hz)
- defaultIdx = `01` (slot 2 → 800)
- shiftIdx = `00` (slot 1 → 400)
- DPI LE = `400, 800, 1600, 3200, 6400`

Profile **4**: only `400, 800` enabled (remaining DPI words = 0).

Source of truth for UMD: `web/src/devices/mice/logitech/pro-x-superlight/factoryProfiles.ts`.
