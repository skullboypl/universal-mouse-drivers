using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;

/// <summary>
/// Native HID battery reader for Blitz Ultimate only (VID 3554, PID F562/F563).
/// Separate from King Ultra — do not merge.
/// </summary>
internal sealed class BlitzUltimateBatteryReader : IDisposable
{
    private HidStream? _stream;
    private string? _deviceLabel;

    public bool IsConnected => _stream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        var device = PickOemDevice(preferredProductId)
            ?? throw new InvalidOperationException(
                preferredProductId is int pid
                    ? $"No Blitz Ultimate found (VID 3554, PID {pid:X4}). Close Chrome WebHID / OEM app."
                    : "No Blitz Ultimate found (VID 3554, PID F562/F563). Close Chrome WebHID / OEM app.");

        if (!device.TryOpen(out var stream))
            throw new InvalidOperationException("Could not open Blitz Ultimate HID interface (exclusive open?).");

        _stream = stream;
        _stream.ReadTimeout = 400;
        _stream.WriteTimeout = 400;
        _deviceLabel =
            $"{device.GetProductName() ?? BlitzUltimateConstants.DefaultLabel} ({device.VendorID:X4}:{device.ProductID:X4})";
    }

    public BatteryReading ReadBattery()
    {
        if (_stream is null)
            throw new InvalidOperationException("Device not connected.");

        SendWire(BuildWire(BlitzUltimateConstants.CmdEncryption, dataLen: 8, payload: RandomChallenge()));
        Drain(80);
        SendWire(BuildWire(BlitzUltimateConstants.CmdPcDriver, dataLen: 1, payload: [1]));
        Drain(40);
        SendWire(BuildWire(BlitzUltimateConstants.CmdDeviceOnline));
        Drain(120);

        for (var attempt = 0; attempt < 8; attempt++)
        {
            SendWire(BuildWire(BlitzUltimateConstants.CmdBatteryLevel));
            var replies = Drain(500);
            foreach (var r in replies)
            {
                var parsed = ParseBattery(r);
                if (parsed.HasValue)
                    return parsed.Value;
            }
        }

        throw new InvalidOperationException(
            "Blitz Ultimate battery reply empty - wake the mouse / move it, then refresh.");
    }

    public void Disconnect()
    {
        try
        {
            if (_stream is { CanWrite: true })
                SendWire(BuildWire(BlitzUltimateConstants.CmdPcDriver, dataLen: 1, payload: [0]));
        }
        catch
        {
            // ignore on teardown
        }

        _stream?.Dispose();
        _stream = null;
        _deviceLabel = null;
    }

    public void Dispose() => Disconnect();

    private static HidDevice? PickOemDevice(int? preferredProductId)
    {
        var pids = preferredProductId is int only
            ? (int[])[only]
            : BlitzUltimateConstants.ProductIds;

        var all = new List<(HidDevice Device, int Score)>();
        foreach (var pid in pids)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(BlitzUltimateConstants.VendorId, pid))
                all.Add((d, ScoreDevice(d)));
        }

        return all
            .OrderByDescending(x => x.Score)
            .Select(x => x.Device)
            .FirstOrDefault();
    }

    private static int ScoreDevice(HidDevice device)
    {
        var score = 0;
        try
        {
            if (device.GetMaxOutputReportLength() >= BlitzUltimateConstants.OutputReportSize)
                score += 40;
            if (device.GetMaxInputReportLength() >= BlitzUltimateConstants.OutputReportSize)
                score += 20;

            var raw = device.GetRawReportDescriptor();
            if (raw is { Length: > 0 })
            {
                for (var i = 0; i + 2 < raw.Length; i++)
                {
                    if (raw[i] == 0x06 && raw[i + 1] == 0x02 && raw[i + 2] == 0xFF)
                    {
                        score += 100;
                        break;
                    }
                }
            }
        }
        catch
        {
            // descriptor parse optional
        }

        if (BlitzUltimateConstants.IsWirelessDongle(device.ProductID))
            score += 10;

        return score;
    }

    private void SendWire(byte[] wire17)
    {
        if (_stream is null) throw new InvalidOperationException("Stream closed.");
        _stream.Write(wire17);
        Thread.Sleep(15);
    }

    private List<byte[]> Drain(int waitMs)
    {
        var results = new List<byte[]>();
        if (_stream is null) return results;

        var deadline = Environment.TickCount64 + waitMs;
        var buf = new byte[64];
        while (Environment.TickCount64 < deadline)
        {
            try
            {
                var n = _stream.Read(buf, 0, buf.Length);
                if (n > 0)
                {
                    var copy = new byte[n];
                    Array.Copy(buf, copy, n);
                    results.Add(copy);
                }
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

        return results;
    }

    internal static byte[] BuildWire(
        byte cmd,
        int addr = 0,
        int dataLen = 0,
        byte[]? payload = null,
        bool onlineBit = false)
    {
        var buf = new byte[BlitzUltimateConstants.OutputReportSize];
        buf[0] = BlitzUltimateConstants.OutputReportId;
        buf[1] = cmd;
        buf[2] = 0;
        buf[3] = (byte)((addr >> 8) & 0xff);
        buf[4] = (byte)(addr & 0xff);
        buf[5] = (byte)((dataLen & 0x7f) | (onlineBit ? 0x80 : 0));
        if (payload is not null)
        {
            for (var i = 0; i < payload.Length && 6 + i < 16; i++)
                buf[6 + i] = payload[i];
        }

        var sum = 0;
        for (var i = 0; i < 16; i++) sum = (sum + buf[i]) & 0xff;
        buf[16] = (byte)((0x55 - sum) & 0xff);
        return buf;
    }

    private static byte[] RandomChallenge()
    {
        var rnd = new byte[4];
        Random.Shared.NextBytes(rnd);
        return rnd;
    }

    internal static BatteryReading? ParseBattery(byte[] response)
    {
        if (response.Length < 7) return null;

        var body = response[0] == BlitzUltimateConstants.OutputReportId
            ? response.AsSpan(1)
            : response.AsSpan();

        if (body.Length < 6) return null;
        if (body[0] != BlitzUltimateConstants.CmdBatteryLevel) return null;

        var data = body.Length >= 15 ? body[5..] : body[5..];
        if (data.Length < 1) return null;

        var percent = data[0] & 0xff;
        if (percent is < 0 or > 100) return null;
        var any = false;
        for (var i = 0; i < Math.Min(data.Length, 4); i++)
        {
            if (data[i] != 0) { any = true; break; }
        }
        if (!any) return null;

        var charging = data.Length >= 2 && data[1] == 1;
        var status = charging
            ? (percent >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
            : BatteryStatus.Discharging;

        return new BatteryReading(percent, status);
    }
}
