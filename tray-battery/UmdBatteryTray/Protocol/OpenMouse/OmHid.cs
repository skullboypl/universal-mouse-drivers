using HidSharp;

namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>Shared HidSharp helpers for OpenMouse battery ports (AGPL codecs → C#).</summary>
internal static class OmHid
{
    public static IEnumerable<HidDevice> Devices(int vendorId, int productId) =>
        DeviceList.Local.GetHidDevices(vendorId, productId);

    public static HidDevice? PickByMaxOutput(int vendorId, int productId, int minOutput) =>
        Devices(vendorId, productId)
            .OrderByDescending(d => SafeMaxOut(d))
            .FirstOrDefault(d => SafeMaxOut(d) >= minOutput);

    public static HidDevice? PickByMaxFeature(int vendorId, int productId, int minFeature) =>
        Devices(vendorId, productId)
            .OrderByDescending(d => SafeMaxFeat(d))
            .FirstOrDefault(d => SafeMaxFeat(d) >= minFeature);

    public static HidDevice? PickAny(int vendorId, int productId) =>
        Devices(vendorId, productId).FirstOrDefault();

    public static HidStream Open(HidDevice device)
    {
        if (!device.TryOpen(out var stream))
            throw new InvalidOperationException(
                $"Could not open HID {device.VendorID:X4}:{device.ProductID:X4} (exclusive?).");
        stream.ReadTimeout = 400;
        stream.WriteTimeout = 400;
        return stream;
    }

    public static string Label(HidDevice device, string fallback)
    {
        try { return device.GetProductName() ?? fallback; }
        catch { return fallback; }
    }

    /// <summary>Write output report (reportId + payload) and read next input.</summary>
    public static byte[]? OutputExchange(HidStream stream, byte reportId, byte[] payload, int readSize, int attempts = 8)
    {
        var wire = new byte[1 + payload.Length];
        wire[0] = reportId;
        Buffer.BlockCopy(payload, 0, wire, 1, payload.Length);

        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                Drain(stream, 20);
                stream.Write(wire);
                Thread.Sleep(25);
                var buf = new byte[Math.Max(readSize, 64)];
                var n = stream.Read(buf, 0, buf.Length);
                if (n <= 0) continue;
                // Strip leading report id when present
                if (n > 1 && buf[0] == reportId)
                    return buf.AsSpan(1, n - 1).ToArray();
                return buf.AsSpan(0, n).ToArray();
            }
            catch (TimeoutException)
            {
                Thread.Sleep(30);
            }
            catch (IOException)
            {
                break;
            }
        }

        return null;
    }

    /// <summary>Feature SetFeature then GetFeature (report id as first byte).</summary>
    public static byte[]? FeatureExchange(HidStream stream, byte reportId, byte[] body, int reportLen, int attempts = 6)
    {
        var wire = new byte[reportLen];
        wire[0] = reportId;
        Buffer.BlockCopy(body, 0, wire, 1, Math.Min(body.Length, reportLen - 1));

        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                stream.SetFeature(wire);
                Thread.Sleep(40);
                var reply = new byte[reportLen];
                reply[0] = reportId;
                stream.GetFeature(reply);
                return reply.AsSpan(1).ToArray();
            }
            catch
            {
                Thread.Sleep(40);
            }
        }

        return null;
    }

    public static void Drain(HidStream stream, int waitMs)
    {
        var deadline = Environment.TickCount64 + waitMs;
        var buf = new byte[64];
        while (Environment.TickCount64 < deadline)
        {
            try { _ = stream.Read(buf, 0, buf.Length); }
            catch { break; }
        }
    }

    private static int SafeMaxOut(HidDevice d)
    {
        try { return d.GetMaxOutputReportLength(); }
        catch { return 0; }
    }

    private static int SafeMaxFeat(HidDevice d)
    {
        try { return d.GetMaxFeatureReportLength(); }
        catch { return 0; }
    }
}
