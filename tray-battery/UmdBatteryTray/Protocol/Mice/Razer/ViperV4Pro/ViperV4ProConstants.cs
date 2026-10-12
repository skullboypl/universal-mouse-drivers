namespace UmdBatteryTray.Protocol.Mice.Razer.ViperV4Pro;

/// <summary>
/// Razer Viper V4 Pro identity + control-channel facts (OpenRazer / web protocol.ts).
/// VID 1532, wired 00E5, HyperSpeed dongle 00E6. Feature report id 0, 90 bytes.
/// </summary>
internal static class ViperV4ProConstants
{
    public const int VendorId = 0x1532;
    public const int WiredProductId = 0x00E5;
    public const int DongleProductId = 0x00E6;

    public static readonly int[] ProductIds = [WiredProductId, DongleProductId];

    public const string DefaultLabel = "Razer Viper V4 Pro";

    public const byte ReportId = 0x00;
    public const int ReportLength = 90;

    public const byte StatusBusy = 0x01;
    public const byte StatusOk = 0x02;

    public const byte CmdClassPower = 0x07;
    public const byte CmdBatteryRead = 0x80;
    public const byte CmdChargingRead = 0x84;

    public const byte DefaultTxn = 0x1F;

    public static bool IsWirelessDongle(int productId) => productId == DongleProductId;
}
