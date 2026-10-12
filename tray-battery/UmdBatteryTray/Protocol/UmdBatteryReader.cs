using UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;
using UmdBatteryTray.Protocol.Mice.Logitech.ProX3Superstrike;
using UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;
using UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;
using UmdBatteryTray.Protocol.Mice.Razer.ViperV4Pro;
using UmdBatteryTray.Protocol.Mice.Redragon.KingUltra;
using UmdBatteryTray.Protocol.OpenMouse;

namespace UmdBatteryTray.Protocol;

/// <summary>
/// Multi-device battery facade: preferred VID:PID, else first available.
/// Order: native UMD SKU first, then OpenMouse codec fallback for the same
/// VID:PID (King → Blitz → Fenrir → Superlight → PRO X3 → Viper → OpenMouse).
/// </summary>
internal sealed class UmdBatteryReader : IDisposable
{
    private KingUltraBatteryReader? _king;
    private BlitzUltimateBatteryReader? _blitz;
    private GwolvesBatteryReader? _fenrir;
    private SuperlightBatteryReader? _superlight;
    private ProX3BatteryReader? _proX3;
    private ViperV4ProBatteryReader? _viper;
    private OpenMouseCommunityBatteryReader? _openMouse;
    private UmdDeviceInfo? _active;
    private bool _usingOpenMouseFallback;

    public bool IsConnected => _active?.Kind switch
    {
        UmdDeviceKind.KingUltra => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _king?.IsConnected == true,
        UmdDeviceKind.BlitzUltimate => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _blitz?.IsConnected == true,
        UmdDeviceKind.FenrirMax => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _fenrir?.IsConnected == true,
        UmdDeviceKind.Superlight => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _superlight?.IsConnected == true,
        UmdDeviceKind.ProX3Superstrike => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _proX3?.IsConnected == true,
        UmdDeviceKind.ViperV4Pro => _usingOpenMouseFallback
            ? _openMouse?.IsConnected == true
            : _viper?.IsConnected == true,
        UmdDeviceKind.OpenMouseCommunity => _openMouse?.IsConnected == true,
        _ => false,
    };

    public string? DeviceLabel
    {
        get
        {
            if (_usingOpenMouseFallback && _openMouse?.DeviceLabel is string om)
                return om;
            return _active?.Kind switch
            {
                UmdDeviceKind.KingUltra => _king?.DeviceLabel,
                UmdDeviceKind.BlitzUltimate => _blitz?.DeviceLabel,
                UmdDeviceKind.FenrirMax => _fenrir?.DeviceLabel,
                UmdDeviceKind.Superlight => _superlight?.DeviceLabel,
                UmdDeviceKind.ProX3Superstrike => _proX3?.DeviceLabel,
                UmdDeviceKind.ViperV4Pro => _viper?.DeviceLabel,
                UmdDeviceKind.OpenMouseCommunity => _openMouse?.DeviceLabel,
                _ => null,
            };
        }
    }

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
                "No UMD mouse found (King Ultra, Blitz Ultimate, Fenrir Max, Superlight, PRO X3 SUPERSTRIKE, " +
                "Viper V4 Pro, or OpenMouse community VID:PID). Close Chrome WebHID / G HUB / OMM / OEM apps.");

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

        if (target.Kind == UmdDeviceKind.OpenMouseCommunity)
        {
            ConnectOpenMouse(target);
            _active = target;
            _usingOpenMouseFallback = false;
            return;
        }

        Exception? nativeErr = null;
        try
        {
            ConnectNative(target);
            _active = target;
            _usingOpenMouseFallback = false;
            // Viper Connect already smoke-reads; extra check uses _active + _viper.
            if (target.Kind == UmdDeviceKind.ViperV4Pro)
                _ = ReadBatteryViaActiveBackend();
            return;
        }
        catch (Exception ex)
        {
            nativeErr = ex;
            ClearNativeReaders();
            _active = null;
        }

        try
        {
            ConnectOpenMouse(target);
            _active = target;
            _usingOpenMouseFallback = true;
            _ = ReadBatteryViaActiveBackend();
        }
        catch (Exception omErr)
        {
            Disconnect();
            throw new InvalidOperationException(
                $"Native battery failed for {target.DisplayLabel}, OpenMouse fallback also failed. " +
                $"{nativeErr?.Message} | {omErr.Message}",
                omErr);
        }
    }

    private void ConnectNative(UmdDeviceInfo target)
    {
        switch (target.Kind)
        {
            case UmdDeviceKind.KingUltra:
                _king = new KingUltraBatteryReader();
                _king.Connect(target.ProductId);
                break;
            case UmdDeviceKind.BlitzUltimate:
                _blitz = new BlitzUltimateBatteryReader();
                _blitz.Connect(target.ProductId);
                break;
            case UmdDeviceKind.FenrirMax:
                _fenrir = new GwolvesBatteryReader();
                _fenrir.Connect(target.ProductId);
                break;
            case UmdDeviceKind.Superlight:
                _superlight = new SuperlightBatteryReader();
                _superlight.Connect(target.ProductId);
                break;
            case UmdDeviceKind.ProX3Superstrike:
                _proX3 = new ProX3BatteryReader();
                _proX3.Connect(target.ProductId);
                break;
            case UmdDeviceKind.ViperV4Pro:
                _viper = new ViperV4ProBatteryReader();
                _viper.Connect(target.ProductId);
                break;
            default:
                throw new InvalidOperationException($"Unknown native device kind: {target.Kind}");
        }
    }

    private void ConnectOpenMouse(UmdDeviceInfo target)
    {
        _openMouse = new OpenMouseCommunityBatteryReader();
        _openMouse.Connect(target.VendorId, target.ProductId);
    }

    public BatteryReading ReadBattery()
    {
        if (_active is null)
            throw new InvalidOperationException("Device not connected.");

        try
        {
            return ReadBatteryViaActiveBackend();
        }
        catch (Exception nativeReadErr) when (!_usingOpenMouseFallback
            && _active.Kind != UmdDeviceKind.OpenMouseCommunity)
        {
            // Mid-session: native open worked earlier but battery stopped answering —
            // one-shot OpenMouse fallback for the same VID:PID.
            var target = _active;
            ClearNativeReaders();
            try
            {
                ConnectOpenMouse(target);
                _usingOpenMouseFallback = true;
                return ReadBatteryViaActiveBackend();
            }
            catch (Exception omErr)
            {
                Disconnect();
                throw new InvalidOperationException(
                    $"Battery read failed (native then OpenMouse). {nativeReadErr.Message} | {omErr.Message}",
                    omErr);
            }
        }
    }

    private BatteryReading ReadBatteryViaActiveBackend()
    {
        if (_usingOpenMouseFallback && _openMouse is not null)
            return _openMouse.ReadBattery();

        return _active?.Kind switch
        {
            UmdDeviceKind.KingUltra when _king is not null => _king.ReadBattery(),
            UmdDeviceKind.BlitzUltimate when _blitz is not null => _blitz.ReadBattery(),
            UmdDeviceKind.FenrirMax when _fenrir is not null => _fenrir.ReadBattery(),
            UmdDeviceKind.Superlight when _superlight is not null => _superlight.ReadBattery(),
            UmdDeviceKind.ProX3Superstrike when _proX3 is not null => _proX3.ReadBattery(),
            UmdDeviceKind.ViperV4Pro when _viper is not null => _viper.ReadBattery(),
            UmdDeviceKind.OpenMouseCommunity when _openMouse is not null => _openMouse.ReadBattery(),
            _ => throw new InvalidOperationException("Device not connected."),
        };
    }

    private void ClearNativeReaders()
    {
        _king?.Dispose();
        _king = null;
        _blitz?.Dispose();
        _blitz = null;
        _fenrir?.Dispose();
        _fenrir = null;
        _superlight?.Dispose();
        _superlight = null;
        _proX3?.Dispose();
        _proX3 = null;
        _viper?.Dispose();
        _viper = null;
    }

    public void Disconnect()
    {
        ClearNativeReaders();
        _openMouse?.Dispose();
        _openMouse = null;
        _active = null;
        _usingOpenMouseFallback = false;
    }

    public void Dispose() => Disconnect();
}
