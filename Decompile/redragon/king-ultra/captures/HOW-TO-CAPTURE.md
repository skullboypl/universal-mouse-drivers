# Capture King Ultra HID (USBPcap + Wireshark)

## Status

- USBPcap 1.5.4 zainstalowany (`C:\Program Files\USBPcap`)
- Po pierwszej instalacji zwykle potrzebny **restart PC** (driver `USBPcap` musi wstać)

## Kroki

1. Zrestartuj Windows (jeśli capture devices nie widać).
2. Odłącz Fenrira / inne myszy — zostaw King Ultra (`3554:F54F` lub `F54D`).
3. Odpal **Wireshark** → Capture → interfejsy `USBPcap1`, `USBPcap2`, …
4. Filtr wyświetlania po starcie:
   ```
   usb.idVendor == 0x3554
   ```
5. Start capture → odpal OEM **Mouse Drive Beta** → zmień **jedną** rzecz (np. DPI 800→1600).
6. Stop → Save as:
   `Decompile/redragon/king-ultra/captures/01-dpi-800-to-1600.pcapng`

## Alternatywa CLI (bez GUI)

```bat
"C:\Program Files\USBPcap\USBPcapCMD.exe" -d \\.\USBPcap1 -o "%CD%\01-dpi.pcap" -A
```

(Ctrl+C żeby zatrzymać; wybierz właściwy `USBPcapN` dla roota z myszką.)
