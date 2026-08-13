using HidSharp;
using UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;
using UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;
using UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;
using UmdBatteryTray.Protocol.Mice.Redragon.KingUltra;

namespace UmdBatteryTray.Protocol;

internal static class UmdDeviceEnumerator
{
    /// <summary>
    /// Lists unique VID:PID pairs currently attached for each SKU tree.
    /// Does not open streams (safe while Chrome WebHID holds a handle).
    /// </summary>
    public static IReadOnlyList<UmdDeviceInfo> ListAvailable()
    {
        var byKey = new Dictionary<string, UmdDeviceInfo>(StringComparer.OrdinalIgnoreCase);

        AddSku(
            byKey,
            KingUltraConstants.VendorId,
            KingUltraConstants.ProductIds,
            UmdDeviceKind.KingUltra,
            KingUltraConstants.DefaultLabel);

        AddSku(
            byKey,
            BlitzUltimateConstants.VendorId,
            BlitzUltimateConstants.ProductIds,
            UmdDeviceKind.BlitzUltimate,
            BlitzUltimateConstants.DefaultLabel);

        AddSku(
            byKey,
            GwolvesConstants.VendorId,
            GwolvesConstants.ProductIds,
            UmdDeviceKind.FenrirMax,
            "Fenrir Max");

        AddSku(
            byKey,
            SuperlightConstants.VendorId,
            SuperlightConstants.ProductIds,
            UmdDeviceKind.Superlight,
            "PRO X SUPERLIGHT");

        return byKey.Values
            .OrderBy(d => d.Kind switch
            {
                UmdDeviceKind.KingUltra => 0,
                UmdDeviceKind.BlitzUltimate => 1,
                UmdDeviceKind.FenrirMax => 2,
                _ => 3,
            })
            .ThenByDescending(d => IsWirelessPid(d) ? 1 : 0)
            .ThenBy(d => d.ProductId)
            .ToList();
    }

    private static void AddSku(
        Dictionary<string, UmdDeviceInfo> byKey,
        int vendorId,
        IReadOnlyList<int> productIds,
        UmdDeviceKind kind,
        string fallbackName)
    {
        foreach (var pid in productIds)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(vendorId, pid))
            {
                var key = $"{d.VendorID:X4}:{d.ProductID:X4}";
                if (byKey.ContainsKey(key))
                    continue;
                string name;
                try { name = d.GetProductName() ?? fallbackName; }
                catch { name = fallbackName; }
                byKey[key] = new UmdDeviceInfo(kind, d.VendorID, d.ProductID, name);
            }
        }
    }

    private static bool IsWirelessPid(UmdDeviceInfo d) =>
        d.Kind switch
        {
            UmdDeviceKind.KingUltra => KingUltraConstants.IsWirelessDongle(d.ProductId),
            UmdDeviceKind.BlitzUltimate => BlitzUltimateConstants.IsWirelessDongle(d.ProductId),
            UmdDeviceKind.FenrirMax => d.ProductId == GwolvesConstants.FenrirMaxWirelessPid,
            UmdDeviceKind.Superlight => true,
            _ => false,
        };

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
