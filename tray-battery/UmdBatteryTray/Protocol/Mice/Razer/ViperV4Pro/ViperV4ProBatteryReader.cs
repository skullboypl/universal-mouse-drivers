using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.Mice.Razer.ViperV4Pro;

/// <summary>
/// Native Razer V4 control-channel battery reader for Viper V4 Pro (1532:00E5 / 00E6).
/// Mirrors web protocol.ts: 90-byte feature report id 0, CRC XOR bytes 2..87 @88,
/// battery 07/80 → 0..255 %, charging 07/84.
/// Tries every HID interface (Synapse/WebHID often lock only the vendor page).
/// </summary>
internal sealed class ViperV4ProBatteryReader : IDisposable
{
    private HidStream? _stream;
    private HidDevice? _device;
    private string? _deviceLabel;
    private byte _txn = ViperV4ProConstants.DefaultTxn;
    private int _reportLength = ViperV4ProConstants.ReportLength;

    public bool IsConnected => _stream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        var candidates = ListCandidates(preferredProductId);
        if (candidates.Count == 0)
        {
            throw new InvalidOperationException(
                preferredProductId is int pid
                    ? $"No Viper V4 Pro found (VID 1532, PID {pid:X4}). Close Synapse / Chrome WebHID."
                    : "No Viper V4 Pro found (VID 1532, PID 00E5/00E6). Close Synapse / Chrome WebHID.");
        }

        Exception? lastOpen = null;
        foreach (var device in candidates)
        {
            if (!device.TryOpen(out var stream))
            {
                lastOpen ??= new InvalidOperationException(
                    "HID exclusive — another app holds this interface.");
                continue;
            }

            _device = device;
            _stream = stream;
            _stream.ReadTimeout = 500;
            _stream.WriteTimeout = 500;
            try
            {
                var max = device.GetMaxFeatureReportLength();
                _reportLength = Math.Max(ViperV4ProConstants.ReportLength, max);
            }
            catch
            {
                _reportLength = ViperV4ProConstants.ReportLength;
            }

            _deviceLabel =
                $"{device.GetProductName() ?? ViperV4ProConstants.DefaultLabel} ({device.VendorID:X4}:{device.ProductID:X4})";
            _txn = ViperV4ProConstants.DefaultTxn;

            // Prefer an interface that actually answers battery (skip mouse/keyboard pages).
            try
            {
                _ = ReadBattery();
                return;
            }
            catch (Exception ex)
            {
                lastOpen = ex;
                _stream.Dispose();
                _stream = null;
                _device = null;
                _deviceLabel = null;
            }
        }

        throw new InvalidOperationException(
            "Could not open Viper V4 Pro control interface. " +
            "Close Razer Synapse / RazerAppEngine and Chrome tabs with WebHID (umdrivers.com), then retry. " +
            (lastOpen?.Message ?? ""),
            lastOpen);
    }

    public BatteryReading ReadBattery()
    {
        if (_stream is null)
            throw new InvalidOperationException("Device not connected.");

        foreach (byte seedTxn in new byte[] { _txn, 0x1F, 0x3F, 0xFF })
        {
            _txn = seedTxn == 0 ? (byte)1 : seedTxn;
            for (var attempt = 0; attempt < 6; attempt++)
            {
                var bat = Exchange(
                    ViperV4ProConstants.CmdClassPower,
                    ViperV4ProConstants.CmdBatteryRead,
                    dataSize: 0x02);
                if (bat is null || bat.Length < 10) continue;

                var percent = DecodePercent(bat[9]);
                if (percent is null) percent = DecodePercent(bat[8]);
                if (percent is null) continue;

                var charging = false;
                try
                {
                    var chg = Exchange(
                        ViperV4ProConstants.CmdClassPower,
                        ViperV4ProConstants.CmdChargingRead,
                        dataSize: 0x02);
                    charging = chg is { Length: > 9 } && chg[9] == 1;
                }
                catch
                {
                    /* level OK, charging unsupported */
                }

                var status = charging
                    ? (percent.Value >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
                    : BatteryStatus.Discharging;
                return new BatteryReading(percent.Value, status);
            }
        }

        throw new InvalidOperationException(
            "Viper V4 Pro battery reply empty - wake the mouse / move it, then refresh.");
    }

    private static int? DecodePercent(byte raw)
    {
        if (raw == 0) return null;
        var percent = (int)Math.Round(raw * 100.0 / 255.0);
        if (percent is < 1 or > 100) return null;
        return percent;
    }

    public void Disconnect()
    {
        _stream?.Dispose();
        _stream = null;
        _device = null;
        _deviceLabel = null;
        _reportLength = ViperV4ProConstants.ReportLength;
    }

    public void Dispose() => Disconnect();

    private byte[]? Exchange(byte commandClass, byte commandId, byte dataSize)
    {
        if (_stream is null) return null;

        var report = BuildReport(commandClass, commandId, dataSize, _txn, _reportLength);
        _txn = (byte)((_txn + 1) & 0xff);
        if (_txn == 0) _txn = 1;

        for (var attempt = 0; attempt < 10; attempt++)
        {
            try
            {
                _stream.SetFeature(report);
                Thread.Sleep(45);
                var reply = new byte[_reportLength];
                _stream.GetFeature(reply);

                var status = reply[0];
                if (status == ViperV4ProConstants.StatusOk)
                    return reply;
                if (status == ViperV4ProConstants.StatusBusy || status == 0x00)
                {
                    Thread.Sleep(40);
                    continue;
                }
            }
            catch (TimeoutException)
            {
                Thread.Sleep(40);
            }
            catch (IOException)
            {
                break;
            }
            catch
            {
                Thread.Sleep(40);
            }
        }

        return null;
    }

    internal static byte[] BuildReport(
        byte commandClass,
        byte commandId,
        byte dataSize,
        byte txn,
        int reportLength = ViperV4ProConstants.ReportLength)
    {
        var len = Math.Max(ViperV4ProConstants.ReportLength, reportLength);
        var report = new byte[len];
        report[1] = txn;
        report[5] = dataSize;
        report[6] = commandClass;
        report[7] = commandId;
        byte xor = 0;
        for (var i = 2; i <= 87; i++)
            xor ^= report[i];
        report[88] = xor;
        return report;
    }

    private static List<HidDevice> ListCandidates(int? preferredProductId)
    {
        var pids = preferredProductId is int only
            ? (int[])[only]
            : ViperV4ProConstants.ProductIds;

        var orderedPids = pids
            .OrderByDescending(p => ViperV4ProConstants.IsWirelessDongle(p) ? 1 : 0)
            .ToArray();

        var scored = new List<(HidDevice Device, int Score)>();
        foreach (var pid in orderedPids)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(ViperV4ProConstants.VendorId, pid))
                scored.Add((d, ScoreDevice(d)));
        }

        return scored
            .OrderByDescending(x => x.Score)
            .Select(x => x.Device)
            .ToList();
    }

    private static int ScoreDevice(HidDevice device)
    {
        var score = 0;
        try
        {
            var feat = device.GetMaxFeatureReportLength();
            if (feat >= ViperV4ProConstants.ReportLength) score += 80;
            else if (feat >= 64) score += 20;
            score += Math.Min(feat, 120);
        }
        catch { /* ignore */ }

        // Prefer Razer vendor usage page 0xFF00 (control channel), not mouse/keyboard.
        try
        {
            var raw = device.GetRawReportDescriptor();
            if (raw is { Length: > 2 })
            {
                for (var i = 0; i + 2 < raw.Length; i++)
                {
                    // Usage Page (Vendor) 0xFF00 → 06 00 FF
                    if (raw[i] == 0x06 && raw[i + 1] == 0x00 && raw[i + 2] == 0xFF)
                    {
                        score += 200;
                        break;
                    }
                }
            }
        }
        catch { /* descriptor optional */ }

        if (ViperV4ProConstants.IsWirelessDongle(device.ProductID))
            score += 10;

        return score;
    }
}
