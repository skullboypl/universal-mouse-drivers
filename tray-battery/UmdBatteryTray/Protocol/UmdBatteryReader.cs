namespace UmdBatteryTray.Protocol;

/// <summary>
/// Multi-device battery facade: connects to the preferred VID:PID when set,
/// otherwise first available (King Ultra wireless first, then Fenrir).
/// </summary>
internal sealed class UmdBatteryReader : IDisposable
{
    private KingUltraBatteryReader? _king;
    private GwolvesBatteryReader? _fenrir;
    private UmdDeviceInfo? _active;

    public bool IsConnected => _active?.Kind switch
    {
        UmdDeviceKind.KingUltra => _king?.IsConnected == true,
        UmdDeviceKind.FenrirMax => _fenrir?.IsConnected == true,
        _ => false,
    };

    public string? DeviceLabel => _active?.Kind switch
    {
        UmdDeviceKind.KingUltra => _king?.DeviceLabel,
        UmdDeviceKind.FenrirMax => _fenrir?.DeviceLabel,
        _ => null,
    };

    public string? ActiveDeviceKey => _active?.Key;

    public UmdDeviceInfo? ActiveDevice => _active;

    /// <summary>Preferred key from settings (may not be currently plugged in).</summary>
    public string? PreferredDeviceKey { get; private set; }

    public void SetPreferredDeviceKey(string? key)
    {
        PreferredDeviceKey = string.IsNullOrWhiteSpace(key) ? null : key.Trim();
    }

    public IReadOnlyList<UmdDeviceInfo> ListAvailable() => UmdDeviceEnumerator.ListAvailable();

    public void Connect(string? preferredKey = null)
    {
        if (preferredKey is not null)
            SetPreferredDeviceKey(preferredKey);

        Disconnect();

        var available = ListAvailable();
        var target = UmdDeviceEnumerator.ResolvePreferred(available, PreferredDeviceKey)
            ?? throw new InvalidOperationException(
                "No UMD mouse found (King Ultra 3554:F54D/F54F/F510 or Fenrir Max 33E4:3717/3708). " +
                "Close Chrome WebHID / OEM apps.");

        try
        {
            ConnectTo(target);
        }
        catch (Exception firstErr)
        {
            // Preferred plugged but exclusive-open failed — try other available mice.
            Exception? last = firstErr;
            foreach (var alt in available.Where(d => d.Key != target.Key))
            {
                try
                {
                    ConnectTo(alt);
                    return;
                }
                catch (Exception ex)
                {
                    last = ex;
                }
            }

            throw new InvalidOperationException(
                $"Could not open {target.DisplayLabel}. Close Chrome WebHID / OEM apps. {last?.Message}",
                last);
        }
    }

    private void ConnectTo(UmdDeviceInfo target)
    {
        Disconnect();

        switch (target.Kind)
        {
            case UmdDeviceKind.KingUltra:
                _king = new KingUltraBatteryReader();
                _king.Connect(target.ProductId);
                _active = target;
                break;
            case UmdDeviceKind.FenrirMax:
                _fenrir = new GwolvesBatteryReader();
                _fenrir.Connect(target.ProductId);
                _active = target;
                break;
            default:
                throw new InvalidOperationException($"Unknown device kind: {target.Kind}");
        }
    }

    public BatteryReading ReadBattery()
    {
        return _active?.Kind switch
        {
            UmdDeviceKind.KingUltra when _king is not null => _king.ReadBattery(),
            UmdDeviceKind.FenrirMax when _fenrir is not null => _fenrir.ReadBattery(),
            _ => throw new InvalidOperationException("Device not connected."),
        };
    }

    public void Disconnect()
    {
        _king?.Dispose();
        _king = null;
        _fenrir?.Dispose();
        _fenrir = null;
        _active = null;
    }

    public void Dispose() => Disconnect();
}
