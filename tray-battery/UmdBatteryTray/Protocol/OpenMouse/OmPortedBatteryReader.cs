using HidSharp;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.OpenMouse;

/// <summary>
/// OpenMouse AGPL battery codecs ported to HidSharp (read-only %).
/// Covers catalog brands that expose a battery HID path in @openmouse/protocol.
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
    }

    private Kind _kind;
    private HidStream? _stream;
    private HidDevice? _device;
    private string? _deviceLabel;
    private byte _reportId;
    private int _steelWirelessBit; // 0=wired 0x92, 1=wireless 0xD2

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
        HidDevice? device = probe.feature
            ? OmHid.PickByMaxFeature(vendorId, productId, probe.minLen)
            : OmHid.PickByMaxOutput(vendorId, productId, probe.minLen);
        device ??= OmHid.PickAny(vendorId, productId);
        if (device is null) return false;

        _stream = OmHid.Open(device);
        _device = device;
        _kind = probe.kind;
        _reportId = DefaultReportId(probe.kind);
        _steelWirelessBit = productId; // unused except SteelPrime uses wireless heuristic
        if (probe.kind is Kind.SteelPrime)
            _steelWirelessBit = GuessSteelWireless(device) ? 1 : 0;

        // Smoke-read once so we don't claim a family that never answers.
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
        if (reply[0] != 0x04) return null;
        var percent = reply[5];
        if (percent is < 1 or > 100) return null;
        var charging = reply[6] != 0;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadCompx()
    {
        if (_stream is null) return null;
        // [00,00,02,02,00,83] + pad → feature report 0, 64B body after report id
        var body = new byte[63];
        body[0] = 0x00;
        body[1] = 0x00;
        body[2] = 0x02;
        body[3] = 0x02;
        body[4] = 0x00;
        body[5] = 0x83;
        var reply = OmHid.FeatureExchange(_stream, 0x00, body, 64, attempts: 8);
        if (reply is null || reply.Length < 8) return null;
        // skip 6-byte header; charging=[0], percent=[1] of payload after header
        var charging = reply[6] == 1;
        var percent = reply[7];
        // Some firmwares echo status 0xA1 at [0]
        if (percent is < 1 or > 100)
        {
            // alternate layout used by Glorious classic: body[6]/[7]
            charging = reply[6] == 1;
            percent = reply[7];
        }
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadGloriousClassic()
    {
        if (_stream is null) return null;
        var body = new byte[63];
        body[2] = 0x02;
        body[3] = 0x02;
        body[5] = 0x83;
        var reply = OmHid.FeatureExchange(_stream, 0x00, body, 64, attempts: 8);
        if (reply is null || reply.Length < 8) return null;
        if (reply[5] != 0x83 && reply.Length > 5) { /* echo optional */ }
        var charging = reply[6] == 1;
        var percent = reply[7];
        if (percent == 0) percent = 1;
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadKsnake()
    {
        if (_stream is null) return null;
        var payload = new byte[64];
        payload[0] = 0x55;
        payload[1] = 0x30;
        byte[] tail = [0xa5, 0x0b, 0x2e, 0x01, 0x01, 0x00, 0x00, 0x00];
        Buffer.BlockCopy(tail, 0, payload, 2, tail.Length);
        var reply = OmHid.OutputExchange(_stream, 0x00, payload, 65, attempts: 8);
        if (reply is null || reply.Length < 10) return null;
        var percent = reply[8];
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, reply[9] != 0);
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
        byte cmd = _steelWirelessBit != 0 ? (byte)0xD2 : (byte)0x92;
        var reply = OmHid.OutputExchange(_stream, 0x00, [cmd], 8, attempts: 8);
        if (reply is null || reply.Length < 2) return null;
        var s = reply[1];
        var charging = (s & 0x80) != 0;
        var percent = ((s & 0x7F) - 1) * 5;
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadRazer()
    {
        if (_stream is null) return null;
        foreach (byte txn in new byte[] { 0x1F, 0x3F, 0xFF })
        {
            var bat = RazerExchange(txn, commandClass: 0x07, commandId: 0x80, dataSize: 0x02);
            if (bat is null || bat.Length < 10) continue;
            var raw = bat[9]; // args[1]
            var percent = (int)Math.Round(raw * 100.0 / 255.0);
            if (percent is < 1 or > 100) continue;
            var chg = RazerExchange(txn, commandClass: 0x07, commandId: 0x84, dataSize: 0x02);
            var charging = chg is { Length: > 9 } && chg[9] == 1;
            return ToReading(percent, charging);
        }
        return null;
    }

    private byte[]? RazerExchange(byte txn, byte commandClass, byte commandId, byte dataSize)
    {
        if (_stream is null) return null;
        var pkt = new byte[89]; // body after report id; total feature 90
        pkt[0] = 0x00; // status
        pkt[1] = txn;
        pkt[5] = dataSize;
        pkt[6] = commandClass;
        pkt[7] = commandId;
        // XOR checksum over bytes [2..87] of full 90-byte packet → index 88
        // Full packet = [reportId=0] + pkt[0..88]
        var full = new byte[90];
        full[0] = 0x00;
        Buffer.BlockCopy(pkt, 0, full, 1, 89);
        byte xor = 0;
        for (var i = 2; i < 88; i++)
            xor ^= full[i];
        full[88] = xor;
        var body = full.AsSpan(1).ToArray();
        return OmHid.FeatureExchange(_stream, 0x00, body, 90, attempts: 4);
    }

    private BatteryReading? ReadKeychronNape()
    {
        if (_stream is null) return null;
        var payload = new byte[32];
        payload[0] = 0xA7;
        payload[1] = 0x31;
        var reply = OmHid.OutputExchange(_stream, 0x00, payload, 33, attempts: 8);
        if (reply is null || reply.Length < 4) return null;
        var percent = reply[2];
        if (percent is < 1 or > 100) return null;
        var state = reply[3];
        var charging = state is 1 or 2;
        var status = state == 2 ? BatteryStatus.Full
            : state == 1 ? BatteryStatus.Charging
            : BatteryStatus.Discharging;
        return new BatteryReading(percent, status);
    }

    private BatteryReading? ReadKeychronM6()
    {
        if (_stream is null) return null;
        var payload = new byte[63];
        payload[0] = 0x06;
        var reply = OmHid.OutputExchange(_stream, 0xB3, payload, 64, attempts: 8);
        if (reply is null || reply.Length < 20) return null;
        // response often on 0xB4; OutputExchange may strip B3 — accept either
        if (reply[0] != 0x06 && reply.Length > 1)
        {
            // try reading again with drain if first byte wrong
        }
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
        if (percent is < 1 or > 100) return null;
        return ToReading(percent, reply[8] == 1);
    }

    private BatteryReading? ReadMchose()
    {
        if (_stream is null) return null;
        // bit-invert command 0x06 → 0xF9
        var body = new byte[63];
        body[0] = unchecked((byte)~0x06);
        var reply = OmHid.FeatureExchange(_stream, 0x11, body, 64, attempts: 8);
        if (reply is null || reply.Length < 12) return null;
        // invert from start of reply payload
        var decoded = new byte[reply.Length];
        for (var i = 0; i < reply.Length; i++)
            decoded[i] = unchecked((byte)~reply[i]);
        // OpenMouse: invert from raw[2]; after stripping report id, payload[0] was cmd
        // Use offsets relative to inverted body: percent at [9], charging [10]
        var percent = decoded.Length > 9 ? decoded[9] : 0;
        if (percent is < 1 or > 100) return null;
        var charging = decoded.Length > 10 && decoded[10] != 0;
        return ToReading(percent, charging);
    }

    private BatteryReading? ReadNinjutso()
    {
        if (_stream is null) return null;
        // Current: feature report 6, cmd 0x12 → value at [8]
        var body = new byte[15];
        body[0] = 0x12;
        body[1] = 0x00;
        body[2] = 0x00;
        body[3] = 0x01;
        var reply = OmHid.FeatureExchange(_stream, 0x06, body, 16, attempts: 6);
        if (reply is not null && reply.Length > 8 && reply[1] == 0x12)
        {
            var percent = reply[8];
            if (percent is >= 1 and <= 100)
            {
                var chgBody = new byte[15];
                chgBody[0] = 0x11;
                chgBody[3] = 0x01;
                var chg = OmHid.FeatureExchange(_stream, 0x06, chgBody, 16, attempts: 4);
                var charging = chg is { Length: > 8 } && chg[8] != 0;
                return ToReading(percent, charging);
            }
        }

        // Legacy feature report 5: percent [7], charging [8]
        var leg = OmHid.FeatureExchange(_stream, 0x05, new byte[31], 32, attempts: 4);
        if (leg is null || leg.Length < 9) return null;
        var p = leg[7];
        if (p is < 1 or > 100) return null;
        return ToReading(p, leg[8] == 1);
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

    private static byte DefaultReportId(Kind kind) => kind switch
    {
        Kind.Report8Vgn or Kind.Report8Teevolution => 0x08,
        Kind.Wallhack => 0x04,
        Kind.KeychronM6 => 0xB3,
        Kind.Mchose => 0x11,
        Kind.Ninjutso => 0x06,
        _ => 0x00,
    };

    private static bool GuessSteelWireless(HidDevice device)
    {
        try
        {
            var name = device.GetProductName() ?? "";
            if (name.Contains("Wireless", StringComparison.OrdinalIgnoreCase)) return true;
            if (name.Contains("Receiver", StringComparison.OrdinalIgnoreCase)) return true;
        }
        catch { /* ignore */ }
        return true; // prefer D2 for tray mice
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
        else if (Eq(b, "VGN") || Eq(b, "Pulsar") || Eq(b, "ATK") || vendorId is 0x3554 or 0x3710 or 0x373B)
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
        }
        else if (Eq(b, "SteelSeries") || vendorId == 0x1038)
        {
            Add(Kind.SteelAa01, 8, false);
            Add(Kind.SteelPrime, 8, false);
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
        else if (Eq(b, "MCHOSE") || Eq(b, "Mchose") || vendorId == 0x3837)
        {
            Add(Kind.Mchose, 64, true);
        }
        else if (Eq(b, "Ninjutso") || vendorId is 0x093A or 0x1915)
        {
            Add(Kind.Ninjutso, 16, true);
        }
        else if (Eq(b, "Finalmouse"))
        {
            // Finalmouse ULX is event-driven; no stable query - skip
        }
        else
        {
            // Unknown brand: try common families by VID heuristics already handled;
            // last-resort cascade for odd catalog names.
            Add(Kind.Report8Vgn, 17, false);
            Add(Kind.Compx, 64, true);
            Add(Kind.SteelAa01, 8, false);
        }

        return list;
    }

    private static bool Eq(string a, string b) =>
        string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
}
