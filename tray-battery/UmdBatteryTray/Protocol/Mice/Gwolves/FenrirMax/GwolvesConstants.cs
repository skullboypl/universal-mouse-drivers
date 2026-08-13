namespace UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;

internal enum DongleCommand : byte
{
    BatteryLevel = 4,
}

/// <summary>G-Wolves Fenrir Max (OEM "Fenir Max") — same IDs as web-app profile.</summary>
internal static class GwolvesConstants
{
    public const int VendorId = 0x33E4;
    public const int FenrirMaxWirelessPid = 0x3717;
    public const int FenrirMaxWiredPid = 0x3708;

    public static readonly int[] ProductIds = [FenrirMaxWirelessPid, FenrirMaxWiredPid];

    public const byte FeatureReportId = 0;
    public const int FeatureReportSize = 64;
    public const byte HidAck = 0xA1;
}
