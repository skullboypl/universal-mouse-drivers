using System.Net.Http;

namespace UmdBatteryTray;

internal static class Program
{
    private const string MutexName = @"Local\UmdBatteryTray_SingleInstance";

    [STAThread]
    private static void Main(string[] args)
    {
        if (args.Length >= 2
            && string.Equals(args[0], "--capture", StringComparison.OrdinalIgnoreCase))
        {
            CaptureShots.Run(args[1]);
            return;
        }

        using var mutex = new Mutex(true, MutexName, out var createdNew);
        if (!createdNew)
        {
            // Already running — ask the live instance to show Settings, then exit.
            TryOpenExistingSettings();
            return;
        }

        ApplicationConfiguration.Initialize();
        Application.Run(new TrayApplicationContext());
    }

    private static void TryOpenExistingSettings()
    {
        for (var i = 0; i < 12; i++)
        {
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromMilliseconds(800) };
                using var res = http
                    .PostAsync(
                        $"http://127.0.0.1:{AppConstants.BridgePort}/open/settings",
                        content: null)
                    .GetAwaiter()
                    .GetResult();
                if (res.IsSuccessStatusCode)
                    return;
            }
            catch
            {
                // Bridge may still be starting — retry briefly.
            }

            Thread.Sleep(150);
        }
    }
}
