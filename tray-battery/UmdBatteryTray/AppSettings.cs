using System.Text.Json;
using System.Text.Json.Serialization;

namespace UmdBatteryTray;

[JsonConverter(typeof(JsonStringEnumConverter))]
internal enum TrayDisplayMode
{
    BatteryIcon,
    Percent,
    BatteryWithPercent,
}

internal sealed class AppSettings
{
    private static readonly string SettingsDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "UmdBatteryTray");

    private static readonly string SettingsPath = Path.Combine(SettingsDir, "settings.json");

    public TrayDisplayMode TrayDisplay { get; set; } = TrayDisplayMode.Percent;
    public bool WidgetVisible { get; set; }
    public bool WidgetDraggable { get; set; } = true;
    public int? WidgetX { get; set; }
    public int? WidgetY { get; set; }
    public int WidgetScalePercent { get; set; } = 100;
    public int WidgetBackgroundOpacityPercent { get; set; } = 85;
    public int WidgetFontOpacityPercent { get; set; } = 100;
    public int TrayFontScalePercent { get; set; } = 230;
    public int TrayIconScalePercent { get; set; } = 109;
    public int PollIntervalSeconds { get; set; } = 120;

    // Autostart UMD Battery Tray with Windows (Startup folder shortcut).
    public bool RunAtStartup { get; set; }

    // Check umd.skullmedia.pl for a newer EXE on launch.
    public bool AutoUpdateOnStart { get; set; } = true;

    public string UpdateBaseUrl { get; set; } = AppConstants.DefaultUpdateBaseUrl;

    public static AppSettings Load()
    {
        try
        {
            if (!File.Exists(SettingsPath))
                return new AppSettings();

            var json = File.ReadAllText(SettingsPath);
            return JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
        }
        catch
        {
            return new AppSettings();
        }
    }

    public void Save()
    {
        Directory.CreateDirectory(SettingsDir);
        var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(SettingsPath, json);
    }

    public static Point DefaultWidgetLocation(Size widgetSize)
    {
        var area = Screen.PrimaryScreen?.WorkingArea
            ?? new Rectangle(0, 0, 1920, 1080);

        return new Point(
            area.Right - widgetSize.Width - 16,
            area.Bottom - widgetSize.Height - 80);
    }

    public Point ResolveWidgetLocation(Size widgetSize)
    {
        if (WidgetX is int x && WidgetY is int y)
            return new Point(x, y);

        return DefaultWidgetLocation(widgetSize);
    }
}
