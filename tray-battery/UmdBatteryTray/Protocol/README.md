# Tray Protocol layout

Mirrors `web/src/devices/`:

```
Protocol/
  Mice/
    Redragon/KingUltra/
    Rampage/BlitzUltimate/   # LIVE — LOCK.md
    Gwolves/FenrirMax/
    Logitech/ProXSuperlight/
    Logitech/ProX3Superstrike/ # constants + HID++ 0x1004 reader (wired C0A9 / receiver C54F) + decoder
  BatteryTypes.cs
  UmdDeviceInfo.cs
  UmdDeviceEnumerator.cs
  UmdBatteryReader.cs        # facade only — no SKU wire constants
```

**Rule:** King Ultra and Blitz Ultimate must not share constants or readers.
Each SKU owns its VID/PID list and battery HID path.
