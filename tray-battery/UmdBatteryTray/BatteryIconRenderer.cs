using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;

namespace UmdBatteryTray;

internal static class BatteryIconRenderer
{
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyIcon(IntPtr handle);

    private const int Size = 64;
    private const int MinScalePercent = 50;
    private const int MaxScalePercent = 400;

    public static Icon Create(
        int percent,
        bool charging,
        TrayDisplayMode mode,
        int fontScalePercent = 100,
        int iconScalePercent = 100)
    {
        var fontScale = Math.Clamp(fontScalePercent, MinScalePercent, MaxScalePercent) / 100f;
        var iconScale = Math.Clamp(iconScalePercent, MinScalePercent, MaxScalePercent) / 100f;

        return mode switch
        {
            TrayDisplayMode.BatteryIcon => CreateBatteryOnly(percent, charging, iconScale),
            TrayDisplayMode.Percent => CreatePercentOnly(percent, charging, fontScale),
            _ => CreateBatteryWithPercent(percent, charging, fontScale, iconScale),
        };
    }

    private static Color LevelColor(int percent, bool charging)
    {
        if (charging)
            return Color.FromArgb(90, 170, 255);

        return percent switch
        {
            <= 15 => Color.FromArgb(235, 90, 80),
            <= 30 => Color.FromArgb(235, 160, 60),
            _ => Color.FromArgb(80, 205, 120),
        };
    }

    private static Icon CreateBatteryOnly(int percent, bool charging, float iconScale)
    {
        using var bitmap = new Bitmap(Size, Size);
        using var g = NewGraphics(bitmap);

        var fill = LevelColor(percent, charging);
        using var outline = new Pen(Color.FromArgb(230, 230, 230), 4f);
        using var brush = new SolidBrush(fill);

        var state = ScaleAroundCenter(g, iconScale);

        var body = new Rectangle(8, 14, 44, 36);
        g.DrawRectangle(outline, body);
        var inner = Math.Max(2, (int)(36 * percent / 100.0));
        g.FillRectangle(brush, 12, 18, inner, 28);
        g.FillRectangle(brush, 54, 24, 8, 16);

        g.Restore(state);

        return ToIcon(bitmap);
    }

    private static Icon CreatePercentOnly(int percent, bool charging, float fontScale)
    {
        using var bitmap = new Bitmap(Size, Size);
        using var g = NewGraphics(bitmap);

        var color = LevelColor(percent, charging);
        var text = percent.ToString();
        var rect = TextRect(top: 0, height: Size, fontScale);

        DrawScaledPercentText(g, text, color, fontScale, rect);

        return ToIcon(bitmap);
    }

    private static Icon CreateBatteryWithPercent(int percent, bool charging, float fontScale, float iconScale)
    {
        using var bitmap = new Bitmap(Size, Size);
        using var g = NewGraphics(bitmap);

        var color = LevelColor(percent, charging);

        // Battery glyph as the background layer, scaled around the tile center.
        var state = g.Save();
        const float center = Size / 2f;
        g.TranslateTransform(center, center);
        g.ScaleTransform(iconScale, iconScale);
        g.TranslateTransform(-center, -center);

        using (var outline = new Pen(Color.FromArgb(210, 210, 210), 4f))
        using (var fillBrush = new SolidBrush(color))
        {
            var body = new Rectangle(8, 16, 44, 32);
            g.DrawRectangle(outline, body);
            var inner = Math.Max(2, (int)(40 * percent / 100.0));
            g.FillRectangle(fillBrush, 10, 18, inner, 28);
            g.FillRectangle(fillBrush, 54, 26, 8, 12);
        }

        g.Restore(state);

        // Percent number on top (higher z-index) with a drop shadow for contrast.
        var rect = TextRect(top: 0, height: Size, fontScale);
        DrawPercentWithShadow(g, percent.ToString(), Color.White, fontScale, rect);

        return ToIcon(bitmap);
    }

    private static void DrawPercentWithShadow(
        Graphics g,
        string text,
        Color color,
        float fontScale,
        RectangleF rect)
    {
        using var font = FitFont(g, text, rect.Width, rect.Height, rect.Height * 0.95f);

        var extra = fontScale > 1.05f ? 1f + (fontScale - 1f) * 0.55f : 1f;
        var state = g.Save();
        if (extra > 1f)
        {
            var cx = rect.X + rect.Width / 2f;
            var cy = rect.Y + rect.Height / 2f;
            g.TranslateTransform(cx, cy);
            g.ScaleTransform(extra, extra);
            g.TranslateTransform(-cx, -cy);
        }

        // Soft drop shadow: a few offset dark copies behind the glyph.
        using (var shadow = new SolidBrush(Color.FromArgb(170, 0, 0, 0)))
        {
            foreach (var (dx, dy) in new[] { (2f, 2f), (2f, 0f), (0f, 2f), (-1f, 1f) })
                DrawCentered(g, text, font, shadow, Offset(rect, dx, dy));
        }

        using var brush = new SolidBrush(color);
        DrawCentered(g, text, font, brush, rect);
        g.Restore(state);
    }

    private static RectangleF Offset(RectangleF rect, float dx, float dy)
        => new(rect.X + dx, rect.Y + dy, rect.Width, rect.Height);

    private static RectangleF TextRect(float top, float height, float fontScale)
    {
        // Higher scale = less padding so the digits can grow into the tile.
        var inset = Math.Max(0f, 10f - (fontScale - 1f) * 3f);
        return new RectangleF(inset, top + inset, Size - inset * 2, height - inset * 2);
    }

    private static void DrawScaledPercentText(
        Graphics g,
        string text,
        Color color,
        float fontScale,
        RectangleF rect)
    {
        using var brush = new SolidBrush(color);
        using var font = FitFont(g, text, rect.Width, rect.Height, rect.Height * 0.95f);

        if (fontScale <= 1.05f)
        {
            DrawCentered(g, text, font, brush, rect);
            return;
        }

        // Above 100%: scale the glyph up (clips at edges) for a bolder, larger tray look.
        var extra = 1f + (fontScale - 1f) * 0.55f;
        var state = g.Save();
        var cx = rect.X + rect.Width / 2f;
        var cy = rect.Y + rect.Height / 2f;
        g.TranslateTransform(cx, cy);
        g.ScaleTransform(extra, extra);
        g.TranslateTransform(-cx, -cy);
        DrawCentered(g, text, font, brush, rect);
        g.Restore(state);
    }

    private static GraphicsState ScaleAroundCenter(Graphics g, float scale)
    {
        var state = g.Save();
        if (Math.Abs(scale - 1f) > 0.001f)
        {
            const float center = Size / 2f;
            g.TranslateTransform(center, center);
            g.ScaleTransform(scale, scale);
            g.TranslateTransform(-center, -center);
        }

        return state;
    }

    private static Graphics NewGraphics(Bitmap bitmap)
    {
        var g = Graphics.FromImage(bitmap);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = TextRenderingHint.AntiAlias;
        g.Clear(Color.Transparent);
        return g;
    }

    private static Font FitFont(Graphics g, string text, float maxWidth, float maxHeight, float ceilingPt)
    {
        var ptSize = ceilingPt;
        while (ptSize > 8f)
        {
            var font = new Font("Segoe UI", ptSize, FontStyle.Bold, GraphicsUnit.Pixel);
            var measured = g.MeasureString(text, font);
            if (measured.Width <= maxWidth && measured.Height <= maxHeight)
                return font;

            font.Dispose();
            ptSize -= 1f;
        }

        return new Font("Segoe UI", 8f, FontStyle.Bold, GraphicsUnit.Pixel);
    }

    private static void DrawCentered(Graphics g, string text, Font font, Brush brush, RectangleF rect)
    {
        using var format = new StringFormat
        {
            Alignment = StringAlignment.Center,
            LineAlignment = StringAlignment.Center,
        };
        g.DrawString(text, font, brush, rect, format);
    }

    private static Icon ToIcon(Bitmap bitmap)
    {
        var handle = bitmap.GetHicon();
        try
        {
            using var temp = Icon.FromHandle(handle);
            return (Icon)temp.Clone();
        }
        finally
        {
            DestroyIcon(handle);
        }
    }
}
