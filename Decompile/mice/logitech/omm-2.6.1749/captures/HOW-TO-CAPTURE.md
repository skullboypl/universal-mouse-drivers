# How to capture OMM → Superlight v1 (jak King Ultra)

Cel: realne bajty **onboard** (`0x8100` / `0x8110`) z Onboard Memory Manager, nie tylko live DPI/battery.

## Setup

1. Zainstaluj [USBPcap](https://desowin.org/usbpcap/) + Wireshark.
2. Zamknij **G HUB** i inne HID openy.
3. Zostaw tylko odbiornik Superlight `046D:C547` (A50 `0B1C` możesz odłączyć na czas sniffera).
4. Start capture na USBPcap dla właściwego roota.
5. Filtr Wireshark:
   ```
   usb.idVendor == 0x046d && usb.idProduct == 0xc547
   ```
6. Odpal `OnboardMemoryManager_2.6.1749.exe` z `Decompile/mice/logitech/omm-2.6.1749/bin/`.

## Sesje (jedna zmiana = jeden plik)

| Plik | Akcja w OMM |
|------|-------------|
| `01-dpi-800-to-1600.pcapng` | zmiana DPI w profilu + Apply/Save |
| `02-rate-1000-to-500.pcapng` | report rate |
| `03-button-remap.pcapng` | zmiana side button |
| `04-profile-switch.pcapng` | switch onboard profile |

Szukaj interrupt OUT z report id **`0x11`** (long HID++) — to ten sam kanał co `tools/logitech_superlight_hidpp_probe.py` / UMD `HidppClient`.

## Mapowanie

1. Znajdź feature index z live FeatureSet (`captures/probe-featureset.txt`): `8100`→8, `8110`→9, `2201`→11, …
2. Byte layout: `11 | deviceIndex=01 | featureIndex | (fn<<4)|swId | params…`
3. Opisz ops w `NOTES-hidpp-features.md` → implementacja w `web/src/devices/mice/logitech/pro-x-superlight/`.

## Szybki check bez sniffera

```powershell
python tools/logitech_superlight_hidpp_probe.py --features discover
```
