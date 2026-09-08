using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// Phase A: detect OpenMouse-catalog HID devices. Battery % is unknown until
/// a per-protocol reader is wired (Phase B+ / 2C roadmap).
/// </summary>
internal sealed class OpenMouseCommunityBatteryReader : IDisposable
{
    private HidDevice? _device;
    private string? _deviceLabel;

    public bool IsConnected => _device is not null;

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int vendorId, int productId)
    {
        Disconnect();

        HidDevice? found = null;
        foreach (var d in DeviceList.Local.GetHidDevices(vendorId, productId))
        {
            found = d;
            break;
        }

        if (found is null)
        {
            throw new InvalidOperationException(
                $"No OpenMouse community device found ({vendorId:X4}:{productId:X4}).");
        }

        _device = found;
        string name;
        try { name = found.GetProductName() ?? "OpenMouse device"; }
        catch { name = "OpenMouse device"; }
        _deviceLabel = $"{name} ({found.VendorID:X4}:{found.ProductID:X4}) · battery n/a";
    }

    /// <summary>Placeholder until protocol-specific readers land.</summary>
    public BatteryReading ReadBattery()
    {
        if (_device is null)
            throw new InvalidOperationException("Device not connected.");
        return new BatteryReading(0, BatteryStatus.Unknown);
    }

    public void Disconnect()
    {
        _device = null;
        _deviceLabel = null;
    }

    public void Dispose() => Disconnect();
}
