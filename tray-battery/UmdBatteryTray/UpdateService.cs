using System.Diagnostics;
using System.Reflection;
using System.Text.Json;

namespace UmdBatteryTray;

internal sealed class UpdateService
{
    private readonly AppSettings _settings;

    public UpdateService(AppSettings settings)
    {
        _settings = settings;
    }

    public static string CurrentVersion
    {
        get
        {
            var asm = Assembly.GetExecutingAssembly();
            var info = asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
            if (!string.IsNullOrWhiteSpace(info))
            {
                var plus = info.IndexOf('+');
                return plus >= 0 ? info[..plus] : info;
            }

            return asm.GetName().Version?.ToString(3) ?? "0.0.0";
        }
    }

    public async Task CheckAndApplyAsync(CancellationToken ct = default)
    {
        if (!_settings.AutoUpdateOnStart)
            return;

        var baseUrl = (_settings.UpdateBaseUrl ?? AppConstants.DefaultUpdateBaseUrl).TrimEnd('/');
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(25) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd($"UmdBatteryTray/{CurrentVersion}");

        LatestManifest? manifest;
        try
        {
            var json = await http.GetStringAsync($"{baseUrl}/api/tray/latest", ct);
            manifest = JsonSerializer.Deserialize<LatestManifest>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });
        }
        catch
        {
            return;
        }

        if (manifest?.Version is null || string.IsNullOrWhiteSpace(manifest.Url))
            return;

        if (!IsNewer(manifest.Version, CurrentVersion))
            return;

        var temp = Path.Combine(Path.GetTempPath(), $"UmdBatteryTray-{manifest.Version}.exe");
        try
        {
            await using (var fs = File.Create(temp))
            await using (var stream = await http.GetStreamAsync(manifest.Url, ct))
            {
                await stream.CopyToAsync(fs, ct);
            }
        }
        catch
        {
            try { File.Delete(temp); } catch { /* ignore */ }
            return;
        }

        var current = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(current) || !File.Exists(temp))
            return;

        // Single-file: delay, copy over self, relaunch.
        var bat = Path.Combine(Path.GetTempPath(), "umd-tray-update.cmd");
        var script = $"""
            @echo off
            ping 127.0.0.1 -n 3 >nul
            copy /Y "{temp}" "{current}"
            start "" "{current}"
            del "%~f0"
            """;
        await File.WriteAllTextAsync(bat, script, ct);
        Process.Start(new ProcessStartInfo
        {
            FileName = bat,
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden,
            CreateNoWindow = true,
        });
        Application.Exit();
    }

    private static bool IsNewer(string remote, string local)
    {
        if (!Version.TryParse(Normalize(remote), out var r))
            return false;
        if (!Version.TryParse(Normalize(local), out var l))
            return true;
        return r > l;
    }

    private static string Normalize(string v)
    {
        var s = v.Trim().TrimStart('v', 'V');
        var parts = s.Split('.');
        if (parts.Length == 2) return s + ".0";
        return s;
    }

    private sealed class LatestManifest
    {
        public string? Version { get; set; }
        public string? Filename { get; set; }
        public string? Url { get; set; }
        public string? Sha256 { get; set; }
    }
}
