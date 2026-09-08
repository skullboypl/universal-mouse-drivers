using UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;
using UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;
using UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;
using UmdBatteryTray.Protocol.Mice.Redragon.KingUltra;
using UmdBatteryTray.Protocol.OpenMouse;

namespace UmdBatteryTray.Protocol;

/// <summary>
/// Multi-device battery facade: preferred VID:PID, else first available
/// (King → Blitz → Fenrir → Superlight → OpenMouse community).
/// </summary>
internal sealed class UmdBatteryReader : IDisposable
{
    private KingUltraBatteryReader? _king;
    private BlitzUltimateBatteryReader? _blitz;
    private GwolvesBatteryReader? _fenrir;
    private SuperlightBatteryReader? _superlight;
    private OpenMouseCommunityBatteryReader? _openMouse;
    private UmdDeviceInfo? _active;

    public bool IsConnected => _active?.Kind switch
    {
        UmdDeviceKind.KingUltra => _king?.IsConnected == true,
        UmdDeviceKind.BlitzUltimate => _blitz?.IsConnected == true,
        UmdDeviceKind.FenrirMax => _fenrir?.IsConnected == true,
        UmdDeviceKind.Superlight => _superlight?.IsConnected == true,
        UmdDeviceKind.OpenMouseCommunity => _openMouse?.IsConnected == true,
        _ => false,
    };

    public string? DeviceLabel => _active?.Kind switch
    {
        UmdDeviceKind.KingUltra => _king?.DeviceLabel,
        UmdDeviceKind.BlitzUltimate => _blitz?.DeviceLabel,
        UmdDeviceKind.FenrirMax => _fenrir?.DeviceLabel,
        UmdDeviceKind.Superlight => _superlight?.DeviceLabel,
        UmdDeviceKind.OpenMouseCommunity => _openMouse?.DeviceLabel,
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
                "No UMD mouse found (King Ultra, Blitz Ultimate, Fenrir Max, Superlight, " +
                "or OpenMouse community VID:PID). Close Chrome WebHID / G HUB / OMM / OEM apps.");

        try
        {
            ConnectTo(target);
        }
        catch (Exception firstErr)
        {
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
                $"Could not open {target.DisplayLabel}. Close Chrome WebHID / G HUB / OMM / OEM apps. {last?.Message}",
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
            case UmdDeviceKind.BlitzUltimate:
                _blitz = new BlitzUltimateBatteryReader();
                _blitz.Connect(target.ProductId);
                _active = target;
                break;
            case UmdDeviceKind.FenrirMax:
                _fenrir = new GwolvesBatteryReader();
                _fenrir.Connect(target.ProductId);
                _active = target;
                break;
            case UmdDeviceKind.Superlight:
                _superlight = new SuperlightBatteryReader();
                _superlight.Connect(target.ProductId);
                _active = target;
                break;
            case UmdDeviceKind.OpenMouseCommunity:
                _openMouse = new OpenMouseCommunityBatteryReader();
                _openMouse.Connect(target.VendorId, target.ProductId);
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
            UmdDeviceKind.BlitzUltimate when _blitz is not null => _blitz.ReadBattery(),
            UmdDeviceKind.FenrirMax when _fenrir is not null => _fenrir.ReadBattery(),
            UmdDeviceKind.Superlight when _superlight is not null => _superlight.ReadBattery(),
            UmdDeviceKind.OpenMouseCommunity when _openMouse is not null => _openMouse.ReadBattery(),
            _ => throw new InvalidOperationException("Device not connected."),
        };
    }

    public void Disconnect()
    {
        _king?.Dispose();
        _king = null;
        _blitz?.Dispose();
        _blitz = null;
        _fenrir?.Dispose();
        _fenrir = null;
        _superlight?.Dispose();
        _superlight = null;
        _openMouse?.Dispose();
        _openMouse = null;
        _active = null;
    }

    public void Dispose() => Disconnect();
}
