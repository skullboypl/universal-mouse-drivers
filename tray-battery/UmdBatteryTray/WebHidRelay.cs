using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

/// <summary>
/// When the browser holds exclusive WebHID, it POSTs battery here so the tray
/// keeps showing %. After the feed goes stale, the tray reclaims native HID.
/// </summary>
internal sealed class WebHidRelay
{
    private static readonly TimeSpan StaleAfter = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan YieldGrace = TimeSpan.FromSeconds(20);

    private readonly object _gate = new();
    private DateTimeOffset _webOwnsUntil = DateTimeOffset.MinValue;
    private BatteryReading? _reading;
    private string? _deviceLabel;
    private string? _deviceKey;

    public bool WebOwnsHid
    {
        get
        {
            lock (_gate) return DateTimeOffset.UtcNow < _webOwnsUntil;
        }
    }

    public BatteryReading? Reading
    {
        get
        {
            lock (_gate)
            {
                if (DateTimeOffset.UtcNow >= _webOwnsUntil) return null;
                return _reading;
            }
        }
    }

    public string? DeviceLabel
    {
        get
        {
            lock (_gate)
            {
                if (DateTimeOffset.UtcNow >= _webOwnsUntil) return null;
                return _deviceLabel;
            }
        }
    }

    public string? DeviceKey
    {
        get
        {
            lock (_gate)
            {
                if (DateTimeOffset.UtcNow >= _webOwnsUntil) return null;
                return _deviceKey;
            }
        }
    }

    /// <summary>Browser is about to open WebHID — release native handles.</summary>
    public void Yield()
    {
        lock (_gate)
        {
            _webOwnsUntil = DateTimeOffset.UtcNow + YieldGrace;
        }
    }

    public void Push(int percent, bool charging, string? deviceKey, string? deviceLabel)
    {
        var clamped = Math.Max(0, Math.Min(100, percent));
        var status = charging
            ? (clamped >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
            : BatteryStatus.Discharging;

        lock (_gate)
        {
            _reading = new BatteryReading(Math.Max(clamped, 1), status);
            if (!string.IsNullOrWhiteSpace(deviceKey))
                _deviceKey = deviceKey.Trim();
            if (!string.IsNullOrWhiteSpace(deviceLabel))
                _deviceLabel = deviceLabel.Trim();
            _webOwnsUntil = DateTimeOffset.UtcNow + StaleAfter;
        }
    }

    public void Release()
    {
        lock (_gate)
        {
            _webOwnsUntil = DateTimeOffset.MinValue;
            _reading = null;
            // Keep last label briefly? Clear so UI falls back to native.
            _deviceLabel = null;
            _deviceKey = null;
        }
    }
}
