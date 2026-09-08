using System.Diagnostics;
using System.Reflection;
using System.Text.Json;

namespace UmdBatteryTray;

internal sealed class UpdateManifestInfo
{
    public required string Version { get; init; }
    public required string Url { get; init; }
    public string? Filename { get; init; }
    public string? Sha256 { get; init; }
}

internal sealed class UpdateCheckOutcome
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public UpdateManifestInfo? Manifest { get; init; }
    public bool UpdateAvailable { get; init; }
}

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

    /// <summary>
    /// Silent start path (respects AutoUpdateOnStart). Prefer interactive UI via
    /// <see cref="FetchLatestAsync"/> + confirm + <see cref="DownloadAndApplyAsync"/>.
    /// </summary>
    public async Task CheckAndApplyAsync(CancellationToken ct = default)
    {
        if (!_settings.AutoUpdateOnStart)
            return;

        var check = await FetchLatestAsync(ct);
        if (!check.Success || !check.UpdateAvailable || check.Manifest is null)
            return;

        await DownloadAndApplyAsync(check.Manifest, ct);
    }

    public async Task<UpdateCheckOutcome> FetchLatestAsync(CancellationToken ct = default)
    {
        using var http = CreateHttpClient(TimeSpan.FromSeconds(30));

        Exception? lastError = null;
        foreach (var baseUrl in CandidateBaseUrls(_settings.UpdateBaseUrl))
        {
            try
            {
                var json = await http.GetStringAsync($"{baseUrl}/api/tray/latest", ct);
                var dto = JsonSerializer.Deserialize<LatestManifest>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                });

                if (dto?.Version is null || string.IsNullOrWhiteSpace(dto.Url))
                {
                    lastError = new InvalidOperationException($"Empty manifest from {baseUrl}");
                    continue;
                }

                if (!string.Equals(_settings.UpdateBaseUrl, AppConstants.DefaultUpdateBaseUrl, StringComparison.OrdinalIgnoreCase))
                {
                    _settings.UpdateBaseUrl = AppConstants.DefaultUpdateBaseUrl;
                    try { _settings.Save(); } catch { /* ignore */ }
                }

                var manifest = new UpdateManifestInfo
                {
                    Version = dto.Version.Trim(),
                    Url = dto.Url.Trim(),
                    Filename = dto.Filename,
                    Sha256 = dto.Sha256,
                };

                return new UpdateCheckOutcome
                {
                    Success = true,
                    Manifest = manifest,
                    UpdateAvailable = IsNewer(manifest.Version, CurrentVersion),
                };
            }
            catch (Exception ex)
            {
                lastError = ex;
            }
        }

        return new UpdateCheckOutcome
        {
            Success = false,
            Error = lastError?.Message ?? "Could not reach update server.",
        };
    }

    public async Task DownloadAndApplyAsync(UpdateManifestInfo manifest, CancellationToken ct = default)
    {
        // ~69 MB EXE — 45s was too short on slower links (silent fail on 1.6.x).
        using var http = CreateHttpClient(TimeSpan.FromMinutes(10));

        var temp = Path.Combine(Path.GetTempPath(), $"UmdBatteryTray-{SanitizeFileToken(manifest.Version)}.exe");
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
            throw;
        }

        var current = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(current) || !File.Exists(temp))
            throw new InvalidOperationException("Cannot locate running EXE path for replace.");

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

    private HttpClient CreateHttpClient(TimeSpan timeout)
    {
        var http = new HttpClient { Timeout = timeout };
        http.DefaultRequestHeaders.UserAgent.ParseAdd($"UmdBatteryTray/{CurrentVersion}");
        return http;
    }

    private static string SanitizeFileToken(string version)
    {
        var chars = version.Where(c => char.IsLetterOrDigit(c) || c is '.' or '-').ToArray();
        return chars.Length == 0 ? "update" : new string(chars);
    }

    /// <summary>
    /// Prefer configured URL, then canonical umdrivers.com.
    /// Remaps known legacy hosts so we never depend on CapRover HTTP redirects
    /// (HttpClient refuses HTTPS→HTTP downgrade 302s).
    /// </summary>
    internal static IEnumerable<string> CandidateBaseUrls(string? configured)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in new[]
                 {
                     configured,
                     AppConstants.DefaultUpdateBaseUrl,
                     "https://umdrivers.com",
                     "https://mouse.vxh.pl",
                 })
        {
            var n = NormalizeUpdateBase(raw);
            if (n is null || !seen.Add(n))
                continue;
            yield return n;
        }
    }

    internal static string? NormalizeUpdateBase(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;
        var s = raw.Trim().TrimEnd('/');
        // Keep mouse.vxh.pl as a real candidate for old installs once CapRover
        // aliases it to this app — do not rewrite it away before trying.
        if (s.Contains("umd.skullmedia.pl", StringComparison.OrdinalIgnoreCase)
            || s.Contains("umd.example.com", StringComparison.OrdinalIgnoreCase))
            return AppConstants.DefaultUpdateBaseUrl;
        if (s.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            s = "https://" + s["http://".Length..];
        return s.TrimEnd('/');
    }

    internal static bool IsNewer(string remote, string local)
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
