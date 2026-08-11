# Analiza `extracted/` - King Ultra

Przejrzane: `Config.ini`, `driver_sensor.h`, Language, API stringi, res (struktura).

---

## 1. `Config.ini` - profil urządzenia (gold)

Zdekodowane Base64:

| Pole | Wartość |
|------|---------|
| VID | `0x3554` |
| M_PID (mysz) | `0xF54D` |
| D_PID (dongle) | `0xF54F`, `0xF510` |
| Sensor | **3950** (PAW3950) |
| MM | NRF52833 |
| DM | CX52650N |
| D8M | CH32V305 |
| CID | Redragon M916OB-ULT … |
| MID | 36 |
| Version | 1.0.0.43 |

DPI:

- max stages: **7** (`DPIMaxGrade`)
- default stage index: **3** (`DefaultDPI` - 1-based w OEM → stage 3 = 2400)
- grades: `800,1600,2400,3200,6400,26000,30000` (+ zapasowy `10000`)
- range: **50–30000 step 50**

Debounce default: **8 ms**

`KeyParamN = x,y, keyIndex, type, value, flags`

Mapowanie z `Language/0-English.xml` → KeyFunction:

| Param | x,y | idx | type | value | Funkcja |
|-------|-----|-----|------|-------|---------|
| 1 | 159,223 | 0x00 | 0x01 | 0x01 | Left |
| 2 | 43,186 | 0x01 | 0x01 | 0x02 | Right |
| 3 | 127,145 | 0x02 | 0x01 | 0x04 | Middle |
| 4 | 286,169 | 0x04 | 0x01 | 0x10 | Forward |
| 5 | 322,127 | 0x03 | 0x01 | 0x08 | Back |
| 6 | 313,240 | 0x0C | 0x02 | 0x01 | DPI Loop |
| 7 | 117,132 | 0x06 | 0x02 | 0x03 | DPI- (?) |
| 8+ | lista / UI | … | … | … | kolejne sloty |

Typy funkcji (z XML): `01` mouse btn, `02` DPI, `03` scroll H, `04` fire, `05` combo/media, `06` macro, `07` polling switch, `0A` DPI lock, `0B` scroll V, `00` disabled.

`SensorUI=7,1,0,2,3,7,0,1,0,6,0,0,1` - flagi UI sensora (max stages=7, LOD/mode/motion sync włączone w UI).  
`DisplayLight=0` - brak osobnej zakładki Light w nav.  
`BatteryParam` - krzywa mV → % (21 progów).

**Wniosek:** Config wystarczy na cały model danych UI. Nie zawiera bajtów USB.

---

## 2. `driver_sensor.h` - tabele DPI per sensor

Nagłówek **wspólny dla wielu myszy** fabryki, nie tylko King Ultra.

### Capability matrix (ważne dla 3950)

| Feature | Sensory ze wsparciem | King Ultra (3950)? |
|---------|----------------------|--------------------|
| Mode select (LP/HP/Corded) | 3395,3311,3370,3335,**3950** | **TAK** |
| LOD cal | 3395,3370,3399,3335,**3950** | **TAK** |
| Ripple | 3395,3311,3370,3335,**3950** | **TAK** |
| Angle snap (FixLine) | 3395,3311,3370,3335,**3950** | **TAK** |
| Motion sync | 3395,**3950** | **TAK** |
| Mousepad cal | 3395,3370 | **NIE** |

### Tabele `SENSOR_*_DPI_*`

Są mapy: **3335, 3325, 3104, 3212, 8920, 3311, 4090**.

**Brak `SENSOR_3950_DPI_*`.**  
Dla PAW3950 DPI idzie raczej liniowo z `DPIRange` (value/50 albo raw u16 w config blob), nie przez tę tablicę lookup.

Tabele = **jak DPI zamienić na bajt rejestru** dla starszych sensorów. Przy sniffie DPI na King Ultra spodziewaj się wartości zbliżonych do `dpi/50` albo LE u16, nie koniecznie `SENSOR_3335_*`.

---

## 3. Stringi / API (`hidusb-api-exports.txt`)

Transport: **`HidD_SetFeature`** + pole **`ReportId`** / `FeatureReportByteLength`  
→ WebHID `sendFeatureReport` / `receiveFeatureReport` to właściwa ścieżka.

Główny model zapisu:

1. UI zmienia pola → `BufferToDPI*` / `MacroKeyToBuffer` / …
2. **`CS_UsbServer_SetCurrentConfig`** (albo `WriteDeviceData`) pcha blob
3. Odczyt: `ReadConfig`, `ReadCurrentDPI`, `ReadReportRate`, `ReadBatteryLevel`, …

Pairing: `EnterDonglePair*` / `EnterPairByFeature`  
Long distance: `SetLongRangeMode`  
FW: `CS_UsbUpgrade_*`

Czyli protokół to raczej **duży config flash**, nie 20 małych komend - sniff przy „Save”/auto-apply pokaże 1–N Feature reports.

---

## 4. `Language/0-English.xml`

- Pełne etykiety UI (już częściowo w naszym i18n)
- **KeyFunction / SubKeyFunction** - oficjalna enumeracja akcji przycisków (do rozbudowy Buttons page)
- **DebounceTime** 0–20 ms (`value` = hex ms)
- Dongle LED colors per report rate (125=red … 4000=green)
- Opisy Mode/LOD/Motion sync

---

## 5. `res/`

Tylko skórka PNG (Home/Button/Sensor/Macro/Light/Setting/General/Calibration).  
Light assety są, ale `DisplayLight=0` - UI OEM ich nie pokazuje w nav.

---

## Co z tego wynika do WebDrivera

| Źródło | Użyć teraz | Potrzeba sniffera |
|--------|------------|-------------------|
| Config.ini | defaults, VID, DPI, keys, debounce | - |
| driver_sensor.h | whitelista feature’ów dla 3950 | mapa bajtów DPI 3950 |
| Language XML | i18n + lista akcji przycisków | - |
| API stringi | architektura Feature report + SetCurrentConfig | layout bufora |
| res/ | grafiki (już częściowo) | - |

**Nadal brakuje:** dokładnego layoutu Feature report (ReportId + kolejność pól w config). To tylko USB sniff albo Ghidra na `SetCurrentConfig`.
