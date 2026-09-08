using UmdBatteryTray.Protocol;
using HidSharp;

namespace UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;

/// <summary>
/// Native HID++ 2.0 battery reader for PRO X SUPERLIGHT gen1 (046D:C547).
/// Mirrors web hidpp.ts getBattery + tools/logitech_superlight_hidpp_probe.py:
/// long report 0x11, feature 0x1004 fn1 GetStatus → SoC + charging_status.
/// Close G HUB / OMM / Chrome WebHID if exclusive open fails.
/// </summary>
internal sealed class SuperlightBatteryReader : IDisposable
{
    private HidStream? _stream;
    private string? _deviceLabel;
    private byte _deviceIndex = SuperlightConstants.DefaultDeviceIndex;
    private int? _batteryFeatureIndex;

    public bool IsConnected => _stream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        var device = PickLongDevice(preferredProductId)
            ?? throw new InvalidOperationException(
                preferredProductId is int pid
                    ? $"No Superlight receiver found (VID 046D, PID {pid:X4}). Close G HUB / OMM / Chrome WebHID."
                    : "No Superlight receiver found (VID 046D, PID C547). Close G HUB / OMM / Chrome WebHID.");

        if (!device.TryOpen(out var stream))
            throw new InvalidOperationException(
                "Could not open Superlight HID++ long interface (exclusive open?). Close G HUB / OMM / WebHID.");

        _stream = stream;
        _stream.ReadTimeout = 400;
        _stream.WriteTimeout = 400;
        _deviceLabel =
            $"{device.GetProductName() ?? "PRO X SUPERLIGHT"} ({device.VendorID:X4}:{device.ProductID:X4})";
        _deviceIndex = SuperlightConstants.DefaultDeviceIndex;
        _batteryFeatureIndex = null;
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
            var payload = Request(featIdx, 1, [], timeoutMs: 900);
            if (payload is null || payload.Length < 1)
                continue;

            var percent = payload[0];
            if (percent is < 1 or > 100)
                continue;

            var statusByte = payload.Length > 2 ? payload[2] : (byte)0;
            var charging = statusByte != 0;
            var status = charging
                ? (percent >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
                : BatteryStatus.Discharging;
            return new BatteryReading(percent, status);
        }

        throw new InvalidOperationException(
            "Superlight battery reply empty - wake the mouse / move it, then refresh.");
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

        // Root.GetFeature(0x1004) → featureIndex in first param
        var payload = Request(0, 0, [
            (byte)((SuperlightConstants.FeatBatteryUnified >> 8) & 0xff),
            (byte)(SuperlightConstants.FeatBatteryUnified & 0xff),
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
    /// Send long HID++ request; returns payload after deviceIndex/featureIndex/fnSw header.
    /// Wire: 0x11 | deviceIndex | featureIndex | (fn&lt;&lt;4)|swId | payload… (pad to 20).
    /// </summary>
    private byte[]? Request(int featureIndex, int functionId, byte[] payloadIn, int timeoutMs)
    {
        if (_stream is null) return null;

        var wire = new byte[SuperlightConstants.LongReportSize];
        wire[0] = SuperlightConstants.ReportLong;
        wire[1] = _deviceIndex;
        wire[2] = (byte)(featureIndex & 0xff);
        wire[3] = (byte)(((functionId & 0x0f) << 4) | (SuperlightConstants.SwId & 0x0f));
        for (var i = 0; i < payloadIn.Length && 4 + i < wire.Length; i++)
            wire[4 + i] = payloadIn[i];

        Drain(30);
        _stream.Write(wire);
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
        // With or without leading report id
        ReadOnlySpan<byte> body;
        if (raw.Length >= 1 && raw[0] is SuperlightConstants.ReportLong or 0x10)
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

        if ((fnSw & 0x0f) != (SuperlightConstants.SwId & 0x0f))
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

    private static HidDevice? PickLongDevice(int? preferredProductId)
    {
        var pids = preferredProductId is int only
            ? (int[])[only]
            : SuperlightConstants.ProductIds;

        var all = new List<(HidDevice Device, int Score)>();
        foreach (var pid in pids)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(SuperlightConstants.VendorId, pid))
                all.Add((d, ScoreLongDevice(d)));
        }

        return all
            .Where(x => x.Score >= 100)
            .OrderByDescending(x => x.Score)
            .Select(x => x.Device)
            .FirstOrDefault()
            ?? all.OrderByDescending(x => x.Score).Select(x => x.Device).FirstOrDefault();
    }

    /// <summary>Prefer Col02: usage page FF00 / usage 02 / output report ≥ 20.</summary>
    private static int ScoreLongDevice(HidDevice device)
    {
        var score = 0;
        try
        {
            if (device.GetMaxOutputReportLength() >= SuperlightConstants.LongReportSize)
                score += 80;
            if (device.GetMaxInputReportLength() >= SuperlightConstants.LongReportSize)
                score += 30;

            var raw = device.GetRawReportDescriptor();
            if (raw is { Length: > 0 })
            {
                // Usage Page 0xFF00 → 06 00 FF; Usage 0x02 → 09 02
                var hasFf00 = false;
                for (var i = 0; i + 2 < raw.Length; i++)
                {
                    if (raw[i] == 0x06 && raw[i + 1] == 0x00 && raw[i + 2] == 0xFF)
                    {
                        hasFf00 = true;
                        score += 40;
                        break;
                    }
                }

                if (hasFf00)
                {
                    for (var i = 0; i + 1 < raw.Length; i++)
                    {
                        if (raw[i] == 0x09 && raw[i + 1] == SuperlightConstants.UsageLong)
                        {
                            score += 200;
                            break;
                        }
                    }
                }

                // Report ID 0x11 in descriptor (often 85 11)
                for (var i = 0; i + 1 < raw.Length; i++)
                {
                    if (raw[i] == 0x85 && raw[i + 1] == SuperlightConstants.ReportLong)
                    {
                        score += 50;
                        break;
                    }
                }
            }
        }
        catch
        {
            // descriptor optional
        }

        return score;
    }
}
