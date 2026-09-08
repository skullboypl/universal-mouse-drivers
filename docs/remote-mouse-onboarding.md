# Zdalne dodawanie myszek (bez sprzętu u Ciebie)

**Status:** plan (2026-08-13) — jeszcze nie wdrożony  
**Cel:** dodać SKU do UMD (`web/src/devices/…` + opcjonalnie tray), gdy mysz fizycznie jest u wolontariusza / klienta, a nie u Ciebie.

> **Uwaga:** AI / Cursor **nie steruje** czyimś PC-em bezpośrednio. „Komunikacja z nimi” = oni uruchamiają u siebie narzędzie, które zbiera logi / wykonuje **bezpieczną, wersjonowaną** listę probe’ów i wysyła artefakty do Ciebie (ZIP / PR / Discord). Ty (lub agent lokalnie) analizujesz i kodujesz driver.

---

## 1. Co działa bez myszy u Ciebie

| Źródło | Co daje | Limit |
|--------|---------|--------|
| OEM installer / `.exe` / `Config.ini` / `driver_sensor.h` | VID/PID, DPI grades, stringi API, czasem layout flash | Bez sniffu często brak dokładnych bajtów Feature report |
| Screenshoty OEM UI | Zakres funkcji (DPI, Hz, LOD, przyciski, sleep…) | Nie protokół |
| USBPcap / Wireshark u wolontariusza | Realne TX/RX przy jednej zmianie w OEM | Wymaga Windows + admin + czysta sesja |
| WebHID / native HID probe (nasza mini-apka / skrypt) | Deskryptory, report IDs, usage pages, round-trip po znanym szkielecie | Niebezpieczne write’y bez mapy flash |
| Tray battery (jeśli ten sam chipset) | Osobny kanał baterii | Nie zastępuje protokołu konfiguracji |

**Zasada izolacji SKU:** nowa mysz = nowy folder `web/src/devices/mice/<brand>/<model>/`. Nie importować `protocol` / `actions` / `flashIndex` z King Ultra ani Blitz Ultimate (patrz `LOCK.md`).

---

## 2. Pipeline (zalecany)

```
Intake → Offline RE → Capture pack → Decode → Stub driver → Guided probe → Live → Lock
```

### Etap 0 — Intake (15–30 min, bez HID)

Wolontariusz wypełnia checklistę (Discord / formularz / issue):

1. **Model** (pełna nazwa + SKU na pudełku), zdjęcie spodu (etykieta).
2. **VID:PID** wired + dongle + BT (Device Manager / USBDeview / `hidapitester`).
3. Link / plik **OEM drivera** (wersja).
4. System: Windows 10/11, Chrome (WebHID) dostępny?
5. Zgoda: logi HID mogą zawierać deskryptory urządzenia; **bez** nagrywania klawiatury / innych myszy.
6. Lista funkcji OEM (DPI stages, Hz, LOD, long distance, macro, LED…).

**Wyjście:** issue `device-intake/<slug>` + folder `Decompile/mice/<brand>/<model>/`.

### Etap 1 — Offline RE (Ty / agent, bez ich myszy)

1. Skopiować OEM do `Decompile/mice/<brand>/<model>/bin/`.
2. Wyciągnąć `Config.ini`, XML, `driver_sensor.h`, stringi (`CS_UsbServer_*` itd.).
3. Szkic `identity.ts` (VID/PID, status: `wip`), `defaults.ts` z DPI grades.
4. Hipoteza rodziny protokołu:
   - **ta sama rodzina co King/Blitz** (0xFF02, report 8, flash) → forkuje się szablon *bez* importu live LOCK,
   - **GWolves-like**, **HID++**, inny → osobny szkielet.
5. Lista `TODO-captures.md`: kolejność sesji (jedna zmiana = jeden plik).

### Etap 2 — Capture pack (wolontariusz)

Minimalny zestaw plików (nazewnictwo sztywne):

```
captures/
  00-idle-10s.pcapng
  01-dpi-stage0-change.pcapng
  02-polling-rate.pcapng
  03-lod.pcapng
  04-button-remap-btn4.pcapng   # jeśli da się w OEM
  05-sleep-or-power.pcapng
  NOTES.txt                     # co kliknął, wartości przed/po
```

Instrukcja lokalna (można skopiować z `Decompile/mice/redragon/king-ultra/captures/HOW-TO-CAPTURE.md`):

- Odłączyć inne myszy gamingowe.
- USBPcap + Wireshark, filtr `usb.idVendor == 0xXXXX`.
- Start → **jedna** zmiana w OEM → Stop → Save.
- ZIP → upload (Discord / GitHub release draft / `data/` poza gitem jeśli duże).

### Etap 3 — Decode → stub

1. Rozbiór pcap: Feature/OUT report ID, długość, checksum, adresy flash.
2. `protocol.ts` encode/decode + tabele adresów.
3. `driver.ts` read-back przed write; Mock UI równolegle.
4. WebHID whitelist tylko na VID/PID tej myszy.

### Etap 4 — Guided probe (tu wkracza „mini apka”)

Zamiast „AI steruje PC-em”, wolontariusz odpala **UMD Lab** (patrz §3):

1. Lab łączy się z myszą (WebHID lub lokalny bridge).
2. Pobiera **manifest sesji** (JSON z repo / CapRover): lista kroków tylko-do-odczytu, potem ostrożne write’y.
3. Każdy krok: TX/RX hex + screenshot UI Lab + potwierdzenie użytkownika („DPI LED zmienił się? tak/nie”).
4. Lab pakuje `session-YYYYMMDD.zip` → Ty wklejasz do analizy / PR.

### Etap 5 — Live + Lock

1. Catalog `status: 'live'`, seed store, SEO/FAQ jeśli publiczne.
2. Tray battery tylko jeśli protokół baterii znany i przetestowany.
3. Wpisać SKU do `web/src/devices/LOCK.md` gdy produkcyjnie stabilne.

---

## 3. Mini-apka u nich — „UMD Lab” (rekomendacja)

### Po co

- Mniej błędów niż ręczny Wireshark u laika.
- Powtarzalne sesje (ten sam skrypt u 3 osób z tą samą myszą).
- Bezpieczeństwo: **brak dowolnego remote code**; tylko podpisane / commitnięte playbooki.

### Co to NIE jest

- Nie TeamViewer / nie SSH do ich maszyny.
- Nie „Cursor łączy się z ich HID”.
- Nie auto-flash firmware OEM.

### Warianty (wybór)

| Wariant | Pros | Cons | Werdykt |
|---------|------|------|---------|
| **A. Strona `/lab` w umdrivers.com** (WebHID) | Zero instalacji, łatwy share link | Tylko Chrome/Edge; ograniczenia WebHID; trudniejszy pełny USB sniff | **MVP** |
| **B. Mały `UmdLab.exe`** (hidapi, jak `tools/*_hid_probe.py`) | Pełniejszy dostęp, logi jak lokalne probe’y | Code signing, SmartScreen, support Windows | **v2** gdy WebHID za mało |
| **C. Tylko checklist + USBPcap** | Zero kodu | Wysoki próg, brudne capy | Fallback zawsze |

**Rekomendacja startowa:** **A (WebHID Lab)** + fallback C; B gdy rodzina protokołu wymaga reportów niedostępnych z WebHID.

### Zakres MVP Lab (A)

1. **Connect** — picker HID z filtrem z intake (VID/PID z URL `?sku=`).
2. **Inspect** — collections, report IDs, product name (export JSON).
3. **Passive listen** — 10–30 s input reports (opcjonalnie).
4. **Playbook runner** — ładuje JSON:
   ```json
   {
     "sku": "acme-mouse-x",
     "version": 1,
     "steps": [
       { "id": "read-info", "op": "feature_get", "reportId": 8, "len": 17 },
       { "id": "dpi-read", "op": "vendor_txrx", "txHex": "...", "expectRx": true }
     ]
   }
   ```
5. **Confirm UI** — po kroku: Tak / Nie / Skip + notatka.
6. **Export ZIP** — `manifest.json` + `steps/*.json` (hex) + `device-info.json`.
7. Tryby: `read-only` (domyślny) vs `write-enabled` (checkbox + czerwone ostrzeżenie).

### Komunikacja „z agentem”

Praktyczny flow (bez magii):

1. Ty wrzucasz playbook do repo: `labs/playbooks/<sku>/vN.json`.
2. Wolontariusz otwiera `https://umdrivers.com/lab?sku=…&playbook=vN`.
3. Export wrzuca na Discord / otwiera PR z `Decompile/.../captures/lab-session-…/`.
4. Agent w Twoim Cursorze czyta ZIP i dopina `protocol.ts`.

Opcjonalnie później: endpoint `POST /api/lab/sessions` (auth token jednorazowy) — **nie** wymagane do startu.

---

## 4. Role i SLA

| Kto | Robi |
|-----|------|
| **Właściciel UMD (Ty)** | Priorytet SKU, review wire, merge, Lock, release |
| **Agent (Cursor u Ciebie)** | RE OEM, decode pcap/lab ZIP, kod drivera, playbooki |
| **Wolontariusz** | Intake, OEM capture / Lab, potwierdzenia UX, retest po buildzie |
| **Nie robi nikt zdalnie** | Ślepe write’y flash, firmware update, zmiany LOCKED SKU „przy okazji” |

Szacunek na „prosty klon rodziny King/Blitz”: **1–3 wieczory** przy dobrych capach.  
Nowa rodzina protokołu: **tygodnie**, zależnie od jakości OEM + Lab.

---

## 5. Checklist nowego SKU (kod)

- [ ] `Decompile/mice/<brand>/<model>/` + `captures/` + `NOTES`
- [ ] `web/src/devices/mice/<brand>/<model>/` — identity, protocol, buttons, defaults, driver, actions…
- [ ] Wpis w `registry.ts` (nie ruszać LOCKED)
- [ ] Mock działa bez urządzenia
- [ ] WebHID connect + read-back krytycznych pól
- [ ] Tray (opcjonalnie) osobny folder `Protocol/Mice/...`
- [ ] Seed / SEO / i18n po `live`
- [ ] `LOCK.md` gdy produkcja

---

## 6. Bezpieczeństwo i zaufanie

- Playbooki tylko z repo / signed URL; Lab pokazuje **pełny hex** przed write.
- Domyślnie read-only; write wymaga świadomej zgody na sesję.
- Nie logować innych urządzeń (filtr VID/PID).
- Nie prosić o hasła Windows / TeamViewer „żeby AI klikało”.
- Po sesji: wolontariusz może odinstalować Lab / wyczyścić authorized WebHID.

---

## 7. Roadmapa wdrożenia planu

| # | Deliverable | Priorytet |
|---|-------------|-----------|
| 1 | Ten dokument + szablon issue intake | **teraz** |
| 2 | Szablon `Decompile/mice/_template/` + `HOW-TO-CAPTURE.md` generyczny | P0 |
| 3 | Strona `/lab` (WebHID inspect + export JSON) | P0 |
| 4 | Playbook runner + ZIP export | P1 |
| 5 | `UmdLab.exe` (hidapi) jeśli WebHID nie wystarczy | P2 |
| 6 | Opcjonalny upload `POST /api/lab/sessions` | P3 |

---

## 8. Decyzja do potwierdzenia

Zanim kodujemy Lab:

1. **MVP = WebHID `/lab` + ZIP ręcznie**, czy od razu chcesz signed `UmdLab.exe`?
2. Pierwszy SKU-pilot zdalny (jaka mysz / u kogo)?
3. Kanał zwrotny artefaktów: Discord / GitHub issue / formularz na umdrivers.com?

Po Twoim OK → osobny implementation plan pod `/lab` (bez ruszania King Ultra / Blitz Ultimate wire).
