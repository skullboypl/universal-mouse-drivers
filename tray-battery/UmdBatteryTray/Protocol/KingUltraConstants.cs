namespace UmdBatteryTray.Protocol;

internal enum BatteryStatus
{
    Unknown = 0,
    Discharging = 1,
    Charging = 2,
    Full = 3,
}

internal readonly record struct BatteryReading(int Percent, BatteryStatus Status);

/// <summary>Redragon King Ultra (M916OB-ULT) - same whitelist as web-app identity.ts.</summary>
internal static class KingUltraConstants
{
    public const int VendorId = 0x3554;

    /// <summary>Corded mouse.</summary>
    public const int PidCorded = 0xF54D;

    /// <summary>8K wireless dongle.</summary>
    public const int PidDongle8K = 0xF54F;

    /// <summary>Alternate wireless dongle.</summary>
    public const int PidDongleAlt = 0xF510;

    public static readonly int[] ProductIds = [PidDongle8K, PidDongleAlt, PidCorded];

    public const int UsagePageOem = 0xFF02;
    public const byte OutputReportId = 0x08;
    public const int OutputReportSize = 17; // reportId + 16 payload

    public const byte CmdEncryption = 1;
    public const byte CmdPcDriver = 2;
    public const byte CmdDeviceOnline = 3;
    public const byte CmdBatteryLevel = 4;
}
