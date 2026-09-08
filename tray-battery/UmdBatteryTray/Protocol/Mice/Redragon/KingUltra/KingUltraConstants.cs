namespace UmdBatteryTray.Protocol.Mice.Redragon.KingUltra;

/// <summary>
/// Redragon King Ultra (M916OB-ULT) — OWNED HERE ONLY.
/// Do not import Rampage Blitz Ultimate PIDs or constants into this file.
/// </summary>
internal static class KingUltraConstants
{
    public const int VendorId = 0x3554;

    /// <summary>King Ultra corded.</summary>
    public const int PidCorded = 0xF54D;

    /// <summary>King Ultra 8K wireless dongle.</summary>
    public const int PidDongle8K = 0xF54F;

    /// <summary>King Ultra alternate wireless dongle.</summary>
    public const int PidDongleAlt = 0xF510;

    public static readonly int[] ProductIds =
    [
        PidDongle8K,
        PidDongleAlt,
        PidCorded,
    ];

    public static bool IsWirelessDongle(int productId) =>
        productId is PidDongle8K or PidDongleAlt;

    public const string DefaultLabel = "King Ultra";

    public const int UsagePageOem = 0xFF02;
    public const byte OutputReportId = 0x08;
    public const int OutputReportSize = 17; // reportId + 16 payload

    public const byte CmdEncryption = 1;
    public const byte CmdPcDriver = 2;
    public const byte CmdDeviceOnline = 3;
    public const byte CmdBatteryLevel = 4;
}
