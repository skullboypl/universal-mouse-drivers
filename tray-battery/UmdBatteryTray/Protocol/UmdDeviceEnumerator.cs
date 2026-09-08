using HidSharp;
using UmdBatteryTray.Protocol.Mice.Gwolves.FenrirMax;
using UmdBatteryTray.Protocol.Mice.Logitech.ProXSuperlight;
using UmdBatteryTray.Protocol.Mice.Rampage.BlitzUltimate;
using UmdBatteryTray.Protocol.Mice.Redragon.KingUltra;
using UmdBatteryTray.Protocol.OpenMouse;

namespace UmdBatteryTray.Protocol;

internal static class UmdDeviceEnumerator
{
    /// <summary>
    /// Lists unique VID:PID pairs currently attached for each SKU tree.
    /// Does not open streams (safe while Chrome WebHID holds a handle).
    /// Native UMD SKUs win over OpenMouseCommunity on the same VID:PID.
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

        AddOpenMouseCatalog(byKey);

        return byKey.Values
            .OrderBy(d => d.Kind switch
            {
                UmdDeviceKind.KingUltra => 0,
                UmdDeviceKind.BlitzUltimate => 1,
                UmdDeviceKind.FenrirMax => 2,
                UmdDeviceKind.Superlight => 3,
                UmdDeviceKind.OpenMouseCommunity => 4,
                _ => 5,
            })
            .ThenByDescending(d => IsWirelessPid(d) ? 1 : 0)
            .ThenBy(d => d.ProductId)
            .ToList();
    }

    private static void AddOpenMouseCatalog(Dictionary<string, UmdDeviceInfo> byKey)
    {
        foreach (var entry in OpenMouseCatalog.Devices)
        {
            foreach (var d in DeviceList.Local.GetHidDevices(entry.VendorId, entry.ProductId))
            {
                var key = $"{d.VendorID:X4}:{d.ProductID:X4}";
                if (byKey.ContainsKey(key))
                    continue; // native SKU already claimed this pair
                string name;
                try { name = d.GetProductName() ?? entry.Name; }
                catch { name = entry.Name; }
                byKey[key] = new UmdDeviceInfo(
                    UmdDeviceKind.OpenMouseCommunity,
                    d.VendorID,
                    d.ProductID,
                    $"{entry.Brand} · {name}");
            }
        }
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
            UmdDeviceKind.OpenMouseCommunity => true,
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

        // Prefer native UMD over OpenMouse community when auto-picking.
        return available.FirstOrDefault(d => d.Kind != UmdDeviceKind.OpenMouseCommunity)
            ?? available[0];
    }
}
