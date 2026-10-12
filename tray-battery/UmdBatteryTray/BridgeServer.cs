using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

internal sealed class BridgeServer : IDisposable
{
    private readonly HttpListener _listener = new();
    private readonly AppSettings _settings;
    private readonly Func<BatteryReading?> _getReading;
    private readonly Func<string?> _getDeviceLabel;
    private readonly Func<object> _getDevicesPayload;
    private readonly Func<string?, Task<object>> _setPreferredDevice;
    private readonly Action<AppSettings> _onSettingsChanged;
    private readonly Action _openSettings;
    private readonly Action _onWebHidYield;
    private readonly Action<int, bool, string?, string?> _onBatteryPush;
    private readonly Action _onWebHidRelease;
    private readonly Func<bool> _webOwnsHid;
    private CancellationTokenSource? _cts;
    private Task? _loop;

    /// <summary>
    /// Public HTTPS origins allowed to call this loopback bridge from the browser
    /// (Chrome Private Network Access / CORS).
    /// </summary>
    private static readonly HashSet<string> AllowedOrigins = new(StringComparer.OrdinalIgnoreCase)
    {
        "https://umdrivers.com",
        "https://www.umdrivers.com",
        "https://mouse.vxh.pl",
        "https://umd.skullmedia.pl",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    };

    public BridgeServer(
        AppSettings settings,
        Func<BatteryReading?> getReading,
        Func<string?> getDeviceLabel,
        Func<object> getDevicesPayload,
        Func<string?, Task<object>> setPreferredDevice,
        Action<AppSettings> onSettingsChanged,
        Action openSettings,
        Action onWebHidYield,
        Action<int, bool, string?, string?> onBatteryPush,
        Action onWebHidRelease,
        Func<bool> webOwnsHid)
    {
        _settings = settings;
        _getReading = getReading;
        _getDeviceLabel = getDeviceLabel;
        _getDevicesPayload = getDevicesPayload;
        _setPreferredDevice = setPreferredDevice;
        _onSettingsChanged = onSettingsChanged;
        _openSettings = openSettings;
        _onWebHidYield = onWebHidYield;
        _onBatteryPush = onBatteryPush;
        _onWebHidRelease = onWebHidRelease;
        _webOwnsHid = webOwnsHid;
        _listener.Prefixes.Add($"http://127.0.0.1:{AppConstants.BridgePort}/");
    }

    public void Start()
    {
        try
        {
            _listener.Start();
        }
        catch
        {
            return;
        }

        _cts = new CancellationTokenSource();
        _loop = Task.Run(() => ListenLoop(_cts.Token));
    }

    private async Task ListenLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _listener.IsListening)
        {
            HttpListenerContext ctx;
            try
            {
                ctx = await _listener.GetContextAsync().WaitAsync(ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch
            {
                continue;
            }

            _ = Task.Run(() => Handle(ctx), ct);
        }
    }

    private async Task Handle(HttpListenerContext ctx)
    {
        try
        {
            var req = ctx.Request;
            var res = ctx.Response;
            WriteCors(req, res);

            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            var path = (req.Url?.AbsolutePath ?? "/").TrimEnd('/').ToLowerInvariant();
            if (path.Length == 0) path = "/";

            switch (path)
            {
                case "/health" when req.HttpMethod == "GET":
                    await WriteJson(res, new { ok = true });
                    break;

                case "/status" when req.HttpMethod == "GET":
                {
                    var reading = _getReading();
                    var devices = _getDevicesPayload();
                    await WriteJson(res, new
                    {
                        running = true,
                        version = UpdateService.CurrentVersion,
                        runAtStartup = _settings.RunAtStartup,
                        autoUpdate = _settings.AutoUpdateOnStart,
                        batteryPercent = reading?.Percent,
                        charging = reading is { Status: BatteryStatus.Charging or BatteryStatus.Full },
                        device = _getDeviceLabel(),
                        preferredDeviceKey = _settings.PreferredDeviceKey,
                        webHidRelay = _webOwnsHid(),
                        devices,
                    });
                    break;
                }

                // Browser about to open WebHID — tray must drop exclusive native handles.
                case "/hid/yield" when req.HttpMethod == "POST":
                    _onWebHidYield();
                    await WriteJson(res, new { ok = true, webHidRelay = true });
                    break;

                // Browser finished / closed WebHID — tray may reclaim native HID.
                case "/hid/release" when req.HttpMethod == "POST":
                    _onWebHidRelease();
                    await WriteJson(res, new { ok = true, webHidRelay = false });
                    break;

                // Live battery from WebHID while the browser holds the device.
                case "/battery/push" when req.HttpMethod == "POST":
                {
                    using var reader = new StreamReader(req.InputStream, req.ContentEncoding);
                    var body = await reader.ReadToEndAsync();
                    using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("percent", out var pEl)
                        || pEl.ValueKind is not (JsonValueKind.Number or JsonValueKind.String))
                    {
                        res.StatusCode = 400;
                        await WriteJson(res, new { error = "percent_required" });
                        break;
                    }

                    var percent = pEl.ValueKind == JsonValueKind.Number
                        ? pEl.GetInt32()
                        : int.TryParse(pEl.GetString(), out var parsed) ? parsed : -1;
                    if (percent is < 0 or > 100)
                    {
                        res.StatusCode = 400;
                        await WriteJson(res, new { error = "percent_range" });
                        break;
                    }

                    var charging = root.TryGetProperty("charging", out var cEl)
                        && cEl.ValueKind == JsonValueKind.True;
                    string? key = root.TryGetProperty("deviceKey", out var kEl) && kEl.ValueKind == JsonValueKind.String
                        ? kEl.GetString()
                        : null;
                    if (key is null
                        && root.TryGetProperty("vendorId", out var vEl)
                        && root.TryGetProperty("productId", out var pidEl)
                        && vEl.TryGetInt32(out var vid)
                        && pidEl.TryGetInt32(out var pid))
                    {
                        key = $"{vid:X4}:{pid:X4}";
                    }

                    string? label = root.TryGetProperty("deviceLabel", out var lEl) && lEl.ValueKind == JsonValueKind.String
                        ? lEl.GetString()
                        : null;

                    _onBatteryPush(percent, charging, key, label);
                    await WriteJson(res, new { ok = true, webHidRelay = true });
                    break;
                }

                case "/device" when req.HttpMethod == "POST":
                {
                    using var reader = new StreamReader(req.InputStream, req.ContentEncoding);
                    var body = await reader.ReadToEndAsync();
                    using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                    string? key = null;
                    if (doc.RootElement.TryGetProperty("key", out var k))
                    {
                        if (k.ValueKind == JsonValueKind.Null)
                            key = null;
                        else if (k.ValueKind == JsonValueKind.String)
                            key = k.GetString();
                    }

                    var result = await _setPreferredDevice(key);
                    await WriteJson(res, result);
                    break;
                }

                case "/startup" when req.HttpMethod == "POST":
                {
                    using var reader = new StreamReader(req.InputStream, req.ContentEncoding);
                    var body = await reader.ReadToEndAsync();
                    using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                    var enabled = doc.RootElement.TryGetProperty("enabled", out var e) && e.GetBoolean();
                    _settings.RunAtStartup = enabled;
                    StartupHelper.SetEnabled(enabled);
                    _settings.Save();
                    _onSettingsChanged(_settings);
                    await WriteJson(res, new { ok = true, runAtStartup = enabled });
                    break;
                }

                case "/open/windows-mouse" when req.HttpMethod == "POST":
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "main.cpl",
                        UseShellExecute = true,
                    });
                    await WriteJson(res, new { ok = true });
                    break;

                case "/open/settings" when req.HttpMethod == "POST":
                    _openSettings();
                    await WriteJson(res, new { ok = true });
                    break;

                default:
                    res.StatusCode = 404;
                    await WriteJson(res, new { error = "not_found" });
                    break;
            }
        }
        catch
        {
            try
            {
                ctx.Response.StatusCode = 500;
                ctx.Response.Close();
            }
            catch { /* ignore */ }
        }
    }

    private static void WriteCors(HttpListenerRequest req, HttpListenerResponse res)
    {
        var origin = req.Headers["Origin"];
        if (!string.IsNullOrEmpty(origin) && AllowedOrigins.Contains(origin))
            res.AddHeader("Access-Control-Allow-Origin", origin);
        else if (string.IsNullOrEmpty(origin))
            res.AddHeader("Access-Control-Allow-Origin", "*");

        res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.AddHeader("Access-Control-Allow-Headers", "Content-Type");
        // Chrome Private Network Access: public HTTPS (umdrivers.com) → http://127.0.0.1
        res.AddHeader("Access-Control-Allow-Private-Network", "true");
        res.AddHeader("Vary", "Origin");
    }

    private static async Task WriteJson(HttpListenerResponse res, object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var bytes = Encoding.UTF8.GetBytes(json);
        res.ContentType = "application/json; charset=utf-8";
        res.ContentLength64 = bytes.Length;
        await res.OutputStream.WriteAsync(bytes);
        res.Close();
    }

    public void Dispose()
    {
        try { _cts?.Cancel(); } catch { /* ignore */ }
        try { _listener.Stop(); } catch { /* ignore */ }
        try { _listener.Close(); } catch { /* ignore */ }
        _cts?.Dispose();
    }
}
