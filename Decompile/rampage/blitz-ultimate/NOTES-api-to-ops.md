# Blitz Ultimate — API → ops (vs King Ultra)

ILSpy on `Mouse Drive Beta.exe` (install folder copy). Managed `DriverLib.*` structs
match King Ultra; native HIDUsb still linked in-process (`HIDUsbTest - V11`).

## UsbCommandID (identical)

| ID | Name | Our op (planned) |
|----|------|------------------|
| 1 | EncryptionData | `read_encryption` |
| 2 | PCDriverStatus | `set_pc_driver` |
| 3 | DeviceOnLine | `read_online` |
| 4 | BatteryLevel | `read_info` |
| 7 | WriteFlashData | settings / DPI / … |
| 8 | ReadFlashData | `read_flash` |
| 9 | ClearSetting | `clear_settings` |
| 14 | GetCurrentConfig | `read_config` |
| 15 | SetCurrentConfig | `set_profile` |
| 18 | ReadVersionID | mouse firmware |
| 22 | SetLongRangeMode | `set_long_distance` |
| 23 | GetLongRangeMode | `get_long_distance` |

## MouseConfig flash addresses (reuse King Ultra map)

From identical `MouseConfig` + known KU live map (`FlashAddr`):

| Addr | Field | Op |
|------|-------|----|
| 0x00 | reportRate | `set_report_rate` |
| 0x02 | maxDPI | `set_dpi_stage_count` |
| 0x04 | currentDPI | `set_active_dpi` |
| 0x0A | silenceHeight (LOD) | `set_lod` |
| 0x0C + i×4 | DPI stage i | `set_dpi` |
| 0x60 + i×4 | KeyFunMap | `set_button` |
| 0xA9 | keyDebounceTime | `set_debounce` |
| 0xAB | motionSyncEnable | flags |
| 0xAD | allLedOffTime (sleep) | `set_sleep` |
| 0xAF | linearCorrectionEnable | flags |
| 0xB1 | rippleControlEnable | flags |
| 0xB5 | sensorCustomSleepEnable | peak |
| 0xB7 | sensorSleepTime | peak timeout |
| 0xB9 | sensorPowerSavingModeEnable | sensor mode |

REPORT_RATE enum: 125→8, 250→4, 500→2, 1000→1, 2000→0x10, 4000→0x20
(UI has 8 KHz assets; confirm `0x40` on device like KU).

## Diff vs King Ultra exe

- **Only in KU:** `CS_UsbUpgrade_*` (5 symbols) — firmware update path.
- **Managed structs compared identical:** `MouseConfig`, `UsbCommandID`, `FlashDataMap`, `DPIConfig`.
- **Config.ini:** different PID/MID/DPI grades/key UI coords — not flash opcodes.

## Status

| Step | State |
|------|--------|
| Copy OEM + strings + ILSpy structs | done |
| WebHID device module (`rampage-blitz-ultimate`) | done (own identity/buttons; shared wire) |
| Live flash R/W verify on F562/F563 | pending (`tools/blitz_ultimate_hid_probe.py`) |
