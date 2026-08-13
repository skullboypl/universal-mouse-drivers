namespace UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;

/// <summary>
/// Rampage Blitz Ultimate — OWNED HERE ONLY (LIVE / LOCKED in UMD web).
/// Do not import Redragon King Ultra PIDs or share readers with King Ultra.
/// Wire bytes must stay frozen unless explicitly unlocked.
/// </summary>
internal static class BlitzUltimateConstants
{
    public const int VendorId = 0x3554;

    /// <summary>Blitz Ultimate corded.</summary>
    public const int PidCorded = 0xF562;

    /// <summary>Blitz Ultimate wireless dongle.</summary>
    public const int PidDongle = 0xF563;

    public static readonly int[] ProductIds =
    [
        PidDongle,
        PidCorded,
    ];

    public static bool IsWirelessDongle(int productId) =>
        productId == PidDongle;

    public const string DefaultLabel = "Blitz Ultimate";

    public const int UsagePageOem = 0xFF02;
    public const byte OutputReportId = 0x08;
    public const int OutputReportSize = 17;

    public const byte CmdEncryption = 1;
    public const byte CmdPcDriver = 2;
    public const byte CmdDeviceOnline = 3;
    public const byte CmdBatteryLevel = 4;
}
