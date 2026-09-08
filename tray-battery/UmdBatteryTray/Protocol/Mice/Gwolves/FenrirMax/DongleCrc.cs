namespace UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;

/// <summary>CRC for 16-byte dongle output reports (report id 8) — same as web-app crc.ts.</summary>
internal static class DongleCrc
{
    public static byte Compute(ReadOnlySpan<byte> data, int length = -1)
    {
        if (length < 0)
            length = data.Length - 1;

        var sum = 0;
        for (var i = 0; i < length; i++)
            sum += data[i];

        return (byte)((85 - (sum & 0xFF)) & 0xFF);
    }
}
