using HidSharp;
using UmdBatteryTray.Protocol;
using UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;
using UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;

namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// OpenMouse catalog devices: detect by VID:PID, then try family battery readers
/// where UMD already has a wire path (G-Wolves feature reports, Logitech HID++ 0x1004).
/// Other brands stay connected with battery n/a until Protocol/OpenMouse/{Brand}/ ports land.
/// </summary>
internal sealed class OpenMouseCommunityBatteryReader : IDisposable
{
    private enum Family
    {
        Placeholder,
        Gwolves,
        LogitechHidpp,
    }

    private Family _family = Family.Placeholder;
    private GwolvesBatteryReader? _gwolves;
    private SuperlightBatteryReader? _logitech;
    private HidDevice? _device;
    private string? _deviceLabel;

    public bool IsConnected => _family switch
    {
        Family.Gwolves => _gwolves?.IsConnected == true,
        Family.LogitechHidpp => _logitech?.IsConnected == true,
        _ => _device is not null,
    };

    public string? DeviceLabel => _family switch
    {
        Family.Gwolves => _gwolves?.DeviceLabel ?? _deviceLabel,
        Family.LogitechHidpp => _logitech?.DeviceLabel ?? _deviceLabel,
        _ => _deviceLabel,
    };

    public void Connect(int vendorId, int productId)
    {
        Disconnect();

        var entry = OpenMouseCatalog.Devices.FirstOrDefault(e =>
            e.VendorId == vendorId && e.ProductId == productId);
        var brand = entry.Brand ?? "";
        var nameHint = string.IsNullOrWhiteSpace(entry.Name) ? "OpenMouse device" : entry.Name;

        if (IsGwolves(vendorId, brand))
        {
            try
            {
                _gwolves = new GwolvesBatteryReader();
                _gwolves.Connect(productId);
                _family = Family.Gwolves;
                _deviceLabel = _gwolves.DeviceLabel;
                return;
            }
            catch
            {
                _gwolves?.Dispose();
                _gwolves = null;
            }
        }

        if (IsLogitech(vendorId, brand))
        {
            try
            {
                _logitech = new SuperlightBatteryReader();
                _logitech.Connect(productId);
                _family = Family.LogitechHidpp;
                _deviceLabel = _logitech.DeviceLabel;
                return;
            }
            catch
            {
                _logitech?.Dispose();
                _logitech = null;
            }
        }

        ConnectPlaceholder(vendorId, productId, brand, nameHint);
    }

    private void ConnectPlaceholder(int vendorId, int productId, string brand, string nameHint)
    {
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
        _family = Family.Placeholder;
        string name;
        try { name = found.GetProductName() ?? nameHint; }
        catch { name = nameHint; }
        var brandPrefix = string.IsNullOrWhiteSpace(brand) ? "" : $"{brand} · ";
        _deviceLabel =
            $"{brandPrefix}{name} ({found.VendorID:X4}:{found.ProductID:X4}) · battery n/a";
    }

    public BatteryReading ReadBattery()
    {
        return _family switch
        {
            Family.Gwolves when _gwolves is not null => _gwolves.ReadBattery(),
            Family.LogitechHidpp when _logitech is not null => _logitech.ReadBattery(),
            Family.Placeholder when _device is not null =>
                new BatteryReading(0, BatteryStatus.Unknown),
            _ => throw new InvalidOperationException("Device not connected."),
        };
    }

    public void Disconnect()
    {
        _gwolves?.Dispose();
        _gwolves = null;
        _logitech?.Dispose();
        _logitech = null;
        _device = null;
        _deviceLabel = null;
        _family = Family.Placeholder;
    }

    public void Dispose() => Disconnect();

    private static bool IsGwolves(int vendorId, string brand) =>
        vendorId == GwolvesConstants.VendorId
        || brand.Equals("G-Wolves", StringComparison.OrdinalIgnoreCase)
        || brand.Equals("GWolves", StringComparison.OrdinalIgnoreCase);

    private static bool IsLogitech(int vendorId, string brand) =>
        vendorId == SuperlightConstants.VendorId
        || brand.Equals("Logitech", StringComparison.OrdinalIgnoreCase);
}
