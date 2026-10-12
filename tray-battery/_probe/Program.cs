using HidSharp;

// Mirror fixed Viper reader wire layout and verify live %.
static byte[] BuildBody(byte cls, byte id, byte size, byte txn)
{
    var r = new byte[90];
    r[1] = txn; r[5] = size; r[6] = cls; r[7] = id;
    byte xor = 0; for (var i = 2; i <= 87; i++) xor ^= r[i];
    r[88] = xor;
    return r;
}
static byte[] ToWire(byte[] body)
{
    var w = new byte[91];
    w[0] = 0;
    Buffer.BlockCopy(body, 0, w, 1, 90);
    return w;
}

var d = DeviceList.Local.GetHidDevices(0x1532, 0x00E6)
    .Where(x => { try { return x.GetMaxFeatureReportLength() >= 91; } catch { return false; } })
    .First();
if (!d.TryOpen(out var s)) { Console.WriteLine("OPEN FAIL"); return; }
s.ReadTimeout = 500; s.WriteTimeout = 500;
byte txn = 0x1F;
for (var i = 0; i < 5; i++)
{
    var wire = ToWire(BuildBody(0x07, 0x80, 0x02, txn));
    txn = (byte)((txn + 1) & 0xff); if (txn == 0) txn = 1;
    s.SetFeature(wire);
    Thread.Sleep(45);
    var reply = new byte[91]; reply[0] = 0;
    s.GetFeature(reply);
    var body = reply.AsSpan(1, 90).ToArray();
    if (body[0] != 0x02) { Console.WriteLine($"busy/status={body[0]:X2}"); Thread.Sleep(40); continue; }
    var pct = (int)Math.Round(body[9] * 100.0 / 255.0);
    var cw = ToWire(BuildBody(0x07, 0x84, 0x02, txn));
    txn = (byte)((txn + 1) & 0xff); if (txn == 0) txn = 1;
    s.SetFeature(cw); Thread.Sleep(45);
    var cr = new byte[91]; cr[0] = 0; s.GetFeature(cr);
    var cbody = cr.AsSpan(1, 90).ToArray();
    var charging = cbody[0] == 0x02 && cbody[9] == 1;
    Console.WriteLine($"BATTERY {pct}% charging={charging} raw={body[9]:X2}");
    s.Dispose();
    return;
}
Console.WriteLine("FAIL no OK status");
s.Dispose();
