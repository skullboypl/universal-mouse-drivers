# UMD Battery Tray

Windows system tray + optional desktop widget for battery level of UMD-supported mice. Native HID (HidSharp) - same King Ultra protocol as the WebHID app / `tools/king_ultra_hid_probe.py`. No browser required.

Independent of the Vite WebHID app (both talk to the mouse; close Chrome WebHID / OEM software if open fails).

## Supported now

| Device | VID:PID |
|--------|---------|
| Redragon King Ultra (M916OB-ULT) | `3554:F54D` corded · `3554:F54F` / `F510` dongle |

## Features

- Tray icon (battery / percent / both) with tooltip
- Optional always-on-top desktop widget (drag, opacity, size)
- Settings window (right-click tray)
- Poll interval 15–300 s (default 120)
- Single-file self-contained `.exe`

Settings: `%AppData%\UmdBatteryTray\settings.json`

## Run (dev)

```powershell
cd tray-battery\UmdBatteryTray
dotnet run
```

Double-click tray = refresh. Menu: **Refresh now**, **Show desktop widget**, **Settings…**, **Exit**.

## Build Release

```powershell
cd tray-battery
.\build.ps1
```

Output: `UmdBatteryTray\bin\Release\net8.0-windows\win-x64\publish\UmdBatteryTray.exe`

Requires .NET 8 SDK, Windows x64.

## EV code signing (CapRover download)

Same cert / timestamp / signtool as Fenrir Battery Tray:

```powershell
.\build.ps1
.\sign.ps1
```

Copies signed exe to `../data/downloads/UmdBatteryTray.exe`. Upload that file into CapRover Persistent Directory `/app/data/downloads/`. Public URL: `/api/downloads/UmdBatteryTray.exe`.

## Protocol notes

1. Opens OEM vendor channel (prefer usage page `FF02`, report id 8)
2. Handshake: encryption → PC driver on → online → battery (cmd `4`)
3. **No** `0x80` online bit in dataLen (F54F empty echoes if set)
4. Parse: percent + charging flag from battery payload

## License

MIT (shell adapted from Fenrir Battery Tray)
