using HidSharp;

namespace UmdBatteryTray.Protocol.Mice.Logitech.ProX3Superstrike;

/// <summary>
/// Native HID++ 2.0 battery reader for PRO X3 SUPERSTRIKE (wired 046D:C0A9,
/// LIGHTSPEED receiver 046D:C54F). Same wire format as the web driver: long
/// report 0x11 on the vendor collection (usage page FF43), feature 0x1004
/// fn1 GetStatus. Wired uses device index 0xFF, the receiver uses 0x01.
/// The exact collection is confirmed by a HID++ ping, not guessed from the
/// descriptor alone. Close G HUB / OMM / Chrome WebHID if the open fails.
/// </summary>
internal sealed class ProX3BatteryReader : IDisposable
{
    private HidStream? _stream;
    private string? _deviceLabel;
    private byte _deviceIndex = ProX3SuperstrikeConstants.ReceiverDeviceIndex;
    private int? _batteryFeatureIndex;

    public bool IsConnected => _stream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        var candidates = ListCandidates(preferredProductId);
        if (candidates.Count == 0)
            throw new InvalidOperationException(
                "No PRO X3 SUPERSTRIKE HID++ interface found (046D:C0A9 / C54F). Close G HUB / OMM / Chrome WebHID.");

        Exception? lastError = null;
        foreach (var device in candidates)
        {
            if (!device.TryOpen(out var stream))
            {
                lastError = new InvalidOperationException("Could not open the HID++ interface (exclusive open?).");
                continue;
            }

            stream.ReadTimeout = 400;
            stream.WriteTimeout = 400;
            _stream = stream;
            _deviceIndex = ProX3SuperstrikeConstants.DeviceIndexFor(device.ProductID);
            _batteryFeatureIndex = null;

            if (Request(0, 1, [0x00, 0x00, 0x88], timeoutMs: 700) is not null)
            {
                _deviceLabel =
                    $"{ProX3SuperstrikeConstants.DefaultLabel} ({device.VendorID:X4}:{device.ProductID:X4})";
                return;
            }

            // Wrong collection (or mouse asleep): try the next candidate.
            lastError = new InvalidOperationException("No HID++ reply on this interface.");
            _stream.Dispose();
            _stream = null;
        }

        throw new InvalidOperationException(
            "PRO X3 SUPERSTRIKE did not answer HID++ - wake the mouse and close G HUB / OMM / WebHID. " +
            lastError?.Message);
    }

    public BatteryReading ReadBattery()
    {
        if (_stream is null)
            throw new InvalidOperationException("Device not connected.");

        // Wake / verify link (Root.GetProtocolVersion ping)
        _ = Request(0, 1, [0x00, 0x00, 0x88], timeoutMs: 600);

        var featIdx = ResolveBatteryFeatureIndex();
        for (var attempt = 0; attempt < 6; attempt++)
        {
            var payload = Request(
                featIdx,
                ProX3SuperstrikeConstants.UnifiedBatteryGetStatusFunction,
                [],
                timeoutMs: 900);
            if (payload is null)
                continue;

            if (ProX3BatteryDecoder.Decode(payload) is BatteryReading reading)
                return reading;
        }

        throw new InvalidOperationException(
            "PRO X3 SUPERSTRIKE battery reply empty - wake the mouse / move it, then refresh.");
    }

    public void Disconnect()
    {
        _stream?.Dispose();
        _stream = null;
        _deviceLabel = null;
        _batteryFeatureIndex = null;
    }

    public void Dispose() => Disconnect();

    private int ResolveBatteryFeatureIndex()
    {
        if (_batteryFeatureIndex is int cached)
            return cached;

        // Root.GetFeature(0x1004) -> featureIndex in the first param byte
        var payload = Request(0, 0, [
            (byte)((ProX3SuperstrikeConstants.FeatureUnifiedBattery >> 8) & 0xff),
            (byte)(ProX3SuperstrikeConstants.FeatureUnifiedBattery & 0xff),
        ], timeoutMs: 900);

        if (payload is null || payload.Length < 1)
            throw new InvalidOperationException("HID++ GetFeature(0x1004) failed.");

        var idx = payload[0];
        if (idx == 0)
            throw new InvalidOperationException("Feature 0x1004 not present on device.");

        _batteryFeatureIndex = idx;
        return idx;
    }

    /// <summary>
    /// Sends a long HID++ request and returns the payload after the
    /// deviceIndex/featureIndex/fnSw header.
    /// Wire: 0x11 | deviceIndex | featureIndex | (fn&lt;&lt;4)|swId | payload... (pad to 20).
    /// </summary>
    private byte[]? Request(int featureIndex, int functionId, byte[] payloadIn, int timeoutMs)
    {
        if (_stream is null) return null;

        var wire = new byte[ProX3SuperstrikeConstants.LongReportSize];
        wire[0] = ProX3SuperstrikeConstants.ReportLong;
        wire[1] = _deviceIndex;
        wire[2] = (byte)(featureIndex & 0xff);
        wire[3] = (byte)(((functionId & 0x0f) << 4) | (ProX3SuperstrikeConstants.SwId & 0x0f));
        for (var i = 0; i < payloadIn.Length && 4 + i < wire.Length; i++)
            wire[4 + i] = payloadIn[i];

        Drain(30);
        try
        {
            _stream.Write(wire);
        }
        catch (IOException)
        {
            return null;
        }
        catch (TimeoutException)
        {
            return null;
        }

        Thread.Sleep(15);

        var deadline = Environment.TickCount64 + timeoutMs;
        var buf = new byte[64];
        while (Environment.TickCount64 < deadline)
        {
            try
            {
                var n = _stream.Read(buf, 0, buf.Length);
                if (n <= 0) continue;

                var parsed = TryMatchResponse(buf.AsSpan(0, n), featureIndex);
                if (parsed is not null)
                    return parsed;
            }
            catch (TimeoutException)
            {
                Thread.Sleep(5);
            }
            catch (IOException)
            {
                break;
            }
        }

        return null;
    }

    private byte[]? TryMatchResponse(ReadOnlySpan<byte> raw, int expectedFeatureIndex)
    {
        // With or without the leading report id
        ReadOnlySpan<byte> body;
        if (raw.Length >= 1 && (raw[0] == ProX3SuperstrikeConstants.ReportLong || raw[0] == 0x10))
            body = raw[1..];
        else
            body = raw;

        if (body.Length < 3)
            return null;

        var deviceIndex = body[0];
        var featureIndex = body[1];
        var fnSw = body[2];

        if (deviceIndex != _deviceIndex)
            return null;

        // HID++ 2.0 error
        if (featureIndex == 0xFF)
            return null;

        if (featureIndex != (expectedFeatureIndex & 0xff))
            return null;

        if ((fnSw & 0x0f) != (ProX3SuperstrikeConstants.SwId & 0x0f))
            return null;

        var paramLen = Math.Max(0, body.Length - 3);
        var parameters = new byte[paramLen];
        body[3..].CopyTo(parameters);
        return parameters;
    }

    private void Drain(int waitMs)
    {
        if (_stream is null) return;
        var deadline = Environment.TickCount64 + waitMs;
        var buf = new byte[64];
        while (Environment.TickCount64 < deadline)
        {
            try
            {
                _ = _stream.Read(buf, 0, buf.Length);
            }
            catch (TimeoutException)
            {
                break;
            }
            catch (IOException)
            {
                break;
            }
        }
    }

    /// <summary>HID interfaces that could carry HID++ long reports, best first.</summary>
    private static List<HidDevice> ListCandidates(int? preferredProductId)
    {
        var pids = preferredProductId is int only
            ? (int[])[only]
            : ProX3SuperstrikeConstants.ProductIds;

        var scored = new List<(HidDevice Device, int Score)>();
        foreach (var pid in pids)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(ProX3SuperstrikeConstants.VendorId, pid))
                scored.Add((d, ScoreLongDevice(d)));
        }

        // Anything with a long-report sized output is worth a ping; order by score.
        return scored
            .Where(x => x.Score >= 80)
            .OrderByDescending(x => x.Score)
            .Select(x => x.Device)
            .ToList();
    }

    /// <summary>Prefer the FF43 vendor collection with report id 0x11 and a 20-byte output report.</summary>
    private static int ScoreLongDevice(HidDevice device)
    {
        var score = 0;
        try
        {
            if (device.GetMaxOutputReportLength() >= ProX3SuperstrikeConstants.LongReportSize)
                score += 80;
            if (device.GetMaxInputReportLength() >= ProX3SuperstrikeConstants.LongReportSize)
                score += 30;

            var raw = device.GetRawReportDescriptor();
            if (raw is { Length: > 0 })
            {
                // Usage Page 0xFF43 -> 06 43 FF
                for (var i = 0; i + 2 < raw.Length; i++)
                {
                    if (raw[i] == 0x06 && raw[i + 1] == 0x43 && raw[i + 2] == 0xFF)
                    {
                        score += 200;
                        break;
                    }
                }

                // Report ID 0x11 (85 11)
                for (var i = 0; i + 1 < raw.Length; i++)
                {
                    if (raw[i] == 0x85 && raw[i + 1] == ProX3SuperstrikeConstants.ReportLong)
                    {
                        score += 50;
                        break;
                    }
                }
            }
        }
        catch
        {
            // descriptor is optional; the HID++ ping decides
        }

        return score;
    }
}
