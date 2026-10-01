using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

/// <summary>
/// Layered (per-pixel alpha) desktop widget. Background and text are drawn onto an
/// ARGB bitmap and blended against the desktop via UpdateLayeredWindow, so background
/// opacity and font opacity can be controlled independently.
/// </summary>
internal sealed class BatteryWidgetForm : Form
{
    private const int BaseWidth = 140;
    private const int BaseHeight = 86;
    private const float BasePercentFont = 22f;
    private const float BaseStatusFont = 9f;
    // 15fps is plenty for a slow breathing glow / percent lerp and costs noticeably
    // less idle CPU than the 30fps this started at - this timer can run for hours
    // straight while a mouse charges.
    private const int AnimIntervalMs = 66;
    private const int DeviceDebounceMs = 500;

    private const int WS_EX_LAYERED = 0x00080000;
    private const int WM_LBUTTONDOWN = 0x0201;
    private const int WM_NCLBUTTONDOWN = 0x00A1;
    private const int WM_EXITSIZEMOVE = 0x0232;
    private const int HTCAPTION = 0x0002;
    private const byte AC_SRC_OVER = 0x00;
    private const byte AC_SRC_ALPHA = 0x01;
    private const int ULW_ALPHA = 0x02;

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UpdateLayeredWindow(
        IntPtr hwnd, IntPtr hdcDst, ref POINT pptDst, ref SIZE psize,
        IntPtr hdcSrc, ref POINT pptSrc, int crKey, ref BLENDFUNCTION pblend, int dwFlags);

    [DllImport("user32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll", ExactSpelling = true)]
    private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern IntPtr CreateCompatibleDC(IntPtr hDC);

    [DllImport("gdi32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteDC(IntPtr hdc);

    [DllImport("gdi32.dll", ExactSpelling = true)]
    private static extern IntPtr SelectObject(IntPtr hDC, IntPtr hObject);

    [DllImport("gdi32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteObject(IntPtr hObject);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr RegisterDeviceNotification(
        IntPtr hRecipient, IntPtr notificationFilter, int flags);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnregisterDeviceNotification(IntPtr handle);

    private const int WM_DEVICECHANGE = 0x0219;
    private const int DBT_DEVICEARRIVAL = 0x8000;
    private const int DBT_DEVTYP_DEVICEINTERFACE = 5;
    private const int DEVICE_NOTIFY_WINDOW_HANDLE = 0x00000000;
    private static readonly Guid GUID_DEVINTERFACE_HID =
        new("4D1E55B2-F16F-11CF-88CB-001111000030");

    [StructLayout(LayoutKind.Sequential)]
    private struct DEV_BROADCAST_DEVICEINTERFACE
    {
        public int dbcc_size;
        public int dbcc_devicetype;
        public int dbcc_reserved;
        public Guid dbcc_classguid;
        public short dbcc_name;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
        public POINT(int x, int y) { X = x; Y = y; }
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SIZE
    {
        public int Cx;
        public int Cy;
        public SIZE(int cx, int cy) { Cx = cx; Cy = cy; }
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    private struct BLENDFUNCTION
    {
        public byte BlendOp;
        public byte BlendFlags;
        public byte SourceConstantAlpha;
        public byte AlphaFormat;
    }

    private bool _draggable = true;
    private bool _suppressPositionSave;
    private int _scalePercent = 100;
    private int _backgroundOpacity = 85;
    private int _fontOpacity = 100;
    private string _percentText = "--%";
    private string _statusText = "Connecting…";
    private Action<Point>? _onPositionChanged;
    private Action? _onDeviceArrived;

    // Battery bar + animation state.
    private int _percent = -1;
    private bool _charging;
    private float _displayedPercent;
    private float _glowPhase;
    private readonly System.Windows.Forms.Timer _animTimer;

    // HID arrival notifications let a reconnect refresh immediately instead of
    // waiting for the next poll tick (which defaults to minutes) - debounced
    // because one physical mouse plug-in fires several WM_DEVICECHANGE messages
    // (one per HID collection/interface).
    private IntPtr _deviceNotifyHandle;
    private readonly System.Windows.Forms.Timer _deviceDebounceTimer;

    public BatteryWidgetForm()
    {
        Text = "UMD Battery";
        FormBorderStyle = FormBorderStyle.None;
        TopMost = true;
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.Manual;
        Size = new Size(BaseWidth, BaseHeight);

        _deviceDebounceTimer = new System.Windows.Forms.Timer { Interval = DeviceDebounceMs };
        _deviceDebounceTimer.Tick += (_, _) =>
        {
            _deviceDebounceTimer.Stop();
            _onDeviceArrived?.Invoke();
        };

        _animTimer = new System.Windows.Forms.Timer { Interval = AnimIntervalMs };
        _animTimer.Tick += (_, _) => AnimTick();
    }

    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= WS_EX_LAYERED;
            return cp;
        }
    }

    public void SetPositionChangedHandler(Action<Point>? handler) => _onPositionChanged = handler;

    /// <summary>Fires (debounced) when a HID device is plugged in, so the caller can refresh right away.</summary>
    public void SetDeviceArrivedHandler(Action? handler) => _onDeviceArrived = handler;

    public void ApplyPosition(Point location)
    {
        if (InvokeRequired)
        {
            BeginInvoke(() => ApplyPosition(location));
            return;
        }

        _suppressPositionSave = true;
        Location = location;
        _suppressPositionSave = false;
        Render();
    }

    public void ResetToDefaultPosition() => ApplyPosition(AppSettings.DefaultWidgetLocation(Size));

    public void SetDraggable(bool draggable) => _draggable = draggable;

    public void ApplyScale(int scalePercent)
    {
        _scalePercent = Math.Clamp(scalePercent, 50, 250);
        var f = _scalePercent / 100f;
        Size = new Size((int)(BaseWidth * f), (int)(BaseHeight * f));
        Render();
    }

    public void ApplyBackgroundOpacity(int opacityPercent)
    {
        _backgroundOpacity = Math.Clamp(opacityPercent, 0, 100);
        Render();
    }

    public void ApplyFontOpacity(int opacityPercent)
    {
        _fontOpacity = Math.Clamp(opacityPercent, 0, 100);
        Render();
    }

    public void UpdateReading(BatteryReading? reading, string? error = null)
    {
        if (InvokeRequired)
        {
            BeginInvoke(() => UpdateReading(reading, error));
            return;
        }

        if (error is not null)
        {
            _percentText = "--%";
            _statusText = error;
            _percent = -1;
            _charging = false;
        }
        else if (reading is null)
        {
            _percentText = "--%";
            _statusText = "No data";
            _percent = -1;
            _charging = false;
        }
        else if (reading.Value.Status == BatteryStatus.Unknown)
        {
            _percentText = "n/a";
            _statusText = "OpenMouse · battery n/a";
            _percent = -1;
            _charging = false;
        }
        else
        {
            _percentText = $"{reading.Value.Percent}%";
            _statusText = reading.Value.Status switch
            {
                BatteryStatus.Charging => "Charging",
                BatteryStatus.Full => "Full",
                BatteryStatus.Discharging => "On battery",
                _ => "UMD mouse",
            };
            _percent = Math.Clamp(reading.Value.Percent, 0, 100);
            _charging = reading.Value.Status == BatteryStatus.Charging;
        }

        if (_percent < 0)
            _displayedPercent = 0;

        if (!_animTimer.Enabled)
            _animTimer.Start();

        Render();
    }

    /// <summary>Lerps the bar toward the real percent and pulses the charging glow; stops itself once settled.</summary>
    private void AnimTick()
    {
        var target = Math.Max(0, _percent);
        var moved = false;

        var diff = target - _displayedPercent;
        if (Math.Abs(diff) > 0.1f)
        {
            _displayedPercent += diff * 0.18f;
            moved = true;
        }
        else
        {
            _displayedPercent = target;
        }

        if (_charging)
        {
            // Scaled for the 66ms tick so the breathing speed matches what 0.08f/33ms looked like.
            _glowPhase += 0.16f;
            if (_glowPhase > Math.PI * 2)
                _glowPhase -= (float)(Math.PI * 2);
            moved = true;
        }
        else if (_glowPhase != 0f)
        {
            _glowPhase = 0f;
        }

        if (moved)
            Render();
        else
            _animTimer.Stop();
    }

    /// <summary>Off-screen render for marketing screenshots (same look as the layered widget).</summary>
    public Bitmap ExportBitmap()
    {
        var width = Math.Max(1, Width);
        var height = Math.Max(1, Height);
        var f = _scalePercent / 100f;
        var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using var g = Graphics.FromImage(bitmap);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = TextRenderingHint.AntiAlias;
        g.Clear(Color.Transparent);

        var bgAlpha = (int)(255 * _backgroundOpacity / 100.0);
        if (bgAlpha > 0)
        {
            using var bgBrush = new SolidBrush(Color.FromArgb(bgAlpha, 28, 28, 32));
            FillRoundedRectangle(g, bgBrush, new Rectangle(0, 0, width - 1, height - 1), (int)(10 * f));
        }

        var fontAlpha = (int)(255 * _fontOpacity / 100.0);
        if (fontAlpha > 0)
        {
            using var percentFont = new Font("Segoe UI", BasePercentFont * f, FontStyle.Bold);
            using var statusFont = new Font("Segoe UI", BaseStatusFont * f);
            using var percentBrush = new SolidBrush(Color.FromArgb(fontAlpha, 255, 255, 255));
            using var statusBrush = new SolidBrush(Color.FromArgb((int)(fontAlpha * 0.75), 180, 180, 190));
            using var format = new StringFormat
            {
                Alignment = StringAlignment.Center,
                LineAlignment = StringAlignment.Center,
            };

            var pad = (int)(6 * f);
            var percentRect = new RectangleF(pad, pad, width - pad * 2, height * 0.42f - pad);
            var statusRect = new RectangleF(pad, height * 0.42f, width - pad * 2, height * 0.26f);

            g.DrawString(_percentText, percentFont, percentBrush, percentRect, format);
            g.DrawString(_statusText, statusFont, statusBrush, statusRect, format);
        }

        DrawBatteryBar(g, f, width, height);

        return bitmap;
    }

    /// <summary>
    /// Rounded battery bar near the bottom of the widget - fill width tracks the
    /// animated percent, color matches the tray icon's level color, and while
    /// charging a soft pulsing glow breathes behind the fill (AnimTick drives it).
    /// </summary>
    private void DrawBatteryBar(Graphics g, float f, int width, int height)
    {
        var pad = (int)(10 * f);
        var barHeight = Math.Max(4, (int)(8 * f));
        var barTop = height - pad - barHeight;
        var barRect = new Rectangle(pad, barTop, Math.Max(1, width - pad * 2), barHeight);
        var radius = barHeight / 2;

        using (var trackBrush = new SolidBrush(Color.FromArgb(70, 255, 255, 255)))
            FillRoundedRectangle(g, trackBrush, barRect, radius);

        if (_percent < 0)
            return;

        var fillWidth = Math.Max(
            barRect.Height,
            (int)(barRect.Width * Math.Clamp(_displayedPercent, 0, 100) / 100f));
        var fillRect = new Rectangle(barRect.X, barRect.Y, Math.Min(barRect.Width, fillWidth), barRect.Height);
        var color = BatteryIconRenderer.LevelColorFor(_percent, _charging);

        if (_charging)
        {
            // Pulsing outer glow, alpha oscillating via the sine wave AnimTick advances.
            var glowAlpha = (int)(60 + 50 * (0.5 + 0.5 * Math.Sin(_glowPhase)));
            var glowRect = Rectangle.Inflate(fillRect, (int)(3 * f), (int)(3 * f));
            using var glowBrush = new SolidBrush(Color.FromArgb(glowAlpha, color));
            FillRoundedRectangle(g, glowBrush, glowRect, radius + (int)(3 * f));
        }

        using var fillBrush = new LinearGradientBrush(
            fillRect,
            ControlPaint.Light(color, 0.15f),
            ControlPaint.Dark(color, 0.05f),
            LinearGradientMode.Vertical);
        FillRoundedRectangle(g, fillBrush, fillRect, radius);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _animTimer.Dispose();
            _deviceDebounceTimer.Dispose();
        }

        base.Dispose(disposing);
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        RegisterForDeviceNotifications();
        Render();
    }

    protected override void OnHandleDestroyed(EventArgs e)
    {
        if (_deviceNotifyHandle != IntPtr.Zero)
        {
            UnregisterDeviceNotification(_deviceNotifyHandle);
            _deviceNotifyHandle = IntPtr.Zero;
        }

        base.OnHandleDestroyed(e);
    }

    private void RegisterForDeviceNotifications()
    {
        var filter = new DEV_BROADCAST_DEVICEINTERFACE
        {
            dbcc_devicetype = DBT_DEVTYP_DEVICEINTERFACE,
            dbcc_classguid = GUID_DEVINTERFACE_HID,
        };
        filter.dbcc_size = Marshal.SizeOf(filter);

        var buffer = Marshal.AllocHGlobal(filter.dbcc_size);
        try
        {
            Marshal.StructureToPtr(filter, buffer, false);
            _deviceNotifyHandle = RegisterDeviceNotification(Handle, buffer, DEVICE_NOTIFY_WINDOW_HANDLE);
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    protected override void OnVisibleChanged(EventArgs e)
    {
        base.OnVisibleChanged(e);
        if (Visible)
            Render();
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_LBUTTONDOWN && _draggable)
        {
            ReleaseCapture();
            SendMessage(Handle, WM_NCLBUTTONDOWN, HTCAPTION, IntPtr.Zero);
            return;
        }

        if (m.Msg == WM_DEVICECHANGE && (int)m.WParam == DBT_DEVICEARRIVAL && _onDeviceArrived is not null)
        {
            // Restart rather than just start: a burst of arrivals should still
            // only fire the callback once, after things settle.
            _deviceDebounceTimer.Stop();
            _deviceDebounceTimer.Start();
        }

        base.WndProc(ref m);

        if (m.Msg == WM_EXITSIZEMOVE && !_suppressPositionSave)
            _onPositionChanged?.Invoke(Location);
    }

    private void Render()
    {
        if (!IsHandleCreated || !Visible)
            return;

        var width = Math.Max(1, Width);
        var height = Math.Max(1, Height);
        var f = _scalePercent / 100f;

        using var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(bitmap))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.AntiAlias;
            g.Clear(Color.Transparent);

            var bgAlpha = (int)(255 * _backgroundOpacity / 100.0);
            if (bgAlpha > 0)
            {
                using var bgBrush = new SolidBrush(Color.FromArgb(bgAlpha, 28, 28, 32));
                FillRoundedRectangle(g, bgBrush, new Rectangle(0, 0, width - 1, height - 1), (int)(10 * f));
            }

            var fontAlpha = (int)(255 * _fontOpacity / 100.0);
            if (fontAlpha > 0)
            {
                using var percentFont = new Font("Segoe UI", BasePercentFont * f, FontStyle.Bold);
                using var statusFont = new Font("Segoe UI", BaseStatusFont * f);
                using var percentBrush = new SolidBrush(Color.FromArgb(fontAlpha, 255, 255, 255));
                using var statusBrush = new SolidBrush(Color.FromArgb((int)(fontAlpha * 0.75), 180, 180, 190));
                using var format = new StringFormat
                {
                    Alignment = StringAlignment.Center,
                    LineAlignment = StringAlignment.Center,
                };

                var pad = (int)(6 * f);
                var percentRect = new RectangleF(pad, pad, width - pad * 2, height * 0.42f - pad);
                var statusRect = new RectangleF(pad, height * 0.42f, width - pad * 2, height * 0.26f);

                g.DrawString(_percentText, percentFont, percentBrush, percentRect, format);
                g.DrawString(_statusText, statusFont, statusBrush, statusRect, format);
            }

            DrawBatteryBar(g, f, width, height);
        }

        PushToLayeredWindow(bitmap);
    }

    private void PushToLayeredWindow(Bitmap bitmap)
    {
        var screenDc = GetDC(IntPtr.Zero);
        var memDc = CreateCompatibleDC(screenDc);
        var hBitmap = IntPtr.Zero;
        var oldBitmap = IntPtr.Zero;

        try
        {
            hBitmap = bitmap.GetHbitmap(Color.FromArgb(0));
            oldBitmap = SelectObject(memDc, hBitmap);

            var size = new SIZE(bitmap.Width, bitmap.Height);
            var pointSource = new POINT(0, 0);
            var topPos = new POINT(Left, Top);
            var blend = new BLENDFUNCTION
            {
                BlendOp = AC_SRC_OVER,
                BlendFlags = 0,
                SourceConstantAlpha = 255,
                AlphaFormat = AC_SRC_ALPHA,
            };

            UpdateLayeredWindow(Handle, screenDc, ref topPos, ref size, memDc, ref pointSource, 0, ref blend, ULW_ALPHA);
        }
        finally
        {
            ReleaseDC(IntPtr.Zero, screenDc);
            if (hBitmap != IntPtr.Zero)
            {
                SelectObject(memDc, oldBitmap);
                DeleteObject(hBitmap);
            }

            DeleteDC(memDc);
        }
    }

    private static void FillRoundedRectangle(Graphics g, Brush brush, Rectangle rect, int radius)
    {
        if (radius <= 0)
        {
            g.FillRectangle(brush, rect);
            return;
        }

        var d = radius * 2;
        using var path = new GraphicsPath();
        path.AddArc(rect.X, rect.Y, d, d, 180, 90);
        path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
        path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
        path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        g.FillPath(brush, path);
    }
}
