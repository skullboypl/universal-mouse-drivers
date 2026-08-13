# OMM 2.6.1749 — decompiled addresses (Superlight v1)

Źródło: `ilspycmd` → `netdecompile/` (managed WPF) + live probe `046D:C547`.
Native `logi::hidppio` jest w exe (C++/CLI), API wychodzi przez managed wrappery `FeatureXXXX`.

## Battery — Feature `0x1004` (decimal **4100**)

Z `OnboardMemoryManager.Controllers/Battery.cs`:

```csharp
if (await HasFeature(4100)) {           // 0x1004
  Feature1004 feature = GetFeature<Feature1004>();
  feature.GetCapabilities();            // fn 0
  BatteryStatus status = feature.GetStatus(); // fn 1
  Percent = status.state_of_charge;
  charging = status.charging_status != 0;
}
```

| Fn | OMM API | Live Superlight v1 |
|----|---------|-------------------|
| **0** | `GetCapabilities()` | `0F 03 00…` — **nie** procent |
| **1** | `GetStatus()` → `state_of_charge` | **`53` = 83%** (zgadza się z OMM UI) |
| 2 | ? | `00…` |
| ≥3 | — | HID++ error |

Solaar: `feature_request(UNIFIED_BATTERY, 0x10)` = function nibble **1** — to samo.

**Bug UMD (naprawiony):** wcześniej czytaliśmy fn0 jako % → fałszywe ~15%.

Priorytet OMM: `1004` → else `1001` (napięcie+krzywa) → else `1000`.

## DPI slots — Feature `0x8100` + table UI

OMM `DPITable.cs`:
- Combo „N gniazd” = liczba **kolejnych** `DPI.Enabled` od Order 0
- `Enabled = (table[i] != 0)` z `GetDpiTable()` (zawsze 5 wpisów)
- Profil sector (Solaar format): `[rate][defaultIdx][shiftIdx][5× LE u16 DPI…]`

Live Superlight v1 sector 1: `01 00 00 20 03 00 00 00 00…` → **[800, 0, 0, 0, 0]** → **1 gniazdo**.

UMD sync: `HidppClient.getOnboardDpiTable()` → `dpiStageCount` / `dpiStages[].enabled`.

OMM menu przy gnieździe DPI:
- **Aktualny DPI** → `8100` fn12 `SetActiveProfileResolution` (0-based index)
- **Domyślny** → profile byte[1] `resolution_default_index`
- **DPI Shift** → profile byte[2] `resolution_shift_index`
- **Resetuj** → przywróć ostatnio zsynchronizowaną wartość slotu

## Report rate

OMM profil: preferuje **`Feature8061`** (`SupportsExtendedReportRate`).
Superlight v1 live: **tylko `0x8060`** (8061 absent) — rate jest też w onboard profile `0x8100` sector data (`SetReportRate` na `_profile_data`).

Live `8060`: fn0 = bitmask, fn1 = current ms (1 → 1000 Hz), **fn2 = set** — ale w trybie onboard (`8100` fn2=1) fn2 zwraca HID++ error. Host mode (fn1←2) odblokowuje 8060.

**UMD zapis Hz** = patch byte[0] w sektorze profilu + CRC + write (jak OMM), bez przełączania na host. Live `8060` fn1 aktualizuje się po zapisie sektora.

## Profiles

Live Superlight: `profile_count=5` (sektory 1–5). Katalog flash @ **sektor 0** (wpisy `00 0N 01 00`, koniec `FF FF 00 00` + CRC).

Bez katalogu flash mysz ma tylko ROM `0x0101` → da się aktywować wyłącznie profil 1. UMD przy syncu dopisuje katalog 1..N.

- **GetActiveProfile** fn4 → u16 BE (`00 0N` flash lub ROM `01 0N`)
- **SetActiveProfile** fn3 → `00 0N` — wymaga **ważnego** sektora flash (CRC + L button); inaczej invalid_arg i zostaje ROM `0x0101`
- Po failed write: flash może być śmieciem (`0xFFFF` DPI) — UMD `ensureFlashProfileSector` przywraca factory dump przed switch/write
- Sync czyta **pełne** profile id (ROM `0x0101`), nie tylko low byte → flash 1

Solaar `write_sector`: fn6 startWrite → fn7 writeData×16 → fn8 endWrite; CRC-16/CCITT-FALSE BE na końcu sektora (255 B).

Live verified: patch rate=2 + dpi0=900 → odczyt zgodny, `8060` fn1=2.

## Onboard

- `Feature8100` — profiles, active profile, host mode
- `Feature8110` — Mouse Button Spy (highlight w OMM Assignments), **nie** źródło remapów
- Remapy = makra 4 B w sektorze profilu `8100` @ **offset 32** (Solaar / OMM `GetButtonFunctions`)
- Live Superlight v1 `button_count=5`: `80 01 00 01|02|04|08|10` → L / R / M / **Back** / **Forward**
- UMD: `getOnboardDpiTable().buttonMacros` + `decodeOnboardButtonMacro()`
- **L+R locked** (jak OMM). Factory dump po OMM restore: `captures/factory-profiles/` → `factoryProfiles.ts`
- „Przywróć domyślne” w UMD flashuje sektory 0–5 z tego dumpa.

## Decompile inventory

```
Decompile/mice/logitech/omm-2.6.1749/
  bin/OnboardMemoryManager_2.6.1749.exe
  netdecompile/                          # ilspycmd -p
    OnboardMemoryManager.Controllers/Battery.cs   ← SoC
    OnboardMemoryManager.Models/HIDMouse.cs       ← 2201/8100
    OnboardMemoryManager.Models/HIDProfile.cs     ← 8061/2201/profile
  NOTES-hidpp-features.md
  captures/
```

```powershell
# re-decompile
ilspycmd bin/OnboardMemoryManager_2.6.1749.exe -o netdecompile -p
python tools/logitech_superlight_hidpp_probe.py --features battery
```
