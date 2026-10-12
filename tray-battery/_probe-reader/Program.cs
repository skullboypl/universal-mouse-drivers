using UmdBatteryTray.Protocol;
using UmdBatteryTray.Protocol.Mice.Razer.ViperV4Pro;
using UmdBatteryTray.Protocol.OpenMouse;

Console.WriteLine("1) Native Viper...");
using (var r = new ViperV4ProBatteryReader())
{
    r.Connect(0x00E6);
    Console.WriteLine("   " + r.ReadBattery().Percent + "%");
}

Console.WriteLine("2) OM Razer port via TryConnect...");
var om = OmPortedBatteryReader.TryConnect("Razer", 0x1532, 0x00E6);
if (om is null) Console.WriteLine("   FAIL TryConnect null");
else
{
    Console.WriteLine("   " + om.ReadBattery().Percent + "%  " + om.DeviceLabel);
    om.Dispose();
}

Console.WriteLine("3) Facade...");
using var u = new UmdBatteryReader();
u.Connect("1532:00E6");
Console.WriteLine("   " + u.ReadBattery().Percent + "%");
