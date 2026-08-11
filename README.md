# Universal Mouse Drivers (UMD)

**Browser WebHID drivers for gaming mice** - configure DPI, buttons, polling rate and onboard profiles in Chrome / Edge. No heavy OEM installer.

### Use the app

**https://mouse.vxh.pl**

- Polish: [mouse.vxh.pl/pl](https://mouse.vxh.pl/pl)
- English: [mouse.vxh.pl/en](https://mouse.vxh.pl/en)
- Why UMD exists: [mouse.vxh.pl/pl/why](https://mouse.vxh.pl/pl/why)

---

## Supported mice

| Mouse | SEO page | Status |
|-------|----------|--------|
| **Redragon King Ultra** (M916OB-ULT) | [PL](https://mouse.vxh.pl/pl/mice/redragon-king-ultra) · [EN](https://mouse.vxh.pl/en/mice/redragon-king-ultra) | Beta |
| **G-Wolves Fenrir Max 8K** | [PL](https://mouse.vxh.pl/pl/mice/gwolves-fenrir-max) · [EN](https://mouse.vxh.pl/en/mice/gwolves-fenrir-max) | Beta |
| **Logitech PRO X SUPERLIGHT** (gen1) | [PL](https://mouse.vxh.pl/pl/mice/logitech-pro-x-superlight) · [EN](https://mouse.vxh.pl/en/mice/logitech-pro-x-superlight) | Beta |

Want your mouse on the list? Open a **[Device request](https://github.com/skullboypl/universal-mouse-drivers/issues/new?template=device_request.yml)** issue.

---

## Feedback

This repository is the **public feedback hub** for UMD (SEO + community).

| Channel | Use for |
|---------|---------|
| **[GitHub Issues](https://github.com/skullboypl/universal-mouse-drivers/issues)** | Bugs, feature ideas, device requests |
| **[Discussions](https://github.com/skullboypl/universal-mouse-drivers/discussions)** | Questions, tips, general chat |
| **Website contact** | [mouse.vxh.pl/#contact](https://mouse.vxh.pl/pl#contact) |
| **Email** | [github@skullmedia.pl](mailto:github@skullmedia.pl?subject=UMD%20feedback) |
| **TikTok** | [@skullboypl](https://www.tiktok.com/@skullboypl) |

### Before opening an issue

1. Try the live app: https://mouse.vxh.pl  
2. Use **Chrome or Edge** (desktop) over HTTPS / localhost  
3. Close OEM software (G HUB, OMM, vendor drivers) that may lock the HID device  
4. Note mouse model + how you connect (wired / dongle)

---

## What is UMD?

Universal Mouse Drivers is a **web configurator** for gaming mice:

- WebHID in the browser (Wooting-style model)
- Per-device protocol reverse engineering when OEM apps are closed / heavy
- One product shell for multiple brands
- Optional Windows battery tray helper (separate from this feedback repo)

Read more: **[Why UMD exists](https://mouse.vxh.pl/en/why)**

---

## FAQ (short)

**Do I need to install Windows software?**  
No for configuration - use Chrome/Edge. An optional tray helper exists only for system-tray battery.

**Is it safe?**  
UMD only opens whitelisted VID:PID pairs for the selected mouse. Other HID devices are not claimed.

**Where is the source of the web app?**  
Product site: https://mouse.vxh.pl — this GitHub repo is for **README, SEO discovery, and feedback**.

---

## License / copyright

Copyright © 2026 - SkullMedia Artur Spychalski  
Website: https://mouse.vxh.pl  
GitHub profile: https://github.com/skullboypl
