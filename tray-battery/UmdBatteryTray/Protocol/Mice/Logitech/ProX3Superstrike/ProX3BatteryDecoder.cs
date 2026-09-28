using UmdBatteryTray.Protocol;

namespace UmdBatteryTray.Protocol.Mice.Logitech.ProX3Superstrike;

/// <summary>Pure decoder for feature 0x1004 function 1. No HID I/O.</summary>
internal static class ProX3BatteryDecoder
{
    internal static BatteryReading? Decode(ReadOnlySpan<byte> parameters)
    {
        if (parameters.Length < 3 || parameters[0] > 100) return null;

        var status = parameters[2] switch
        {
            0 => BatteryStatus.Discharging,
            1 or 3 => BatteryStatus.Charging,
            2 => BatteryStatus.Full,
            _ => BatteryStatus.Unknown,
        };
        return new BatteryReading(parameters[0], status);
    }
}
