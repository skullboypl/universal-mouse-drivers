# Tray Protocol layout

Mirrors `web/src/devices/`:

```
Protocol/
  Mice/
    Redragon/KingUltra/
    Rampage/BlitzUltimate/   # LIVE — LOCK.md
    Gwolves/FenrirMax/
    Logitech/ProXSuperlight/
  BatteryTypes.cs
  UmdDeviceInfo.cs
  UmdDeviceEnumerator.cs
  UmdBatteryReader.cs        # facade only — no SKU wire constants
```

**Rule:** King Ultra and Blitz Ultimate must not share constants or readers.
Each SKU owns its VID/PID list and battery HID path.
