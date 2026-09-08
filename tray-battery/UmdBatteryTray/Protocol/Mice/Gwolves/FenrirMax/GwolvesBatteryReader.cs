using UmdBatteryTray.Protocol;
using HidSharp;

namespace UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;

/// <summary>
/// Native HID battery reader for G-Wolves Fenrir Max (IsNewProtocol=0).
/// Same paths as web-app gwolves-driver: legacy feature cmd 143 first, then feature 131, then output-8.
/// Ported from FENRIR_MOUSE_DRIVERS/tray-battery FenrirBatteryTray.
/// </summary>
internal sealed class GwolvesBatteryReader : IDisposable
{
    private const byte OutputReportId = 8;
    private const int CommonDelayMs = 20;

    private int _productId;
    private bool _isWired;
    private readonly bool _isNewProtocol;
    private readonly byte _wiredDeviceId;

    private HidStream? _featureStream;
    private HidStream? _outputStream;
    private string? _deviceLabel;

    public GwolvesBatteryReader(bool isNewProtocol = false, byte wiredDeviceId = 2)
    {
        _isNewProtocol = isNewProtocol;
        _wiredDeviceId = wiredDeviceId;
    }

    public bool IsConnected => _featureStream is { CanWrite: true };

    public string? DeviceLabel => _deviceLabel;

    public void Connect(int? preferredProductId = null)
    {
        Disconnect();

        HidDevice? featureDevice = null;
        var pids = preferredProductId is int only
            ? (int[])[only]
            : GwolvesConstants.ProductIds;

        foreach (var pid in pids)
        {
            var devices = DeviceList.Local
                .GetHidDevices(GwolvesConstants.VendorId, pid)
                .ToList();
            if (devices.Count == 0)
                continue;

            featureDevice = PickFeatureDevice(devices);
            if (featureDevice is null)
                continue;

            _productId = pid;
            _isWired = pid == GwolvesConstants.FenrirMaxWiredPid;
            break;
        }

        if (featureDevice is null)
            throw new InvalidOperationException(
                preferredProductId is int pid
                    ? $"No Fenrir Max found (VID 33E4, PID {pid:X4}). Close Chrome WebHID / OEM app."
                    : "No Fenrir Max found (VID 33E4, PID 3717/3708). Close Chrome WebHID / OEM app.");

        if (!featureDevice.TryOpen(out var featureStream))
            throw new InvalidOperationException("Could not open Fenrir HID feature interface.");

        _featureStream = featureStream;
        _featureStream.ReadTimeout = 500;
        _deviceLabel =
            $"{featureDevice.GetProductName() ?? "Fenrir Max"} ({featureDevice.VendorID:X4}:{featureDevice.ProductID:X4})";

        var devicesForPid = DeviceList.Local
            .GetHidDevices(GwolvesConstants.VendorId, _productId)
            .ToList();
        var outputDevice = PickOutputDevice(devicesForPid);
        if (outputDevice is not null && outputDevice.TryOpen(out var outputStream))
            _outputStream = outputStream;
    }

    public BatteryReading ReadBattery()
    {
        if (_featureStream is null)
            throw new InvalidOperationException("Device not connected.");

        if (!_isNewProtocol)
        {
            var legacy = TryLegacyFeatureBattery();
            if (legacy.HasValue)
                return legacy.Value;
        }

        var feature = TryFeatureBattery();
        if (feature.HasValue)
            return feature.Value;

        var output = TryOutputBattery();
        if (output.HasValue)
            return output.Value;

        throw new InvalidOperationException(
            "Fenrir battery reply empty - wake the mouse, then refresh.");
    }

    public void Disconnect()
    {
        _featureStream?.Dispose();
        _featureStream = null;
        _outputStream?.Dispose();
        _outputStream = null;
        _deviceLabel = null;
    }

    public void Dispose() => Disconnect();

    private static HidDevice? PickFeatureDevice(IEnumerable<HidDevice> devices)
    {
        foreach (var device in devices.OrderByDescending(d => d.GetMaxFeatureReportLength()))
        {
            if (device.GetMaxFeatureReportLength() >= GwolvesConstants.FeatureReportSize + 1)
                return device;
        }

        return devices.FirstOrDefault();
    }

    private static HidDevice? PickOutputDevice(IEnumerable<HidDevice> devices)
    {
        foreach (var device in devices)
        {
            if (device.GetMaxOutputReportLength() >= 17)
                return device;
        }

        return null;
    }

    private BatteryReading? TryLegacyFeatureBattery()
    {
        var request = LegacyCmd(2, 143, 0);
        SendFeatureReport(request, legacy: true);
        Thread.Sleep(50);

        var response = ReceiveFeatureReport();
        response = RetrySetGetOld(request, response);
        return ParseLegacyBattery(response);
    }

    private BatteryReading? TryFeatureBattery()
    {
        var request = FeatureCmd(2, 2, 0, 131);
        SendFeatureReport(request, legacy: false);
        Thread.Sleep(100);

        var response = ReceiveFeatureReport();
        response = RetrySetGet(request, response);
        return ParseFeatureBattery(response);
    }

    private BatteryReading? TryOutputBattery()
    {
        if (_outputStream is null)
            return null;

        var payload = new byte[16];
        payload[0] = (byte)DongleCommand.BatteryLevel;
        payload[15] = (byte)((DongleCrc.Compute(payload, 15) - OutputReportId) & 0xFF);

        var report = new byte[17];
        report[0] = OutputReportId;
        Array.Copy(payload, 0, report, 1, 16);

        try
        {
            for (var attempt = 0; attempt < 50; attempt++)
            {
                _outputStream.Write(report);
                Thread.Sleep(50);

                var input = new byte[64];
                try
                {
                    var read = _outputStream.Read(input, 0, input.Length);
                    if (read > 0)
                    {
                        var parsed = ParseOutputBattery(input);
                        if (parsed.HasValue)
                            return parsed;
                    }
                }
                catch (TimeoutException)
                {
                    // retry
                }
            }
        }
        catch
        {
            return null;
        }

        return null;
    }

    private static byte[] LegacyCmd(byte b1, byte b2, byte b3, byte b4 = 0, byte b5 = 0)
    {
        var report = new byte[GwolvesConstants.FeatureReportSize];
        report[1] = b1;
        report[2] = b2;
        report[3] = b3;
        report[4] = b4;
        report[5] = b5;
        return report;
    }

    private static byte[] FeatureCmd(byte b2, byte b3, byte b4, byte b5, byte b6 = 0, byte b7 = 0)
    {
        var report = new byte[GwolvesConstants.FeatureReportSize];
        report[2] = b2;
        report[3] = b3;
        report[4] = b4;
        report[5] = b5;
        report[6] = b6;
        report[7] = b7;
        return report;
    }

    private void SendFeatureReport(byte[] report, bool legacy)
    {
        if (_featureStream is null)
            throw new InvalidOperationException("Feature stream not open.");

        var prepared = PrepareReport(report, legacy);
        var buffer = new byte[prepared.Length + 1];
        buffer[0] = GwolvesConstants.FeatureReportId;
        Array.Copy(prepared, 0, buffer, 1, prepared.Length);
        _featureStream.SetFeature(buffer);
        Thread.Sleep(CommonDelayMs);
    }

    private byte[] ReceiveFeatureReport()
    {
        if (_featureStream is null)
            throw new InvalidOperationException("Feature stream not open.");

        var buffer = new byte[GwolvesConstants.FeatureReportSize + 1];
        buffer[0] = GwolvesConstants.FeatureReportId;
        _featureStream.GetFeature(buffer);

        var response = new byte[GwolvesConstants.FeatureReportSize];
        Array.Copy(buffer, 1, response, 0, GwolvesConstants.FeatureReportSize);
        return response;
    }

    private byte[] RetrySetGet(byte[] send, byte[] response)
    {
        const int ackAt = 0;
        if (response[ackAt] == GwolvesConstants.HidAck || response[ackAt] == 2)
            return response;

        for (var i = 0; i < 5; i++)
        {
            if (response[ackAt] > GwolvesConstants.HidAck)
            {
                Thread.Sleep(CommonDelayMs);
                SendFeatureReport(send, legacy: false);
                response = ReceiveFeatureReport();
                if (response[ackAt] == GwolvesConstants.HidAck)
                    return response;
            }
            else
            {
                for (var j = 0; j < 10; j++)
                {
                    Thread.Sleep(CommonDelayMs);
                    response = ReceiveFeatureReport();
                    if (response[ackAt] == GwolvesConstants.HidAck)
                        return response;
                }

                SendFeatureReport(send, legacy: false);
                response = ReceiveFeatureReport();
                if (response[ackAt] == GwolvesConstants.HidAck)
                    return response;
            }
        }

        return response;
    }

    private byte[] RetrySetGetOld(byte[] send, byte[] response)
    {
        const int ackAt = 0;
        if (response[ackAt] == GwolvesConstants.HidAck || response[ackAt] == 2)
            return response;

        for (var i = 0; i < 5; i++)
        {
            if (response[ackAt] > GwolvesConstants.HidAck)
            {
                Thread.Sleep(CommonDelayMs);
                SendFeatureReport(send, legacy: true);
                response = ReceiveFeatureReport();
                if (response[ackAt] == GwolvesConstants.HidAck)
                    return response;
            }
            else
            {
                for (var j = 0; j < 30; j++)
                {
                    Thread.Sleep(CommonDelayMs);
                    response = ReceiveFeatureReport();
                    if (response[ackAt] == GwolvesConstants.HidAck)
                        return response;
                }

                SendFeatureReport(send, legacy: true);
                response = ReceiveFeatureReport();
                if (response[ackAt] == GwolvesConstants.HidAck)
                    return response;
            }
        }

        return response;
    }

    private byte[] PrepareReport(byte[] report, bool legacy)
    {
        var copy = new byte[report.Length];
        Array.Copy(report, copy, report.Length);

        if (legacy)
        {
            if (!_isWired)
                copy[3] = 1;
            return copy;
        }

        if (_isNewProtocol && copy[2] == 2)
            copy[2] = _wiredDeviceId;

        return copy;
    }

    private static BatteryReading? ParseLegacyBattery(byte[] response)
    {
        // OEM getOldBattery / web-app: a1 02 8f … status@4 percent@5
        if (response[0] == GwolvesConstants.HidAck && response[1] == 2 && response[2] == 143)
            return ToBatteryReading(response[5], response[4]);

        if (response[1] == GwolvesConstants.HidAck && response[2] == 2 && response[3] == 143)
            return ToBatteryReading(response[6], response[5]);

        return null;
    }

    private static BatteryReading? ParseFeatureBattery(byte[] response)
    {
        if (response[1] == GwolvesConstants.HidAck && response[4] == 2 && response[6] == 131)
            return ToBatteryReading(response[7], response[8]);

        if (response[0] == GwolvesConstants.HidAck && response[3] == 2 && response[5] == 131)
            return ToBatteryReading(response[6], response[7]);

        return null;
    }

    private static BatteryReading? ParseOutputBattery(byte[] response)
    {
        if (response[0] == (byte)DongleCommand.BatteryLevel && IsValidPercent(response[6]))
            return ToBatteryReading(response[6], response[5]);

        for (var offset = 0; offset <= 2; offset++)
        {
            var percent = response[6 + offset];
            var status = response[5 + offset];
            if (IsValidPercent(percent))
                return ToBatteryReading(percent, status);
        }

        return null;
    }

    private static bool IsValidPercent(byte value) => value <= 100;

    /// <summary>Matches web-app: status===1 → charging.</summary>
    private static BatteryReading ToBatteryReading(byte percentByte, byte statusByte)
    {
        var percent = Math.Clamp((int)percentByte, 0, 100);
        var status = statusByte switch
        {
            1 when percent >= 100 => BatteryStatus.Full,
            1 => BatteryStatus.Charging,
            _ => BatteryStatus.Discharging,
        };
        return new BatteryReading(percent, status);
    }
}
