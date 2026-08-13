namespace UmdBatteryTray.Protocol;

internal enum BatteryStatus
{
    Unknown = 0,
    Discharging = 1,
    Charging = 2,
    Full = 3,
}

internal readonly record struct BatteryReading(int Percent, BatteryStatus Status);
