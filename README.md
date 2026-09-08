# Universal Mouse Drivers (UMD) × OpenMouse

**Live app:** [https://umdrivers.com](https://umdrivers.com)  
**Public source (AGPL-3.0):** [github.com/skullboypl/universal-mouse-drivers](https://github.com/skullboypl/universal-mouse-drivers)  
**OpenMouse:** [github.com/OpenMouse-Project](https://github.com/OpenMouse-Project)

Browser **WebHID** configurator for gaming mice + optional Windows **battery tray**.  
UMD ships **native** drivers for selected SKUs and uses **[OpenMouse mouse-protocol](https://github.com/OpenMouse-Project/mouse-protocol)** for broader HID detection and OpenMouse-backed devices.

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).  
Network users of umdrivers.com can obtain corresponding source via the public GitHub repo above (AGPL §13).

## Stack

| Piece | Path |
|--------|------|
| Next.js app (i18n, WebHID UI) | [`web/`](web/) |
| CapRover | [`captain-definition`](captain-definition) + [`Dockerfile`](Dockerfile) → [`CAPROVER.md`](CAPROVER.md) |
| Battery tray (WinForms) | [`tray-battery/`](tray-battery/) |

## Supported mice

### Native UMD (full product UI)

| Mouse | Status |
|--------|--------|
| Redragon King Ultra (M916OB-ULT) | Live |
| Rampage Blitz Ultimate | Live |
| G-Wolves Fenrir Max 8K | WIP |
| Logitech PRO X SUPERLIGHT (gen1) | WIP |

### OpenMouse-backed

Connect whitelist and control path use OpenMouse `DEVICE_DRIVERS` / vendor filters (Logitech, Razer, Pulsar, G-Wolves, Glorious, SteelSeries, Wooting, …). Feature depth follows each OpenMouse client. Tray battery remains **native UMD mice only** in v1.

## Dev

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:3000. Admin is **local `next dev` only**.

## Tray (Windows)

```powershell
cd tray-battery
.\build.ps1
.\sign.ps1   # EV code signing — keep certs out of git
```

## CapRover

See **[CAPROVER.md](CAPROVER.md)**. Deploy from this public repo; secrets stay in CapRover env only.

## Contributing / new mice

- Native SKU isolation: [`web/src/devices/README.md`](web/src/devices/README.md) + [`LOCK.md`](web/src/devices/LOCK.md)
- Broader HID protocols: contribute upstream to [OpenMouse mouse-protocol](https://github.com/OpenMouse-Project/mouse-protocol)

## Credits

- **SkullMedia / UMD** — product shell, native OEM reverse engineering, tray  
- **[OpenMouse Project](https://github.com/OpenMouse-Project)** — multi-vendor WebHID protocol library  

Copyright © 2026 SkullMedia Artur Spychalski
