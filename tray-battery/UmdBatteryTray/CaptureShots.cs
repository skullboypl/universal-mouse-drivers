using System.Drawing.Imaging;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

/// <summary>
/// One-shot marketing capture: Settings + widget composed off-screen → PNG, then exit.
/// Usage: UmdBatteryTray.exe --capture "X:\path\to\out.png"
/// </summary>
internal static class CaptureShots
{
    public static void Run(string outputPath)
    {
        ApplicationConfiguration.Initialize();

        var settings = AppSettings.Load();
        settings.WidgetVisible = true;
        settings.WidgetScalePercent = 140;
        settings.WidgetBackgroundOpacityPercent = 90;

        var widget = new BatteryWidgetForm();
        widget.ApplyScale(settings.WidgetScalePercent);
        widget.ApplyBackgroundOpacity(settings.WidgetBackgroundOpacityPercent);
        widget.ApplyFontOpacity(100);
        widget.UpdateReading(new BatteryReading(83, BatteryStatus.Discharging));
        // Keep invisible — we export the bitmap directly.
        widget.Opacity = 0;
        widget.ShowInTaskbar = false;
        widget.Show();

        var form = new SettingsForm(settings, widget, _ => { });
        form.StartPosition = FormStartPosition.Manual;
        form.Location = new Point(-4000, -4000); // off-screen; DrawToBitmap still works
        form.ShowInTaskbar = false;

        form.Shown += (_, _) =>
        {
            Application.DoEvents();
            Thread.Sleep(200);
            Application.DoEvents();

            try
            {
                var dir = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(dir))
                    Directory.CreateDirectory(dir);

                ComposeAndSave(form, widget, outputPath);
            }
            finally
            {
                form.Close();
                widget.Close();
                Application.ExitThread();
            }
        };

        Application.Run(form);
    }

    private static void ComposeAndSave(
        SettingsForm form,
        BatteryWidgetForm widget,
        string path)
    {
        using var settingsBmp = new Bitmap(form.Width, form.Height);
        form.DrawToBitmap(settingsBmp, new Rectangle(0, 0, form.Width, form.Height));

        using var widgetBmp = widget.ExportBitmap();

        const int pad = 28;
        const int gap = 24;
        var canvasW = pad + widgetBmp.Width + gap + settingsBmp.Width + pad;
        var canvasH = pad + Math.Max(widgetBmp.Height, settingsBmp.Height) + pad;

        using var canvas = new Bitmap(canvasW, canvasH);
        using (var g = Graphics.FromImage(canvas))
        {
            g.Clear(Color.FromArgb(255, 14, 18, 24));
            g.DrawImage(widgetBmp, pad, pad + Math.Max(0, (settingsBmp.Height - widgetBmp.Height) / 2));
            g.DrawImage(settingsBmp, pad + widgetBmp.Width + gap, pad);
        }

        canvas.Save(path, ImageFormat.Png);
    }
}
