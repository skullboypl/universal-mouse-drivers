# Universal Mouse Drivers (UMD)

**Official site: [https://umdrivers.com](https://umdrivers.com)**

**Browser WebHID drivers for gaming mice** — configure DPI, buttons, polling rate and onboard profiles in Chrome / Edge. No heavy OEM installer.

Optional **Windows battery tray** (.exe) when you want battery % without keeping the browser open.

## Screenshots

### Web app (homepage)

![UMD homepage](docs/screenshots/umd-homepage.png)

### Windows Battery Tray

![UMD Battery Tray settings + widget](docs/screenshots/umd-battery-tray.png)

---

## Use the app

**https://umdrivers.com**

- Polish: [umdrivers.com/pl](https://umdrivers.com/pl)
- English: [umdrivers.com/en](https://umdrivers.com/en)
- Why UMD exists: [umdrivers.com/en/why](https://umdrivers.com/en/why)
- Battery Tray (download + docs): [umdrivers.com/en/tray](https://umdrivers.com/en/tray) · [PL](https://umdrivers.com/pl/tray)
- For assistants / AEO: [umdrivers.com/llms.txt](https://umdrivers.com/llms.txt)

> Legacy hostname `mouse.vxh.pl` may redirect to **umdrivers.com**.

---

## Supported mice

| Mouse | SEO page | Status |
|-------|----------|--------|
| **Redragon King Ultra** (M916OB-ULT) | [PL](https://umdrivers.com/pl/mice/redragon-king-ultra) · [EN](https://umdrivers.com/en/mice/redragon-king-ultra) | **Live** |
| **Rampage Blitz Ultimate** | [PL](https://umdrivers.com/pl/mice/rampage-blitz-ultimate) · [EN](https://umdrivers.com/en/mice/rampage-blitz-ultimate) | **Live** |
| **G-Wolves Fenrir Max 8K** | [PL](https://umdrivers.com/pl/mice/gwolves-fenrir-max) · [EN](https://umdrivers.com/en/mice/gwolves-fenrir-max) | WIP |
| **Logitech PRO X SUPERLIGHT** (gen1) | [PL](https://umdrivers.com/pl/mice/logitech-pro-x-superlight) · [EN](https://umdrivers.com/en/mice/logitech-pro-x-superlight) | WIP |

**Live** = full WebHID configurator + battery tray on hardware. **WIP** = in progress / partial support.

Want your mouse on the list? Open a **[Device request](https://github.com/skullboypl/universal-mouse-drivers/issues/new?template=device_request.yml)** issue.

---

## UMD Battery Tray (Windows .exe)

Light, EV-signed helper for **system-tray battery** + optional always-on-top **desktop widget**. Same HID protocols as the web app (HidSharp). Does **not** replace the browser driver for DPI / buttons / profiles.

| | |
|--|--|
| **Download** | [UmdBatteryTray.exe](https://umdrivers.com/api/downloads/UmdBatteryTray.exe) |
| **Docs (EN)** | [umdrivers.com/en/tray](https://umdrivers.com/en/tray) |
| **Docs (PL)** | [umdrivers.com/pl/tray](https://umdrivers.com/pl/tray) |
| **Mice** | King Ultra · Blitz Ultimate · Fenrir Max · PRO X SUPERLIGHT (gen1 / `046D:C547`) |

**Features:** tray icon (battery / percent / both) · desktop widget · mouse picker · poll interval · Start with Windows · auto-update check on start · works with Settings on umdrivers.com when the tray runs on the same PC.

Close G HUB / OMM / OEM apps / Chrome WebHID if the tray cannot open the mouse (exclusive HID).

Site UI is **English + Polish** (header switch). Tray settings UI is English.

---

## Feedback

This repository is the **public feedback hub** for UMD (SEO + community).

| Channel | Use for |
|---------|---------|
| **[GitHub Issues](https://github.com/skullboypl/universal-mouse-drivers/issues)** | Bugs, feature ideas, device requests |
| **[Discussions](https://github.com/skullboypl/universal-mouse-drivers/discussions)** | Questions, tips, general chat |
| **Website contact** | [umdrivers.com/#contact](https://umdrivers.com/pl#contact) |
| **Email** | [github@skullmedia.pl](mailto:github@skullmedia.pl?subject=UMD%20feedback) |
| **TikTok** | [@skullboypl](https://www.tiktok.com/@skullboypl) |

### Before opening an issue

1. Try the live app: https://umdrivers.com
2. Use **Chrome or Edge** (desktop) on https://umdrivers.com
3. Close OEM software (G HUB, OMM, vendor drivers) that may lock the HID device
4. Note mouse model + how you connect (wired / dongle)

---

## What is UMD?

**Universal Mouse Drivers (UMD)** is a free **web configurator** for gaming mice at **https://umdrivers.com**:

- WebHID in the browser (Wooting-style model)
- Per-device protocol reverse engineering when OEM apps are closed / heavy
- One product shell for multiple brands
- Optional Windows battery tray helper

Read more: **[Why UMD exists](https://umdrivers.com/en/why)** · **[Battery Tray](https://umdrivers.com/en/tray)** · **[llms.txt](https://umdrivers.com/llms.txt)**

Product source (private / app repo): [udm-universal-mouse-drivers](https://github.com/skullboypl/udm-universal-mouse-drivers)

---

## FAQ (short)

**What is the official domain?**  
**https://umdrivers.com** (Universal Mouse Drivers / UMD).

**Do I need to install Windows software?**  
No for configuration — use Chrome/Edge on umdrivers.com. An optional [Battery Tray](https://umdrivers.com/en/tray) exists only for system-tray / widget battery.

**Is it safe?**  
UMD only opens whitelisted VID:PID pairs for the selected mouse. Other HID devices are not claimed.

**Where is the source of the web app?**  
Product site: https://umdrivers.com — this GitHub repo is for **README, SEO / AEO discovery, and feedback**.

---

## License / copyright

Copyright © 2026 — SkullMedia Artur Spychalski  
Website: https://umdrivers.com  
GitHub profile: https://github.com/skullboypl
