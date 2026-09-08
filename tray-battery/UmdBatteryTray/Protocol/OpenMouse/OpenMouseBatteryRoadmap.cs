namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// 2C roadmap: per-family battery readers under Protocol/OpenMouse/{Brand}/.
/// Phase A uses <see cref="OpenMouseCommunityBatteryReader"/> (n/a).
/// Next ports: Logitech HID++ (non-Superlight), Razer, Pulsar, Glorious, SteelSeries, …
/// Do not merge into King Ultra / Blitz Ultimate LOCK folders.
/// </summary>
internal static class OpenMouseBatteryRoadmap
{
    public static readonly string[] PlannedFamilies =
    [
        "Logitech",
        "Razer",
        "Pulsar",
        "Lamzu",
        "Glorious",
        "SteelSeries",
        "G-Wolves",
        "WLMouse",
        "ATK",
        "MCHOSE",
    ];
}
