# Redragon King Ultra Web Driver - Design Spec

**Date:** 2026-08-09  
**Status:** Approved (user: proceed to completion)  
**Product:** Web configurator for Redragon King Ultra (M916OB-ULT), path to multi-device platform

## Goals

1. **Communication first** - real device control via WebHID (+ optional Windows bridge).
2. **Better UI** - Wooting-like modern web UI, Redragon red accent (not PNG clone of OEM exe).
3. **Feature parity** with OEM PC driver screens: Home, Buttons, Sensor, Macro, Settings.
4. **Redragon King Ultra first**; later expand the same UMD app to other mice we still have hardware for (Blitz deferred - no unit on hand).
5. **Ship UI + Mock now**; reverse protocol on live hardware in parallel (target only King Ultra).

## Non-goals (v1)

- Pixel-perfect clone of OEM skins
- Supporting Fenrir / Wooting / other HID devices in filters
- Full firmware flasher until protocol known (UI stub OK)
- Mobile-first (desktop Chrome/Edge primary)

## Hardware identity

| Role | VID | PID | Notes |
|------|-----|-----|-------|
| Vendor | `0x3554` | - | OEM family (Config base64 `Redragon3554`) |
| Mouse (wired/BT variants) | `0x3554` | `0xF54D` | From Config `M_PID` |
| Dongle / wireless | `0x3554` | `0xF54F`, `0xF510` | Observed online: `3554:F54F` |

**Hard whitelist:** only these IDs. Never open `33E4:3717` (Fenrir) or `31E3:1402` (Wooting).

Device defaults from OEM `Config.ini`:

- DPI grades: 800, 1600, 2400, 3200, 6400, 26000, 30000 (max grade 7)
- DPI range: 50–30000 step 50
- Report rates: 125…8000 Hz
- Debounce default: 8 ms
- Sensor: PAW3950 family
- DisplayLight=0 (no dedicated Light tab in OEM nav)
- Profiles: 1–4
- Buttons shown in UI: 6 primary (full KeyParam list larger for advanced)

## Architecture

```
UI (React pages)
  → DeviceSession (connection, battery, profile, dirty/sync)
    → KingUltraDriver (feature API)
      → Transport: WebHidTransport | MockTransport | BridgeTransport
```

- **WebHID** primary (Wooting model), HTTPS or localhost.
- **MockTransport** for UI development without writes.
- **BridgeTransport** - small local Windows service later if WebHID cannot cover pairing/boot/update.

### Multi-device readiness

```
src/devices/
  registry.ts                 # id → driver factory
  redragon-king-ultra/
    identity.ts               # VID/PID, defaults
    driver.ts                 # feature API
    protocol.ts               # report encode/decode (filled via RE)
```

## UI / screens

**Look:** dark technical shell, generous spacing, clear hierarchy, accent `#E01E22` / `#FF0400` family. No OEM hazard stripes required.

| Route | Purpose |
|-------|---------|
| `/` | Connect / device card (King-Ultra) |
| `/device/buttons` | Profile, button map 1–6, debounce, restore/import/export |
| `/device/sensor` | DPI stages, report rate, LOD, peak performance, ripple / angle snap / motion sync, mode |
| `/device/macro` | Macro list, key events, record, delay/cycle options, save |
| `/device/settings` | Language, FW versions, pairing, sleep, long distance, run on boot (bridge), Windows mouse props link |

Nav: Home(device) · Sensor · Macro · Settings (Buttons is home workspace after connect - same as OEM house icon → button map).

## Data flow

1. User clicks Connect → `navigator.hid.requestDevice({ filters })`.
2. Session opens device, claims vendor interface, reads state (or mock seed).
3. UI edits update local draft state; Save/Apply calls driver methods → transport feature reports.
4. Disconnect / devicegone resets session.

Import/export: JSON profiles (v1), binary OEM format later if sniffed.

## Error handling

- Unsupported browser → clear CTA (Chrome/Edge)
- No device / wrong device → do not claim others
- Timeout / offline wireless → banner “move mouse / check dongle”
- Write failure → toast + keep draft; never silent fail
- Multi-device same VID/PID → ask user to keep one (OEM dialog parity)

## Reverse engineering plan

1. UI + Mock complete.
2. USBPcap/Wireshark while OEM driver changes DPI / report rate / key bind - **only** on `3554:F54F|F54D|F510`.
3. Map report IDs → `protocol.ts`.
4. Swap Mock → WebHID for each command as verified.
5. Bridge only for gaps (pairing tool, boot helper, FW).

## Testing

- Unit: protocol encode/decode, profile JSON
- Manual: Mock tour of all tabs
- Manual hardware: connect whitelist, read battery/FW when known, one safe write (e.g. DPI) after sniff

## Success criteria v1

- [ ] Modern UI covers all OEM feature surfaces
- [ ] Mock fully interactive
- [ ] WebHID connect limited to King Ultra IDs
- [ ] Driver API stable for Rampage second device later
- [ ] Docs for sniff → protocol fill-in
