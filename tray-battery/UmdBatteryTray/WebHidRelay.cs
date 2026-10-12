using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

/// <summary>
/// Browser WebHID handoff: brief pause after /hid/yield so Chrome can open,
/// then live % via /battery/push. Native HID resumes when the push feed goes stale
/// or /hid/release is called — Yield alone must NOT block native forever.
/// </summary>
internal sealed class WebHidRelay
{
    private static readonly TimeSpan PushStaleAfter = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan YieldPause = TimeSpan.FromSeconds(4);

    private readonly object _gate = new();
    private DateTimeOffset _pauseNativeUntil = DateTimeOffset.MinValue;
    private DateTimeOffset _pushFreshUntil = DateTimeOffset.MinValue;
    private BatteryReading? _reading;
    private string? _deviceLabel;
    private string? _deviceKey;

    /// <summary>True only while we have a fresh browser battery push.</summary>
    public bool HasFreshPush
    {
        get
        {
            lock (_gate) return _reading is not null && DateTimeOffset.UtcNow < _pushFreshUntil;
        }
    }

    /// <summary>Skip native open briefly after yield, or while a push feed is alive.</summary>
    public bool ShouldSkipNative
    {
        get
        {
            lock (_gate)
            {
                var now = DateTimeOffset.UtcNow;
                if (_reading is not null && now < _pushFreshUntil) return true;
                return now < _pauseNativeUntil;
            }
        }
    }

    public bool WebOwnsHid => HasFreshPush;

    public BatteryReading? Reading
    {
        get
        {
            lock (_gate)
            {
                if (_reading is null || DateTimeOffset.UtcNow >= _pushFreshUntil) return null;
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
                if (_reading is null || DateTimeOffset.UtcNow >= _pushFreshUntil) return null;
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
                if (_reading is null || DateTimeOffset.UtcNow >= _pushFreshUntil) return null;
                return _deviceKey;
            }
        }
    }

    /// <summary>Browser is about to open WebHID — pause native briefly (does not invent battery data).</summary>
    public void Yield()
    {
        lock (_gate)
        {
            _pauseNativeUntil = DateTimeOffset.UtcNow + YieldPause;
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
            _pushFreshUntil = DateTimeOffset.UtcNow + PushStaleAfter;
            _pauseNativeUntil = DateTimeOffset.MinValue;
        }
    }

    public void Release()
    {
        lock (_gate)
        {
            _pushFreshUntil = DateTimeOffset.MinValue;
            _pauseNativeUntil = DateTimeOffset.MinValue;
            _reading = null;
            _deviceLabel = null;
            _deviceKey = null;
        }
    }
}
