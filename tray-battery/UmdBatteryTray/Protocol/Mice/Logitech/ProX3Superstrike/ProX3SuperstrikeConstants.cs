namespace UmdBatteryTray.Protocol.Mice.Logitech.ProX3Superstrike;

/// <summary>
/// PRO X3 SUPERSTRIKE identity and read-only HID++ facts. Verified on a physical
/// unit through the browser driver: protocol 4.2, Unified Battery 0x1004 fn1,
/// HID++ long reports (0x11) on the vendor collection FF43.
/// </summary>
internal static class ProX3SuperstrikeConstants
{
    public const int VendorId = 0x046D;
    public const int WiredProductId = 0xC0A9;
    public const int ReceiverProductId = 0xC54F;
    public const int FeatureUnifiedBattery = 0x1004;
    public const byte UnifiedBatteryGetStatusFunction = 1;
    public const byte WiredDeviceIndex = 0xFF;
    public const byte ReceiverDeviceIndex = 0x01;

    public static readonly int[] ProductIds = [WiredProductId, ReceiverProductId];

    public const string DefaultLabel = "PRO X3 SUPERSTRIKE";

    /// <summary>Vendor usage page of the HID++ collections (FF43:0301 / FF43:0302).</summary>
    public const int UsagePageVendor = 0xFF43;

    public const byte ReportLong = 0x11;
    public const int LongReportSize = 20; // reportId + 19 payload

    public const byte SwId = 0x0D;

    public static bool IsWirelessReceiver(int productId) => productId == ReceiverProductId;

    public static byte DeviceIndexFor(int productId) =>
        productId == WiredProductId ? WiredDeviceIndex : ReceiverDeviceIndex;
}
