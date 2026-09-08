using System.Runtime.InteropServices;

namespace UmdBatteryTray;

internal static class StartupHelper
{
    private static string ShortcutPath =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.Startup),
            "UmdBatteryTray.lnk");

    public static bool IsEnabled() => File.Exists(ShortcutPath);

    public static void SetEnabled(bool enabled)
    {
        if (enabled)
            CreateShortcut();
        else if (File.Exists(ShortcutPath))
            File.Delete(ShortcutPath);
    }

    private static void CreateShortcut()
    {
        var exe = Environment.ProcessPath
            ?? Path.Combine(AppContext.BaseDirectory, "UmdBatteryTray.exe");
        var workDir = Path.GetDirectoryName(exe) ?? AppContext.BaseDirectory;

        // WScript.Shell is available on all desktop Windows installs.
        var t = Type.GetTypeFromProgID("WScript.Shell")
            ?? throw new InvalidOperationException("WScript.Shell unavailable");
        dynamic shell = Activator.CreateInstance(t)
            ?? throw new InvalidOperationException("WScript.Shell create failed");
        var shortcut = shell.CreateShortcut(ShortcutPath);
        shortcut.TargetPath = exe;
        shortcut.WorkingDirectory = workDir;
        shortcut.Description = AppConstants.ProductName;
        shortcut.IconLocation = exe;
        shortcut.Save();
        Marshal.FinalReleaseComObject(shortcut);
        Marshal.FinalReleaseComObject(shell);
    }
}
