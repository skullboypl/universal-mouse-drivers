# OMM 2.6.1749 → HID++ ops (Superlight v1 first)

Mapa z symboli native `logi::hidppio` w `OnboardMemoryManager_2.6.1749.exe`.
To **nie** jest pełny decompile — lista feature ID + typowe funkcje ze specyfikacji HID++ 2.0.

## Protokół transportu

- Report ID `0x10` — short (7 B łącznie z report id na Windows hidapi write)
- Report ID `0x11` — long (20 B)
- Layout: `deviceIndex | featureIndex | (fn<<4)|swId | params…`
- Receiver `046D:C547`: paired mouse zwykle `deviceIndex = 0x01`
- Root feature zawsze `featureIndex = 0`

## Discovery

| Feature | Fn | Op |
|---------|----|----|
| `0x0000` Root | 0 | `GetFeature(featureId)` → index, type, version |
| `0x0000` Root | 1 | `GetProtocolVersion` |
| `0x0001` FeatureSet | 0 | `GetCount` |
| `0x0001` FeatureSet | 1 | `GetFeatureId(index)` |

## Battery (UMD tray / status)

| Feature | Fn | Op | Uwagi |
|---------|----|----|-------|
| `0x1000` | 0 | `getBatteryLevelStatus` | % — **brak na Superlight v1** |
| `0x1001` | 0 | `getBatteryVoltage` | mV + krzywa w OMM — **brak na v1** |
| `0x1004` | **0** | `GetCapabilities()` | OMM; **nie** SoC |
| `0x1004` | **1** | `GetStatus()` → `state_of_charge` | **v1 live = OMM %** (np. 83) |

Szczegóły z ilspycmd: `NOTES-decompiled-ops.md`.

## DPI / sensor

| Feature | Fn | Op |
|---------|----|----|
| `0x2201` | 0 | `getSensorCount` |
| `0x2201` | 1 | `getSensorDpiList(sensor)` |
| `0x2201` | 2 | `getSensorDpi(sensor)` |
| `0x2201` | 3 | `setSensorDpi(sensor, dpi)` |
| `0x2202` | * | extended DPI (X/Y, LOD…) — jeśli GetFeature ≠ 0 |

## Report rate / onboard (OMM core)

| Feature | Typowe użycie |
|---------|----------------|
| `0x8060` | report rate na **Superlight v1** (live) |
| `0x8061` | report rate na innych myszach (stringi OMM) |
| `0x8100` | onboard profiles read/write |
| `0x8110` | onboard button mapping |
| `0x1B0C` | reprogrammable buttons |

## LIGHTSPEED 1 vs 2

Stringi OMM:

- `HIDPP_PROTO_LIGHTSPEED_1` ← **Superlight gen1 / C547**
- `HIDPP_PROTO_LIGHTSPEED_2`, `_CA`, `_CA_CRC24`, `_LLPM`
- `IsLightspeed2Compatible`

Dla v1 nie ruszamy ścieżki LS2 / CRC24 aż C547 przejdzie read path (battery + DPI).

## Live check (2026-08-12, receiver `046D:C547`, deviceIndex `0x01`)

**Transport:** MI_02 Col01 = short `0x10`; Col02 = long `0x11` (HID++ 2.0 do myszy).

| Check | Wynik |
|-------|--------|
| Protocol | **4.2** |
| DPI `0x2201` | **800** (default 800); lista `100 … step 50 … 25600` |
| Battery | **`0x1004` fn1** `GetStatus` → **83%** (fn0 = capabilities, nie %) |
| Report rate | **`0x8060`** (nie `8061` z OMM) |
| Onboard | `0x8100` + `0x8110` obecne |
| FeatureSet | **27** feature’ów (pełna lista w `captures/probe-featureset` / poniżej) |

### Feature table (live Superlight v1)

| idx | ID | Uwagi |
|-----|-----|-------|
| 1 | `0001` | FeatureSet |
| 2 | `0003` | DeviceInfo (FW string zawiera `BL1%`) |
| 3 | `0005` | DeviceName |
| 4 | `1D4B` | Wireless device status |
| 5 | `0020` | Config Change |
| 6 | `1004` | **Battery (unified)** |
| 7 | `8070` | Effects |
| 8 | `8100` | Onboard profiles |
| 9 | `8110` | Onboard buttons |
| 10 | `8060` | **Report rate** |
| 11 | `2201` | **Adjustable DPI** |
| 12–27 | `1500`, `1802`…`1E22` | DFU / special / encrypted |

## UMD WebHID (`web/`)

Scaffold: `web/src/devices/mice/logitech/pro-x-superlight/`

| Warstwa | Plik | Status |
|---------|------|--------|
| Identity / filters | `identity.ts` | `046D:C547`, status `wip` |
| HID++ client | `protocol/hidpp.ts` | long `0x11` Col02 |
| Driver | `driver.ts` | battery `1004`, DPI `2201`, rate `8060` |
| Onboard `8100`/`8110` | — | **RE w toku** (jak King flash map) |

Jak King Ultra: sniff OMM przy zmianie onboard profile/button → uzupełnić encode w `protocol/`.

```text
# zamknij G HUB / OMM
python tools/logitech_superlight_hidpp_probe.py --features discover
cd web && npm run dev
# Connect → PRO X SUPERLIGHT
```
