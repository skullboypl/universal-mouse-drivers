# Ghidra / .NET decompile

- Install: `C:\Tools\ghidra\ghidra_12.1.2_PUBLIC`
- Launch GUI: `C:\Tools\ghidra\ghidra_12.1.2_PUBLIC\ghidraRun-jdk21.bat` (forces JDK 21)
- Headless: `C:\Tools\ghidra\ghidra_12.1.2_PUBLIC\support\analyzeHeadless.bat` + `JAVA_HOME` = JDK 21
- Project: `Decompile/redragon/king-ultra/ghidra-project/KingUltra`
- Binary: `Decompile/redragon/king-ultra/bin/MouseDriveBeta.exe`

## Important finding

`MouseDriveBeta.exe` is a **.NET** app (`mscoree` / `BSJB`). Ghidra PE/x86 analysis of its IL methods is misleading.

Managed UI/API layer decompiles cleanly with ILSpy (`ICSharpCode.Decompiler`):

- Output: `extracted/ilspy-out/`
- Helper: `netdecompile/NetDump/`
- Real HID wire protocol lives in native **`HIDUsb.dll` / `HIDUsb32.dll`** via `[DllImport]` (`DriverLib.UsbServer`, `DriverLib.UsbFinder`, `DriverLib.DataParser`).

Use Ghidra on `HIDUsb*.dll` once located (install dir or runtime-extracted). For the EXE, prefer ILSpy/dnSpy.

After reboot (USBPcap) you can also capture; Ghidra does not need reboot.
