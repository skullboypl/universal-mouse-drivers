namespace UmdBatteryTray.Protocol;

internal enum UmdDeviceKind
{
    KingUltra,
    BlitzUltimate,
    FenrirMax,
    Superlight,
    /// <summary>OpenMouse catalog VID:PID — battery may be n/a until family reader lands.</summary>
    OpenMouseCommunity,
}

/// <summary>One logical mouse (unique VID:PID) that UMD can read battery from.</summary>
internal sealed record UmdDeviceInfo(
    UmdDeviceKind Kind,
    int VendorId,
    int ProductId,
    string ProductName)
{
    /// <summary>Stable key for settings / bridge, e.g. <c>3554:F54F</c>.</summary>
    public string Key => $"{VendorId:X4}:{ProductId:X4}";

    public string DisplayLabel => $"{ProductName} ({Key})";
}
