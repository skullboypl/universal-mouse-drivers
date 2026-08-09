# Reverse engineering — Redragon King Ultra (M916OB-ULT)

## Short answer

| Metoda | Da się? | Kiedy |
|--------|---------|--------|
| **USB sniff** (OEM app → klik → Wireshark/USBPcap) | **Tak, najlepsza** | Żeby dostać realne bajty Feature/Output report |
| **Decompile `.exe`** | Częściowo | Native C++ (nie .NET). API widać w stringach; pełny decompile = Ghidra |
| **Klik w naszej React app** | Nie na protokół | Dopóki `protocol.ts` jest pusty, nic sensownego nie leci do myszy |

**Rekomendacja:** sniff USB przy OEM + mapowanie na API z listy poniżej → wypełnić `web-app/src/devices/redragon-king-ultra/protocol.ts`.

## Co już wiemy

- **VID/PID:** `3554:F54D` (mouse), `3554:F54F` / `F510` (dongle)
- **Sensor:** PAW3950 (`Config.ini` / `driver_sensor.h`)
- Sterownik to **native PE**, nie .NET → `ilspycmd` nie zadziała
- Logika HID jest w module **`HIDUsb`** (PDB: `...\HIDUsbTest - V11\...\HIDUsb.pdb`) — **statycznie wlinkowana** w `Mouse Drive Beta.exe` (osobnego `HIDUsb.dll` nie ma w folderze instalacji)
- W exe są symbole/stringi `CS_UsbServer_*` / `CS_UsbFinder_*` — to powierzchnia protokołu

## Inventory (co jest / czego nie ma)

**Jest (pełny dump użytecznych plików OEM + ekstrakcja):**

```
bin/MouseDriveBeta.exe              # kopia OEM (~5.3 MB)
extracted/Config.ini                # VID/PID, DPI grades, KeyParam
extracted/Description.xml
extracted/driver_sensor.h           # mapy DPI / support flags per sensor
extracted/Language/                 # stringi UI
extracted/res/                      # pełne assety UI (1Home…8Calibration)
extracted/hidusb-api-exports.txt    # 78× CS_UsbServer_* / CS_UsbFinder_*
extracted/strings-interesting.txt
extracted/strings-all.txt
captures/                           # tu wrzucaj .pcapng
NOTES-api-to-ops.md
```

**Nie ma jeszcze (to nie leży w installerze):**

- osobnego `HIDUsb.dll` — wlinkowane w exe
- projektu Ghidra / zdekompilowanego C (trzeba odpalić Ghidrę lokalnie)
- capture’ów USB (`.pcapng`) — trzeba USBPcap
- systemowych DLL z folderu OEM (`kernel32`, `user32`…) — niepotrzebne do RE


## Metoda A — USB sniff (preferowana)

1. Zainstaluj [USBPcap](https://desowin.org/usbpcap/) + Wireshark.
2. Odłącz Fenrira / zostaw tylko King Ultra (dongle `3554:F54F` albo kabel `F54D`).
3. Start capture na filtrze USBPcap dla właściwego roota.
4. Filtr Wireshark przykładowy:
   ```
   usb.idVendor == 0x3554 && (usb.idProduct == 0xf54f || usb.idProduct == 0xf54d || usb.idProduct == 0xf510)
   ```
5. Odpal **OEM** `Mouse Drive Beta.exe`.
6. Jedna zmiana naraz, zapisz osobny plik:
   - `01-dpi-800-to-1600.pcapng`
   - `02-report-rate-1000-to-2000.pcapng`
   - `03-debounce-8-to-4.pcapng`
   - `04-motion-sync-on.pcapng`
   - itd.
7. W pakietach szukaj **URB_CONTROL** / `SET_REPORT` / `GET_REPORT` (Feature) albo interrupt OUT.
8. Różnice bajtów → `protocol.ts` `encodeCommand()`.

**Uwaga bezpieczeństwa:** nie ruszaj Fenrira (`33E4`) ani Wootinga (`31E3`) podczas sniffera.

## Metoda B — Ghidra / IDA na exe

1. Otwórz `bin/MouseDriveBeta.exe` w Ghidra.
2. Szukaj stringów `CS_UsbServer_SetCurrentConfig`, `ReadReportRate`, `ReadCurrentDPI`.
3. XRef → funkcje budujące bufor przed `WriteFile` / HID write.
4. Odtwórz layout pakietu (często: reportId + cmd + payload + checksum).

To wolniejsze niż sniff, ale pomaga gdy pakiety są szyfrowane / trudne do odróżnienia.

## Metoda C — nie: klik w naszym WebHID

Nasza apka ma whitelist i stub `encodeCommand() → null`, więc **nie wyśle** komend do urządzenia. Sniff trzeba robić na **OEM**.

## API surface (z stringów exe)

Zobacz `extracted/hidusb-api-exports.txt`. Kluczowe:

- `CS_UsbServer_ReadConfig` / `SetCurrentConfig`
- `CS_UsbServer_ReadCurrentDPI` / buffer DPI helpers
- `CS_UsbServer_ReadReportRate`
- `CS_UsbServer_ReadBatteryLevel`
- `CS_UsbServer_SetLongRangeMode` / `GetLongRangeMode`
- `CS_UsbServer_EnterDonglePair*`
- `CS_UsbServer_SetClearSetting`
- `CS_UsbFinder_ReadWriteDeviceData` / `WriteDeviceData`

## Następny krok w kodzie

Po pierwszym udanym sniffie DPI:

1. Wpisz bajty do `web-app/src/devices/redragon-king-ultra/protocol.ts`
2. `encodeCommand({ op: 'set_dpi', ... })` zwraca `{ reportId, data }`
3. WebHID `sendFeatureReport` zaczyna działać end-to-end
