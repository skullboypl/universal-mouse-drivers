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
        // Old installs may still point at umd.skullmedia.pl in settings.json
        if (baseUrl.Contains("umd.skullmedia.pl", StringComparison.OrdinalIgnoreCase))
            baseUrl = AppConstants.DefaultUpdateBaseUrl;

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
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

        // Single-file EXE stays locked until process fully exits — rename aside, then replace.
        var bat = Path.Combine(Path.GetTempPath(), "umd-tray-update.cmd");
        var script = $"""
            @echo off
            setlocal
            set "SRC={temp}"
            set "DST={current}"
            ping 127.0.0.1 -n 4 >nul
            :retry
            if exist "%DST%.old" del /F /Q "%DST%.old" >nul 2>&1
            move /Y "%DST%" "%DST%.old" >nul 2>&1
            if exist "%DST%" (
              ping 127.0.0.1 -n 2 >nul
              goto retry
            )
            copy /Y "%SRC%" "%DST%" >nul
            if not exist "%DST%" (
              if exist "%DST%.old" move /Y "%DST%.old" "%DST%" >nul
              exit /b 1
            )
            start "" "%DST%"
            del /F /Q "%SRC%" >nul 2>&1
            del /F /Q "%DST%.old" >nul 2>&1
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
