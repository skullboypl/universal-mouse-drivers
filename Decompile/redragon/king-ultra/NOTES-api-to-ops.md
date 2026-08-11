# Map: OEM HIDUsb API → our `ProtocolCommand`

Source: `HIDUsb-64.dll` (Costura) + ILSpy `DriverLib.*` - no USBPcap required for this layer.

## Frame (20 bytes in OEM queue; **17 bytes on the wire**)

Stock `UsbServer` sends config with **`WriteFile` (HID Output)**, length `0x11`,
pointer `queue + 3` - **not** `HidD_SetFeature` (Feature is used in FW update).

| Offset | Meaning | On wire? |
|--------|---------|----------|
| 0 | ReportId `0x01` | no |
| 1 | `0x01` (native TX pending flag) | no |
| 2 | aux / flash-read chunk flag | no |
| 3 | `0x08` | wire[0] |
| 4 | `UsbCommandID` | wire[1] |
| 5–6 | `0` | yes |
| 7 | flash address (write/read flash) or `0` | yes |
| 8 | dataLen \| (`0x80` if dongle online) | yes |
| 9… | payload | yes |
| 19 | `checksum = (0x55 - sum[3..18]) & 0xff` | wire[16] |

WebHID (King Ultra 8K receiver `F54F`): Output report **id=8, 16 bytes**
(`usagePage ff02`). `sendReport(8, wire17.slice(1))` - do **not** use
report id 9 / 48-byte `ff06` channel. Feature is fallback only.

## UsbCommandID (DriverLib)

| ID | Name | Our op |
|----|------|--------|
| 4 | BatteryLevel | `read_info` (partial) |
| 7 | WriteFlashData | settings / DPI / debounce… |
| 8 | ReadFlashData | `read_flash_all` |
| 9 | ClearSetting | `clear_settings` |
| 14 | GetCurrentConfig | `read_config` |
| 15 | SetCurrentConfig | `set_profile` |
| 22 | SetLongRangeMode | `set_long_distance` |

## MouseConfig flash addresses

| Addr | Field | Our op |
|------|-------|--------|
| 0x00 | reportRate (`REPORT_RATE` bit codes) | `set_report_rate` |
| 0x02 | maxDPI (stage count) | `set_dpi_stage_count` |
| 0x04 | currentDPI index | `set_active_dpi` |
| 0x0A | silenceHeight (LOD) | `set_lod` |
| 0x0C + i×4 | DPI stage i (`x,y,ex` + ck) | `set_dpi` |
| 0xA9 | keyDebounceTime | `set_debounce` |
| 0xAB | motionSyncEnable | `set_sensor_flags` |
| 0xAF | linearCorrectionEnable (angle) | `set_sensor_flags` |
| 0xB1 | rippleControlEnable | `set_sensor_flags` |
| 0xB7 | sensorSleepTime | `set_sleep` |

Report rate codes: 125→8, 250→4, 500→2, 1000→1, 2000→0x10, 4000→0x20, 8000→0x40.

PAW3950 DPI: `raw = dpi/50 - 1`; `xDPI=raw&0xFF`; `DPIex` carries high bits.

## Status

| Op | Encode | Live test |
|----|--------|-----------|
| set_report_rate / set_dpi / set_debounce / set_lod / flags / sleep / long_distance / profile | done in `protocol.ts` | WebHID + **ReadFlash verify** (`hid-flash-verify-v4`) |
| read_encryption / read_flash / read_current_dpi / read_report_rate | done | probe on attach |
| set_button | KeyFunMap @ `0x60 + i×4` `[type,p1,p2,ck]` | wired + verify |
| macros | type=6 stub only | pending macro buffer |

**0x80 online-bit trap (critical, CLI-proven):** On F54F, OR-ing `0x80` into
dataLen yields `status=1` empty echoes and flash reads stay zero. **Clear
0x80**: encryption returns a real non-echo payload; WriteFlash/ReadFlash
round-trip matches (`tools/king_ultra_hid_probe.py`). App default:
`setDongleOnline(false)`.

Encryption (`FUN_18000f160`): cmd=1, dataLen=8, payload[0..3]=random.

Implemented in `web/src/devices/redragon-king-ultra/protocol.ts` + `driver.ts`.
