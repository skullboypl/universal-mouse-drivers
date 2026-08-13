# Reverse engineering — Logitech Onboard Memory Manager + PRO X SUPERLIGHT gen1

## Cel (ten sprint)

| Priorytet | Urządzenie | VID:PID | Status |
|-----------|------------|---------|--------|
| **1** | **PRO X SUPERLIGHT (gen1)** przez LIGHTSPEED | `046D:C547` | wpięty, probe poniżej |
| later | SUPERLIGHT 2 | inne PID / LIGHTSPEED 2 | **nie teraz** |

OMM (`OnboardMemoryManager_2.6.1749`) obsługuje obie generacje (`HIDPP_PROTO_LIGHTSPEED_1` vs `_2`), ale UMD startujemy od **v1 / C547**.

## Short answer

| Metoda | Da się? | Kiedy |
|--------|---------|--------|
| **Live HID++ probe** (`tools/logitech_superlight_hidpp_probe.py`) | **Tak, pierwsza linia** | C547 wpięty, G HUB/OMM zamknięte |
| **Stringi / symbole OMM** | Tak, mapa feature ID | już wyciągnięte |
| **USB sniff OMM** | Tak | gdy probe nie wystarczy (onboard write) |
| **Ghidra na native `logi::hidppio`** | Później | szczegóły CRC / LIGHTSPEED 2 |

Protokół to **HID++ 2.0** (nie custom Redragon/G-Wolves). Feature discovery przez Root `0x0000` → `GetFeature(featureId)`.

## Inventory

```
Decompile/mice/logitech/omm-2.6.1749/
  bin/OnboardMemoryManager_2.6.1749.exe
  extracted/
    strings-all.txt
    strings-interesting.txt
    hidpp-feature-ids.txt      # z symboli logi::hidppio
    centpp-feature-ids.txt
  captures/                    # pcapng z OMM (opcjonalnie)

Decompile/mice/logitech/superlight-v1/
  README.md                    # ten plik (skrót ścieżki urządzenia)
```

Źródło OEM: `OnboardMemoryManager_2.6.1749 (2).exe` (Downloads) → skopiowane do `bin/`.

## Co widać w OMM 2.6.1749

- Mix: WPF/.NET UI + native C++ `logi::hidppio::*`
- Jawne protokoły: `HIDPP_PROTO_LIGHTSPEED_1`, `HIDPP_PROTO_LIGHTSPEED_2*`
- Feature ID z mangled symbols (komplet w `extracted/hidpp-feature-ids.txt`):

| ID | Znaczenie (standard HID++ / OMM) |
|----|----------------------------------|
| `0000` | Root |
| `0003` | Device / FW info |
| `0005` | Device name / type (rev) |
| `1000` | Battery Unified Level Status |
| `1001` | Battery Voltage |
| `1004` | Battery level status (alt) |
| `1B0C` | Reprogrammable keys / mouse buttons |
| `2110` | SmartShift |
| `2121` | HiRes Wheel |
| `2201` | Adjustable DPI |
| `2202` | Extended adjustable DPI |
| `8061` | Report rate |
| `8070`/`8071` | Effects / lighting |
| `8100` | Onboard profiles |
| `8110` | Onboard buttons |
| `0101`/`0104`/`0600`/`0620`/`0635`/`1895`/`4540`/`8081`/`80E0` | inne (dfu / special) |

## Live device (ta maszyna) — potwierdzone 2026-08-12

`hid.enumerate(0x046D, 0xC547)` — **USB Receiver** (LIGHTSPEED gen1):

| usage_page | usage | iface | rola |
|------------|-------|-------|------|
| `0xFF00` | `0x01` | 2 | short HID++ `0x10` |
| `0xFF00` | `0x02` | 2 | **long HID++ `0x11` → mysz** |
| `0x0001` | `0x02` | 0 | mouse |
| … | … | 1 | kbd / consumer |

**Tożsamość myszy (HID++):** nazwa `PRO X Wireless`, protocol **4.2**, FW tag `BL1%`.

| Feature | Live |
|---------|------|
| DPI `2201` | 800 (zakres 100–25600 / step 50) |
| Battery `1004` | **fn1 GetStatus** → SoC % (OMM); fn0 = capabilities |
| Report rate `8060` | current `01` (= 1 ms → 1000 Hz) |
| Onboard `8100`/`8110` | obecne |

Szczegóły: `../omm-2.6.1749/NOTES-hidpp-features.md`

## UMD

Driver WWW: `web/src/devices/mice/logitech/pro-x-superlight/` (WebHID HID++ Col02).

Następny RE jak King: USB sniff OMM przy zapisie onboard profile / przycisków → `0x8100` / `0x8110`.

## Referencje

- [HID++ 2.0 draft (lekensteyn)](https://lekensteyn.nl/files/logitech/logitech_hidpp_2.0_specification_draft_2012-06-04.pdf)
- [x2201 adjustable DPI](https://lekensteyn.nl/files/logitech/x2201_adjustabledpi.html)
- [OpenLogi HID++ overview](https://openlogi.org/en/hidpp)
- Solaar / libratbag (implementacje open-source tych samych feature’ów)
