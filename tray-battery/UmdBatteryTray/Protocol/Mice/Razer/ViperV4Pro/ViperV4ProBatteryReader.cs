using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.Mice.Razer.ViperV4Pro;

/// <summary>
/// Native Razer V4 control-channel battery reader for Viper V4 Pro (1532:00E5 / 00E6).
/// Mirrors web protocol.ts: 90-byte feature report id 0, CRC XOR bytes 2..87 @88,
/// battery 07/80 args[1] as raw 0..255 → %, charging 07/84 args[1]==1.
/// Close Synapse / Chrome WebHID if exclusive open fails.
/// </summary>
internal sealed class ViperV4ProBatteryReader : IDisposable
{
    private HidStream? _stream;
    private string? _deviceLabel;
    private byte _txn = ViperV4ProConstants.DefaultTxn;

    public bool IsConnected => _stream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        var device = PickDevice(preferredProductId)
            ?? throw new InvalidOperationException(
                preferredProductId is int pid
                    ? $"No Viper V4 Pro found (VID 1532, PID {pid:X4}). Close Synapse / Chrome WebHID."
                    : "No Viper V4 Pro found (VID 1532, PID 00E5/00E6). Close Synapse / Chrome WebHID.");

        if (!device.TryOpen(out var stream))
            throw new InvalidOperationException(
                "Could not open Viper V4 Pro control interface (exclusive?). Close Synapse / WebHID.");

        _stream = stream;
        _stream.ReadTimeout = 500;
        _stream.WriteTimeout = 500;
        _deviceLabel =
            $"{device.GetProductName() ?? ViperV4ProConstants.DefaultLabel} ({device.VendorID:X4}:{device.ProductID:X4})";
        _txn = ViperV4ProConstants.DefaultTxn;
    }

    public BatteryReading ReadBattery()
    {
        if (_stream is null)
            throw new InvalidOperationException("Device not connected.");

        for (var attempt = 0; attempt < 8; attempt++)
        {
            var bat = Exchange(
                ViperV4ProConstants.CmdClassPower,
                ViperV4ProConstants.CmdBatteryRead,
                dataSize: 0x02);
            if (bat is null) continue;

            var raw = bat[9]; // args[1]
            var percent = (int)Math.Round(raw * 100.0 / 255.0);
            if (percent is < 0 or > 100) continue;

            var chg = Exchange(
                ViperV4ProConstants.CmdClassPower,
                ViperV4ProConstants.CmdChargingRead,
                dataSize: 0x02);
            var charging = chg is { Length: > 9 } && chg[9] == 1;
            var status = charging
                ? (percent >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
                : BatteryStatus.Discharging;
            return new BatteryReading(Math.Max(percent, 1), status);
        }

        throw new InvalidOperationException(
            "Viper V4 Pro battery reply empty - wake the mouse / move it, then refresh.");
    }

    public void Disconnect()
    {
        _stream?.Dispose();
        _stream = null;
        _deviceLabel = null;
    }

    public void Dispose() => Disconnect();

    private byte[]? Exchange(byte commandClass, byte commandId, byte dataSize)
    {
        if (_stream is null) return null;

        var report = BuildReport(commandClass, commandId, dataSize, _txn);
        _txn = (byte)((_txn + 1) & 0xff);
        if (_txn == 0) _txn = 1;

        for (var attempt = 0; attempt < 10; attempt++)
        {
            try
            {
                _stream.SetFeature(report);
                Thread.Sleep(45);
                var reply = new byte[ViperV4ProConstants.ReportLength];
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

    /// <summary>
    /// 90-byte report with status@0, tid@1, size@5, class@6, id@7, args@8, crc@88.
    /// Report id 0 → HidSharp buffer is the report itself (no extra leading id).
    /// </summary>
    internal static byte[] BuildReport(byte commandClass, byte commandId, byte dataSize, byte txn)
    {
        var report = new byte[ViperV4ProConstants.ReportLength];
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

    private static HidDevice? PickDevice(int? preferredProductId)
    {
        var pids = preferredProductId is int only
            ? (int[])[only]
            : ViperV4ProConstants.ProductIds;

        // Prefer dongle (wireless battery) when both are present.
        var ordered = pids
            .OrderByDescending(p => ViperV4ProConstants.IsWirelessDongle(p) ? 1 : 0)
            .ToArray();

        foreach (var pid in ordered)
        {
            var devices = DeviceList.Local
                .GetHidDevices(ViperV4ProConstants.VendorId, pid)
                .ToList();
            if (devices.Count == 0) continue;

            var best = devices
                .OrderByDescending(SafeMaxFeat)
                .FirstOrDefault(d => SafeMaxFeat(d) >= ViperV4ProConstants.ReportLength);
            if (best is not null) return best;
        }

        return null;
    }

    private static int SafeMaxFeat(HidDevice d)
    {
        try { return d.GetMaxFeatureReportLength(); }
        catch { return 0; }
    }
}
