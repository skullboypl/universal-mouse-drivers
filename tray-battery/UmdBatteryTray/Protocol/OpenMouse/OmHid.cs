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
                $"Could not open HID {device.VendorID:X4}:{device.ProductID:X4} " +
                "(exclusive — close Synapse / OEM app / Chrome WebHID).");
        stream.ReadTimeout = 400;
        stream.WriteTimeout = 400;
        return stream;
    }

    /// <summary>
    /// Try every matching interface (largest feature/output first) until one opens.
    /// Razer / Logitech receivers expose many collections; OEM software often locks only one.
    /// </summary>
    public static bool TryOpenBest(
        int vendorId,
        int productId,
        int minLen,
        bool feature,
        out HidStream? stream,
        out HidDevice? device)
    {
        stream = null;
        device = null;
        var devices = (feature
                ? Devices(vendorId, productId).OrderByDescending(SafeMaxFeat)
                : Devices(vendorId, productId).OrderByDescending(SafeMaxOut))
            .Where(d => feature ? SafeMaxFeat(d) >= minLen : SafeMaxOut(d) >= minLen)
            .Concat(Devices(vendorId, productId))
            .Distinct()
            .ToList();

        foreach (var candidate in devices)
        {
            if (!candidate.TryOpen(out var opened)) continue;
            opened.ReadTimeout = 400;
            opened.WriteTimeout = 400;
            stream = opened;
            device = candidate;
            return true;
        }

        return false;
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

    /// <summary>
    /// Feature SetFeature then GetFeature (report id as first byte).
    /// Returns the payload with the leading report-id byte stripped (WebHID-shaped).
    /// </summary>
    public static byte[]? FeatureExchange(HidStream stream, byte reportId, byte[] body, int reportLen, int attempts = 6)
    {
        var full = FeatureExchangeKeepId(stream, reportId, body, reportLen, attempts);
        return full is null || full.Length < 2 ? full : full.AsSpan(1).ToArray();
    }

    /// <summary>
    /// Same as FeatureExchange but keeps the leading report-id byte
    /// (needed by Ninjutso / some Windows GetFeature layouts).
    /// </summary>
    public static byte[]? FeatureExchangeKeepId(
        HidStream stream,
        byte reportId,
        byte[] body,
        int reportLen,
        int attempts = 6)
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
                return reply;
            }
            catch
            {
                Thread.Sleep(40);
            }
        }

        return null;
    }

    /// <summary>
    /// Feature exchange for logical report-id-0 bodies (WebHID-shaped: status/cmd @ [0]).
    /// Windows HidSharp often needs wire = [reportId=0] + body (maxFeat = bodyLen+1),
    /// same bug that broke Viper 90→91. Tries bare body first, then prefixed;
    /// always returns the logical body (leading id stripped when we prefixed).
    /// </summary>
    public static byte[]? FeatureReportRaw(HidStream stream, byte[] logicalBody, int attempts = 8)
    {
        var prefixed = new byte[logicalBody.Length + 1];
        prefixed[0] = 0x00;
        Buffer.BlockCopy(logicalBody, 0, prefixed, 1, logicalBody.Length);

        // Prefer prefixed on Windows (matches GetMaxFeatureReportLength = body+1),
        // fall back to bare body for stacks that expect unnumbered exact length.
        foreach (var wire in new[] { prefixed, logicalBody })
        {
            var usedPrefix = ReferenceEquals(wire, prefixed);
            for (var attempt = 0; attempt < attempts; attempt++)
            {
                try
                {
                    stream.SetFeature(wire);
                    Thread.Sleep(45);
                    var reply = new byte[wire.Length];
                    reply[0] = wire[0];
                    stream.GetFeature(reply);
                    if (usedPrefix && reply.Length > 1 && reply[0] == 0x00)
                        return reply.AsSpan(1).ToArray();
                    return reply;
                }
                catch (TimeoutException)
                {
                    Thread.Sleep(40);
                }
                catch (IOException)
                {
                    break; // try other wire shape
                }
                catch
                {
                    Thread.Sleep(40);
                }
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
