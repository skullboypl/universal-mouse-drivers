using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// OpenMouse AGPL battery codecs ported to HidSharp (read-only %).
/// Wire layouts verified against OpenMouse-Project/mouse-protocol (2026).
/// </summary>
internal sealed class OmPortedBatteryReader : IDisposable
{
    private enum Kind
    {
        Report8Vgn,
        Report8Teevolution,
        Compx,
        Ksnake,
        SteelAa01,
        SteelPrime,
        Razer,
        KeychronNape,
        KeychronM6,
        Wallhack,
        Mchose,
        Ninjutso,
        GloriousClassic,
        Dareu,
        Bitmouse,
        Ajazz,
    }

    private Kind _kind;
    private HidStream? _stream;
    private HidDevice? _device;
    private string? _deviceLabel;
    private int _steelWirelessBit; // 0=wired 0x92, 1=wireless 0xD2
    private byte _bitmouseTarget; // 0=device, 1=mouse behind receiver

    public bool IsConnected => _stream is { CanWrite: true };
    public string? DeviceLabel => _deviceLabel;

    public static OmPortedBatteryReader? TryConnect(string brand, int vendorId, int productId)
    {
        var probes = ProbesFor(brand, vendorId, productId);
        foreach (var probe in probes)
        {
            try
            {
                var reader = new OmPortedBatteryReader();
                if (reader.ConnectProbe(probe, vendorId, productId, brand))
                    return reader;
                reader.Dispose();
            }
            catch
            {
                // try next family
            }
        }

        return null;
    }

    private bool ConnectProbe((Kind kind, int minLen, bool feature) probe, int vendorId, int productId, string brand)
    {
        if (!OmHid.TryOpenBest(vendorId, productId, probe.minLen, probe.feature, out var stream, out var device)
            || stream is null
            || device is null)
            return false;

        _stream = stream;
        _device = device;
        _kind = probe.kind;
        if (probe.kind is Kind.SteelPrime)
            _steelWirelessBit = GuessSteelWireless(device) ? 1 : 0;
        if (probe.kind is Kind.Bitmouse)
            _bitmouseTarget = GuessBitmouseTarget(device, productId);

        var smoke = ReadBatteryCore();
        if (smoke is null || smoke.Value.Status == BatteryStatus.Unknown && smoke.Value.Percent <= 0)
        {
            Disconnect();
            return false;
        }

        _deviceLabel =
            $"{brand} · {OmHid.Label(device, "OpenMouse")} ({device.VendorID:X4}:{device.ProductID:X4})";
        return true;
    }

    public BatteryReading ReadBattery()
    {
        if (_stream is null)
            throw new InvalidOperationException("Device not connected.");
        return ReadBatteryCore()
            ?? throw new InvalidOperationException("OpenMouse battery reply empty - wake the mouse, then refresh.");
    }

    private BatteryReading? ReadBatteryCore() => _kind switch
    {
        Kind.Report8Vgn => ReadReport8(vgnChecksum: true),
        Kind.Report8Teevolution => ReadReport8(vgnChecksum: false),
        Kind.Compx => ReadCompx(),
        Kind.Ksnake => ReadKsnake(),
        Kind.SteelAa01 => ReadSteelAa01(),
        Kind.SteelPrime => ReadSteelPrime(),
        Kind.Razer => ReadRazer(),
        Kind.KeychronNape => ReadKeychronNape(),
        Kind.KeychronM6 => ReadKeychronM6(),
        Kind.Wallhack => ReadWallhack(),
        Kind.Mchose => ReadMchose(),
        Kind.Ninjutso => ReadNinjutso(),
        Kind.GloriousClassic => ReadGloriousClassic(),
        Kind.Dareu => ReadDareu(),
        Kind.Bitmouse => ReadBitmouse(),
        Kind.Ajazz => ReadAjazz(),
        _ => null,
    };

    private BatteryReading? ReadReport8(bool vgnChecksum)
    {
        if (_stream is null) return null;
        var payload = new byte[16];
        payload[0] = 0x04; // battery
        payload[15] = vgnChecksum
            ? Report8ChecksumVgn(payload)
            : Report8ChecksumTeevolution(payload);

        var reply = OmHid.OutputExchange(_stream, 0x08, payload, 17, attempts: 10);
        if (reply is null || reply.Length < 7) return null;
        if (reply[0] != 0x04 || reply[1] != 0) return null;
        var percent = reply[5];
        if (percent > 100) return null;
        return ToReading(Math.Max((int)percent, 1), reply[6] == 1);
    }

    /// <summary>
    /// Compax / Lamzu / WLMouse: 64B feature report id 0.
    /// Request: status@0=0, target@2=0x02, len@3=0x02, page@4=0, cmd@5=0x83.
    /// Reply OK status 0xa1; charging@6, percent@7.
    /// </summary>
    private BatteryReading? ReadCompx()
    {
        if (_stream is null) return null;
        var report = new byte[64];
        report[0] = 0x00; // request
        report[2] = 0x02; // target mouse
        report[3] = 0x02; // length
        report[4] = 0x00; // page device
        report[5] = 0x83; // battery

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var reply = OmHid.FeatureReportRaw(_stream, report, attempts: 1);
            if (reply is null || reply.Length < 8) continue;
            // pending/busy → retry
            if (reply[0] is 0xa0 or 0xa3)
            {
                Thread.Sleep(40);
                continue;
            }
            if (reply[0] != 0xa1) return null;
            if (reply[4] != 0x00 || reply[5] != 0x83) continue;
            var charging = reply[6] == 1;
            var percent = reply[7];
            if (percent is < 1 or > 100) return null;
            return ToReading(percent, charging);
        }

        return null;
    }

    /// <summary>
    /// Glorious classic (mouse.py): body[2]=0x02, body[3]=0x02, body[5]=0x83.
    /// Response: status@0, echo@5=0x83, charging@6, percent@7.
    /// </summary>
    private BatteryReading? ReadGloriousClassic()
    {
        if (_stream is null) return null;
        var report = new byte[64];
        report[2] = 0x02;
        report[3] = 0x02;
        report[5] = 0x83;

        for (var attempt = 0; attempt < 8; attempt++)
        {
            var reply = OmHid.FeatureReportRaw(_stream, report, attempts: 1);
            if (reply is null || reply.Length < 8) continue;
            if (reply[0] is 0xa0) // waking
            {
                Thread.Sleep(50);
                continue;
            }
            if (reply[5] != 0x83) return null;
            if (reply[0] != 0xa1) return null; // Normal only
            var charging = reply[6] == 1;
            var percent = reply[7] == 0 ? 1 : reply[7];
            if (percent is < 1 or > 100) return null;
            return ToReading(percent, charging);
        }

        return null;
    }

    private BatteryReading? ReadKsnake()
    {
        if (_stream is null) return null;
        var payload = new byte[64];
        payload[0] = 0x55;
        payload[1] = 0x30; // GET_BATTERY
        byte[] tail = [0xa5, 0x0b, 0x2e, 0x01, 0x01, 0x00, 0x00, 0x00];
        Buffer.BlockCopy(tail, 0, payload, 2, tail.Length);
        var reply = OmHid.OutputExchange(_stream, 0x00, payload, 65, attempts: 8);
        if (reply is null || reply.Length < 10) return null;
        var percent = reply[8];
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, reply[9] != 0);
    }

    private BatteryReading? ReadAjazz()
    {
        if (_stream is null) return null;
        // Report 0xF0, body[0]=0x30 GET_BATTERY, body[1]=0x01. Percent@7, charge@8.
        var payload = new byte[63];
        payload[0] = 0x30;
        payload[1] = 0x01;
        var reply = OmHid.OutputExchange(_stream, 0xF0, payload, 64, attempts: 8);
        if (reply is null || reply.Length < 9 || reply[0] != 0x30) return null;
        var percent = reply[7];
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, reply[8] != 0);
    }

    private BatteryReading? ReadSteelAa01()
    {
        if (_stream is null) return null;
        var reply = OmHid.OutputExchange(_stream, 0x00, [0xAA, 0x01], 8, attempts: 8);
        if (reply is null || reply.Length < 1) return null;
        var percent = reply[0];
        if (percent is < 1 or > 100) return null;
        var charging = reply.Length > 2 && reply[2] != 0;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadSteelPrime()
    {
        if (_stream is null) return null;
        // Aerox 3/5 wireless: 0x92 wired, 0xD2 (=0x92|0x40) on dongle.
        byte cmd = _steelWirelessBit != 0 ? (byte)0xD2 : (byte)0x92;
        var reply = OmHid.OutputExchange(_stream, 0x00, [cmd], 8, attempts: 8);
        if (reply is null || reply.Length < 2) return null;
        // Echo cmd at [0]; status at [1]: bit7 charging, low 7 bits 1-based ×5 %.
        var s = reply[0] == cmd ? reply[1] : reply[0];
        var charging = (s & 0x80) != 0;
        var percent = ((s & 0x7F) - 1) * 5;
        if (percent is < 0 or > 100) return null;
        return ToReading(Math.Max(percent, 1), charging);
    }

    private BatteryReading? ReadRazer()
    {
        if (_stream is null) return null;
        foreach (byte txn in new byte[] { 0x1F, 0x3F, 0xFF })
        {
            var bat = RazerExchange(txn, commandClass: 0x07, commandId: 0x80, dataSize: 0x02);
            if (bat is null || bat.Length < 10) continue;
            if (bat[0] is not 0x02) continue;
            var raw = bat[9] != 0 ? bat[9] : bat[8];
            var percent = (int)Math.Round(raw * 100.0 / 255.0);
            if (percent is < 1 or > 100) continue;
            var chg = RazerExchange(txn, commandClass: 0x07, commandId: 0x84, dataSize: 0x02);
            var charging = chg is { Length: > 9 } && chg[0] == 0x02 && chg[9] == 1;
            return ToReading(percent, charging);
        }
        return null;
    }

    /// <summary>
    /// Logical 90-byte Razer V4 body; OmHid.FeatureReportRaw adds Windows report-id 0 if needed.
    /// </summary>
    private byte[]? RazerExchange(byte txn, byte commandClass, byte commandId, byte dataSize)
    {
        if (_stream is null) return null;
        var body = new byte[90];
        body[1] = txn;
        body[5] = dataSize;
        body[6] = commandClass;
        body[7] = commandId;
        byte xor = 0;
        for (var i = 2; i <= 87; i++)
            xor ^= body[i];
        body[88] = xor;

        for (var attempt = 0; attempt < 6; attempt++)
        {
            var reply = OmHid.FeatureReportRaw(_stream, body, attempts: 1);
            if (reply is null || reply.Length < 90) continue;
            if (reply[0] == 0x02) return reply;
            if (reply[0] is 0x01 or 0x00)
            {
                Thread.Sleep(40);
                continue;
            }
        }

        return null;
    }

    private BatteryReading? ReadKeychronNape()
    {
        if (_stream is null) return null;
        // miscGroup 0xA7 + getBattery 0x31 (49)
        var payload = new byte[32];
        payload[0] = 0xA7;
        payload[1] = 0x31;
        var reply = OmHid.OutputExchange(_stream, 0x00, payload, 33, attempts: 8);
        if (reply is null || reply.Length < 4) return null;
        if (reply[0] != 0xA7 || reply[1] != 0x31) return null;
        var percent = reply[2];
        if (percent is < 1 or > 100) return null;
        var state = reply[3];
        var status = state == 2 ? BatteryStatus.Full
            : state == 1 ? BatteryStatus.Charging
            : BatteryStatus.Discharging;
        return new BatteryReading(percent, status);
    }

    private BatteryReading? ReadKeychronM6()
    {
        if (_stream is null) return null;
        var payload = new byte[63];
        payload[0] = 0x06; // STATUS
        var reply = OmHid.OutputExchange(_stream, 0xB3, payload, 64, attempts: 8);
        if (reply is null || reply.Length < 20) return null;
        // Reply often echoes cmd 0x06 at [0]; battery nibble at [19].
        if (reply[0] != 0x06) return null;
        var b = reply[19];
        var percent = b & 0x7F;
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, (b & 0x80) != 0);
    }

    private BatteryReading? ReadWallhack()
    {
        if (_stream is null) return null;
        var payload = new byte[63];
        payload[0] = 0x00;
        payload[1] = 0x00;
        payload[2] = 0xBA;
        var reply = OmHid.OutputExchange(_stream, 0x04, payload, 64, attempts: 8);
        if (reply is null || reply.Length < 9) return null;
        if (reply[2] != 0xBA) return null;
        var percent = reply[7];
        if (percent > 100) return null;
        return ToReading(Math.Max((int)percent, 1), reply[8] == 1);
    }

    /// <summary>
    /// MCHOSE: feature 0x11, whole body bit-inverted. Battery cmd 0x06.
    /// After strip report-id: [~cmd, ~p0…]; payload[i]=~(reply[i+1]); % @payload[9].
    /// </summary>
    private BatteryReading? ReadMchose()
    {
        if (_stream is null) return null;
        var body = new byte[63];
        // Short channel spells 20 tokens; only cmd 0x06 is needed.
        body[0] = unchecked((byte)~0x06);

        byte[]? previous = null;
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var reply = OmHid.FeatureExchange(_stream, 0x11, body, 64, attempts: 1);
            if (reply is null || reply.Length < 12) continue;
            var cmd = unchecked((byte)~reply[0]);
            if (cmd != 0x06) continue;

            var payload = new byte[reply.Length - 1];
            for (var i = 0; i < payload.Length; i++)
                payload[i] = unchecked((byte)~reply[i + 1]);

            if (payload.Length < 11) continue;
            var percent = payload[9];
            if (percent is < 1 or > 100) continue;
            var charging = payload[10] != 0;

            // OpenMouse waits until two consecutive payloads match.
            if (previous is not null
                && previous.Length == payload.Length
                && previous.AsSpan().SequenceEqual(payload))
            {
                return ToReading(percent, charging);
            }

            previous = payload;
            Thread.Sleep(30);
        }

        // Fall back to last good sample if the mouse never settled.
        if (previous is { Length: >= 11 })
        {
            var percent = previous[9];
            if (percent is >= 1 and <= 100)
                return ToReading(percent, previous[10] != 0);
        }

        return null;
    }

    /// <summary>
    /// Ninjutso current protocol: feature report 6, request
    /// [cmd,0,0,1,0,argLen,profile,…]. Windows GetFeature keeps report id @0,
    /// so value is at [8] when bytes[1]==cmd (OpenMouse ninjutsoResponseValue).
    /// </summary>
    private BatteryReading? ReadNinjutso()
    {
        if (_stream is null) return null;

        byte[]? ReadCmd(byte command)
        {
            var body = new byte[15];
            body[0] = command;
            body[1] = 0x00;
            body[2] = 0x00;
            body[3] = 0x01;
            body[4] = 0x00;
            body[5] = 0x00; // argLen
            body[6] = 0x00; // profile

            for (var attempt = 0; attempt < 4; attempt++)
            {
                var full = OmHid.FeatureExchangeKeepId(_stream, 0x06, body, 16, attempts: 1);
                if (full is { Length: >= 9 } && full[1] == command)
                    return full.AsSpan(8).ToArray();

                // WebHID-shaped (no leading report id)
                var stripped = OmHid.FeatureExchange(_stream, 0x06, body, 16, attempts: 1);
                if (stripped is { Length: >= 8 } && stripped[0] == command)
                    return stripped.AsSpan(7).ToArray();

                Thread.Sleep(40);
            }

            return null;
        }

        var bat = ReadCmd(0x12); // batteryPercent
        if (bat is { Length: > 0 })
        {
            var percent = bat[0];
            if (percent is >= 1 and <= 100)
            {
                var chg = ReadCmd(0x11); // batteryCharging
                var charging = chg is { Length: > 0 } && chg[0] != 0;
                return ToReading(percent, charging);
            }
        }

        // Legacy feature report 5
        var leg = OmHid.FeatureExchange(_stream, 0x05, new byte[31], 32, attempts: 4);
        if (leg is null || leg.Length < 9) return null;
        var p = leg[7];
        if (p is < 1 or > 100) return null;
        return ToReading(p, leg[8] == 1);
    }

    /// <summary>Dareu Jm: output report 8, cmd 4, percent@5, status@6.</summary>
    private BatteryReading? ReadDareu()
    {
        if (_stream is null) return null;
        var body = new byte[16];
        body[0] = 0x04; // GET_BATTERY
        // Checksum over [reportId=8]+body[0..14] into body[15]
        int sum = 0x08;
        for (var i = 0; i < 15; i++) sum += body[i];
        body[15] = (byte)((sum < 55 ? 85 - sum : 341 - sum) & 0xff);

        var reply = OmHid.OutputExchange(_stream, 0x08, body, 17, attempts: 8);
        if (reply is null || reply.Length < 7 || reply[0] != 0x04) return null;
        var percent = reply[5];
        if (percent > 100) return null;
        // status raw; treat non-zero as charging (Jm leaves meaning vendor-specific)
        return ToReading(Math.Max((int)percent, 1), reply[6] != 0);
    }

    /// <summary>
    /// ATK / VXE Bitmouse: output report 0x08, 63-byte frame, cmd getBatteryLevel=7.
    /// </summary>
    private BatteryReading? ReadBitmouse()
    {
        if (_stream is null) return null;

        byte[] Encode(byte commandId, byte paramLen, byte cmdLen)
        {
            var frame = new byte[63];
            frame[1] = 0x72;
            frame[2] = paramLen;
            frame[3] = 0;
            frame[4] = _bitmouseTarget;
            frame[5] = commandId;
            frame[6] = cmdLen;
            int sum = 0;
            for (var i = 1; i < frame.Length; i++) sum += frame[i];
            frame[0] = (byte)(sum & 0xff);
            return frame;
        }

        var levelFrame = Encode(commandId: 7, paramLen: 2, cmdLen: 1);
        var reply = OmHid.OutputExchange(_stream, 0x08, levelFrame, 64, attempts: 8);
        if (reply is null || reply.Length < 7 || reply[0] != 0x72) return null;
        if (reply[1] == 0xff) return null; // error
        if (reply[4] != 7) return null;
        var percent = reply[6];
        if (percent is < 1 or > 100) return null;

        var chgFrame = Encode(commandId: 15, paramLen: 2, cmdLen: 1);
        var chg = OmHid.OutputExchange(_stream, 0x08, chgFrame, 64, attempts: 4);
        var charging = chg is { Length: > 6 } && chg[0] == 0x72 && chg[4] == 15 && chg[6] != 0;
        return ToReading(percent, charging);
    }

    public void Disconnect()
    {
        _stream?.Dispose();
        _stream = null;
        _device = null;
        _deviceLabel = null;
    }

    public void Dispose() => Disconnect();

    private static BatteryReading ToReading(int percent, bool charging) =>
        new(
            percent,
            charging
                ? (percent >= 100 ? BatteryStatus.Full : BatteryStatus.Charging)
                : BatteryStatus.Discharging);

    private static byte Report8ChecksumVgn(byte[] payload15PlusCs)
    {
        int sum = 0x08;
        for (var i = 0; i < 15; i++)
            sum += payload15PlusCs[i];
        return (byte)((0x55 - (sum & 0xff)) & 0xff);
    }

    private static byte Report8ChecksumTeevolution(byte[] payload15PlusCs)
    {
        int sum = 0;
        for (var i = 0; i < 15; i++)
            sum += payload15PlusCs[i];
        return (byte)((0x55 - sum - 0x08) & 0xff);
    }

    private static bool GuessSteelWireless(HidDevice device)
    {
        try
        {
            var name = device.GetProductName() ?? "";
            if (name.Contains("Wireless", StringComparison.OrdinalIgnoreCase)) return true;
            if (name.Contains("Receiver", StringComparison.OrdinalIgnoreCase)) return true;
        }
        catch { /* ignore */ }
        return true;
    }

    private static byte GuessBitmouseTarget(HidDevice device, int productId)
    {
        // Receivers / dongle PIDs talk to the mouse on target 1.
        try
        {
            var name = device.GetProductName() ?? "";
            if (name.Contains("Receiver", StringComparison.OrdinalIgnoreCase)) return 1;
            if (name.Contains("Dongle", StringComparison.OrdinalIgnoreCase)) return 1;
        }
        catch { /* ignore */ }
        // ATK 0x373b:0x1154/1155 are typically receivers in the catalog.
        if (productId is 0x1154 or 0x1155) return 1;
        return 0;
    }

    private static List<(Kind kind, int minLen, bool feature)> ProbesFor(string brand, int vendorId, int productId)
    {
        var b = brand ?? "";
        var list = new List<(Kind, int, bool)>();

        void Add(Kind k, int min, bool feat) => list.Add((k, min, feat));

        if (Eq(b, "G-Wolves") || Eq(b, "GWolves") || vendorId == 0x33E4)
        {
            Add(Kind.Report8Vgn, 17, false);
        }
        else if (vendorId == 0x373B || Eq(b, "ATK") && productId is 0x1154 or 0x1155)
        {
            // Newer ATK / VXE Bitmouse family (usage 0xff05).
            Add(Kind.Bitmouse, 64, false);
            Add(Kind.Report8Vgn, 17, false);
        }
        else if (Eq(b, "VGN") || Eq(b, "Pulsar") || Eq(b, "ATK") || vendorId is 0x3554 or 0x3710)
        {
            if (Eq(b, "Teevolution") || productId is 0xF520 or 0xF522 or 0xF523 or 0xF5BB)
                Add(Kind.Report8Teevolution, 17, false);
            Add(Kind.Report8Vgn, 17, false);
            if (Eq(b, "Teevolution"))
                Add(Kind.Report8Teevolution, 17, false);
        }
        else if (Eq(b, "Teevolution"))
        {
            Add(Kind.Report8Teevolution, 17, false);
            Add(Kind.Report8Vgn, 17, false);
        }
        else if (Eq(b, "Dareu") || vendorId == 0x260D)
        {
            Add(Kind.Dareu, 17, false);
            Add(Kind.Report8Vgn, 17, false);
        }
        else if (Eq(b, "Lamzu") || vendorId is 0x373E or 0x37B0 or 0x36A7)
        {
            Add(Kind.Compx, 64, true);
        }
        else if (Eq(b, "Glorious"))
        {
            Add(Kind.GloriousClassic, 64, true);
            Add(Kind.Compx, 64, true);
        }
        else if (Eq(b, "K-snake") || Eq(b, "Ksnake") || vendorId is 0xA8A4 or 0xA8A5)
        {
            Add(Kind.Ksnake, 65, false);
            Add(Kind.Ajazz, 64, false); // same VIDs, report 0xF0 NJ07/NJ08
        }
        else if (Eq(b, "SteelSeries") || vendorId == 0x1038)
        {
            Add(Kind.SteelPrime, 8, false);
            Add(Kind.SteelAa01, 8, false);
        }
        else if (Eq(b, "Razer") || vendorId == 0x1532)
        {
            Add(Kind.Razer, 90, true);
        }
        else if (Eq(b, "Keychron") || vendorId == 0x3434)
        {
            Add(Kind.KeychronNape, 33, false);
            Add(Kind.KeychronM6, 64, false);
        }
        else if (Eq(b, "WALLHACK") || Eq(b, "Wallhack") || vendorId == 0x3879)
        {
            Add(Kind.Wallhack, 64, false);
        }
        else if (Eq(b, "MCHOSE") || Eq(b, "Mchose") || b.StartsWith("Mchose", StringComparison.OrdinalIgnoreCase) || vendorId == 0x3837)
        {
            Add(Kind.Mchose, 64, true);
        }
        else if (Eq(b, "Ninjutso") || vendorId is 0x093A or 0x1915)
        {
            Add(Kind.Ninjutso, 16, true);
        }
        else if (Eq(b, "Finalmouse"))
        {
            // Finalmouse ULX is event-driven; no stable query
        }
        else
        {
            Add(Kind.Report8Vgn, 17, false);
            Add(Kind.Bitmouse, 64, false);
            Add(Kind.Compx, 64, true);
            Add(Kind.Dareu, 17, false);
            Add(Kind.SteelPrime, 8, false);
            Add(Kind.SteelAa01, 8, false);
        }

        return list;
    }

    private static bool Eq(string a, string b) =>
        string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
}
