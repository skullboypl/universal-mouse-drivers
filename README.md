# Universal Mouse Drivers (UMD) × OpenMouse

**Official site:** [https://umdrivers.com](https://umdrivers.com)  
**Public source (AGPL-3.0):** [github.com/skullboypl/universal-mouse-drivers](https://github.com/skullboypl/universal-mouse-drivers)  
**OpenMouse:** [github.com/OpenMouse-Project](https://github.com/OpenMouse-Project)

Browser **WebHID** configurator for gaming mice + optional Windows **battery tray**.  
UMD ships **native** drivers for selected SKUs and uses **[OpenMouse mouse-protocol](https://github.com/OpenMouse-Project/mouse-protocol)** for community / multi-vendor HID support.

## Screenshots

### Web app (homepage)

![UMD homepage](docs/screenshots/umd-homepage.png)

### Windows Battery Tray

![UMD Battery Tray settings + widget](docs/screenshots/umd-battery-tray.png)

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).  
Network users of umdrivers.com can obtain corresponding source via this public GitHub repo (AGPL §13).

## Use the app

- Polish: [umdrivers.com/pl](https://umdrivers.com/pl)
- English: [umdrivers.com/en](https://umdrivers.com/en)
- Why UMD: [umdrivers.com/en/why](https://umdrivers.com/en/why)
- Battery Tray: [umdrivers.com/en/tray](https://umdrivers.com/en/tray)
- **Community (OpenMouse) mice:** [umdrivers.com/en/mice/openmouse](https://umdrivers.com/en/mice/openmouse)

## Supported mice

### Native UMD (full product UI)

| Mouse | Status |
|--------|--------|
| Redragon King Ultra (M916OB-ULT) | Live |
| Rampage Blitz Ultimate | Live |
| G-Wolves Fenrir Max 8K | WIP |
| Logitech PRO X SUPERLIGHT (gen1) | WIP |

### OpenMouse community

Hundreds of VID:PID pairs from OpenMouse `SUPPORTED_HID_FILTERS` (Razer, Pulsar, Glorious, SteelSeries, Lamzu, …). Browse and filter on the [Community hub](https://umdrivers.com/en/mice/openmouse). Feature depth follows each OpenMouse client. Tray enumerates community devices; battery readers land per protocol family over time.

Want your mouse listed? Open a **[Device request](https://github.com/skullboypl/universal-mouse-drivers/issues/new?template=device_request.yml)** issue.

## Feedback

| Channel | Use for |
|---------|---------|
| **[GitHub Issues](https://github.com/skullboypl/universal-mouse-drivers/issues)** | Bugs, features, device requests |
| **[Discussions](https://github.com/skullboypl/universal-mouse-drivers/discussions)** | Questions, tips |
| **Website contact** | [umdrivers.com/#contact](https://umdrivers.com/pl#contact) |
| **Email** | [github@skullmedia.pl](mailto:github@skullmedia.pl?subject=UMD%20feedback) |

### Before opening an issue

1. Try https://umdrivers.com in **Chrome or Edge**
2. Close OEM software that may lock HID
3. Note model + connection (wired / dongle)

## Stack

| Piece | Path |
|--------|------|
| Next.js app | [`web/`](web/) |
| CapRover | [`captain-definition`](captain-definition) + [`Dockerfile`](Dockerfile) → [`CAPROVER.md`](CAPROVER.md) |
| Battery tray | [`tray-battery/`](tray-battery/) |

## Dev

```bash
cd web
npm install
npm run generate:openmouse-catalog
npm run dev
```

## Tray (Windows)

```powershell
cd tray-battery
.\build.ps1
.\sign.ps1   # EV code signing — keep certs out of git
```

## CapRover

See **[CAPROVER.md](CAPROVER.md)**. Prefer this public repo as deploy source; secrets only in CapRover env.

## Credits

- **SkullMedia / UMD** — product shell, native OEM reverse engineering, tray  
- **[OpenMouse Project](https://github.com/OpenMouse-Project)** — multi-vendor WebHID protocol library  

Copyright © 2026 SkullMedia Artur Spychalski
