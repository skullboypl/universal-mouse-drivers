namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// OpenMouse battery coverage in the tray (ported from @openmouse/protocol).
/// Finalmouse ULX is event-only (no stable query) - stays n/a.
/// Corsair / Fantech / Microsoft / Wooting / Zaunkoenig: OpenMouse reports null %.
/// </summary>
internal static class OpenMouseBatteryRoadmap
{
    public static readonly string[] LiveBatteryFamilies =
    [
        "G-Wolves (native Fenrir path + OpenMouse report-8)",
        "Logitech (HID++ 0x1004)",
        "VGN / Pulsar / ATK / Teevolution (report-8 cmd 0x04)",
        "ATK Bitmouse 0x373b (report-8 cmd 0x72)",
        "Dareu Jm (report-8 cmd 0x04)",
        "Lamzu / CompX / Glorious Classic (feature 0x83)",
        "K-snake X11 / Ajazz NJ07 (0x55/0xF0)",
        "SteelSeries (AA 01 / 92|D2)",
        "Razer (feature 0x07/0x80)",
        "Keychron Nape / M6",
        "WALLHACK M-001",
        "MCHOSE (inverted 0x11/0x06)",
        "Ninjutso (feature 6 cmd 0x12)",
        "Razer Viper V4 Pro (native)",
    ];

    public static readonly string[] NoBatteryInOpenMouse =
    [
        "Corsair",
        "Fantech",
        "Microsoft",
        "Wooting",
        "Zaunkoenig",
        "Finalmouse (event-driven ULX - no query)",
    ];
}
