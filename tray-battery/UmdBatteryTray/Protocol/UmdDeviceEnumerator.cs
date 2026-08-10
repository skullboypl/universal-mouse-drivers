using HidSharp;

namespace UmdBatteryTray.Protocol;

internal static class UmdDeviceEnumerator
{
    /// <summary>
    /// Lists unique VID:PID pairs currently attached for King Ultra + Fenrir Max.
    /// Does not open streams (safe while Chrome WebHID holds a handle).
    /// </summary>
    public static IReadOnlyList<UmdDeviceInfo> ListAvailable()
    {
        var byKey = new Dictionary<string, UmdDeviceInfo>(StringComparer.OrdinalIgnoreCase);

        foreach (var pid in KingUltraConstants.ProductIds)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(KingUltraConstants.VendorId, pid))
            {
                var key = $"{d.VendorID:X4}:{d.ProductID:X4}";
                if (byKey.ContainsKey(key))
                    continue;
                string name;
                try { name = d.GetProductName() ?? "King Ultra"; }
                catch { name = "King Ultra"; }
                byKey[key] = new UmdDeviceInfo(
                    UmdDeviceKind.KingUltra,
                    d.VendorID,
                    d.ProductID,
                    name);
            }
        }

        foreach (var pid in GwolvesConstants.ProductIds)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(GwolvesConstants.VendorId, pid))
            {
                var key = $"{d.VendorID:X4}:{d.ProductID:X4}";
                if (byKey.ContainsKey(key))
                    continue;
                string name;
                try { name = d.GetProductName() ?? "Fenrir Max"; }
                catch { name = "Fenrir Max"; }
                byKey[key] = new UmdDeviceInfo(
                    UmdDeviceKind.FenrirMax,
                    d.VendorID,
                    d.ProductID,
                    name);
            }
        }

        // King Ultra first (historical default), then Fenrir; within family prefer wireless PIDs.
        return byKey.Values
            .OrderBy(d => d.Kind == UmdDeviceKind.KingUltra ? 0 : 1)
            .ThenByDescending(d => IsWirelessPid(d) ? 1 : 0)
            .ThenBy(d => d.ProductId)
            .ToList();
    }

    private static bool IsWirelessPid(UmdDeviceInfo d) =>
        d.Kind == UmdDeviceKind.KingUltra
            ? d.ProductId is KingUltraConstants.PidDongle8K or KingUltraConstants.PidDongleAlt
            : d.ProductId == GwolvesConstants.FenrirMaxWirelessPid;

    public static UmdDeviceInfo? ResolvePreferred(
        IReadOnlyList<UmdDeviceInfo> available,
        string? preferredKey)
    {
        if (available.Count == 0)
            return null;

        if (!string.IsNullOrWhiteSpace(preferredKey))
        {
            var match = available.FirstOrDefault(d =>
                string.Equals(d.Key, preferredKey, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
                return match;
        }

        return available[0];
    }
}
