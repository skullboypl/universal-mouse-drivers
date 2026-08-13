namespace UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;

/// <summary>Logitech PRO X SUPERLIGHT gen1 — LIGHTSPEED receiver (same as web-app identity).</summary>
internal static class SuperlightConstants
{
    public const int VendorId = 0x046D;

    /// <summary>Wireless receiver C547 (not Superlight 2).</summary>
    public const int PidReceiver = 0xC547;

    public static readonly int[] ProductIds = [PidReceiver];

    public const int UsagePageVendor = 0xFF00;
    public const int UsageLong = 0x02;

    public const byte ReportLong = 0x11;
    public const int LongReportSize = 20; // reportId + 19 payload

    /// <summary>Default paired mouse index on C547.</summary>
    public const byte DefaultDeviceIndex = 0x01;

    public const int FeatRoot = 0x0000;
    public const int FeatBatteryUnified = 0x1004;

    public const byte SwId = 0x0D;
}
