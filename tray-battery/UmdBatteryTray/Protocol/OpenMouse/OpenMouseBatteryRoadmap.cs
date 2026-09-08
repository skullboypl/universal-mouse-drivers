namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// Per-family battery under Protocol/OpenMouse/{Brand}/.
/// Today: G-Wolves + Logitech HID++ 0x1004 reuse via <see cref="OpenMouseCommunityBatteryReader"/>.
/// Still n/a until ported: Razer, Pulsar, Lamzu, Glorious, SteelSeries, WLMouse, ATK, MCHOSE, …
/// Do not merge into King Ultra / Blitz Ultimate LOCK folders.
/// </summary>
internal static class OpenMouseBatteryRoadmap
{
    public static readonly string[] LiveReuseFamilies =
    [
        "G-Wolves",
        "Logitech (HID++ 0x1004 when present)",
    ];

    public static readonly string[] PlannedFamilies =
    [
        "Razer",
        "Pulsar",
        "Lamzu",
        "Glorious",
        "SteelSeries",
        "WLMouse",
        "ATK",
        "MCHOSE",
    ];
}
