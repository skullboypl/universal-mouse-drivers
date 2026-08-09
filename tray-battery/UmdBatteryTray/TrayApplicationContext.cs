using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly ContextMenuStrip _menu;
    private readonly ToolStripMenuItem _widgetMenuItem;
    private readonly System.Windows.Forms.Timer _pollTimer;
    private readonly KingUltraBatteryReader _reader = new();
    private readonly BatteryWidgetForm _widget = new();
    private readonly AppSettings _settings;

    private Icon? _currentIcon;
    private BatteryReading? _lastReading;
    private SettingsForm? _settingsForm;

    public TrayApplicationContext()
    {
        _settings = AppSettings.Load();

        _menu = new ContextMenuStrip();
        _menu.Items.Add("Refresh now", null, (_, _) => _ = RefreshBatteryAsync());

        _widgetMenuItem = new ToolStripMenuItem("Show desktop widget", null, ToggleWidget)
        {
            Checked = _settings.WidgetVisible,
        };
        _menu.Items.Add(_widgetMenuItem);
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add("Settings…", null, OpenSettings);
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add("Exit", null, (_, _) => ExitThread());

        _trayIcon = new NotifyIcon
        {
            Visible = true,
            Text = "UMD Battery - starting…",
            ContextMenuStrip = _menu,
        };
        _trayIcon.DoubleClick += (_, _) => _ = RefreshBatteryAsync();

        _widget.SetPositionChangedHandler(OnWidgetMoved);
        ApplySettings(_settings, initial: true);

        _pollTimer = new System.Windows.Forms.Timer { Interval = _settings.PollIntervalSeconds * 1000 };
        _pollTimer.Tick += (_, _) => _ = RefreshBatteryAsync();
        _pollTimer.Start();

        _ = RefreshBatteryAsync();
    }

    private void OpenSettings(object? sender, EventArgs e)
    {
        if (_settingsForm is { IsDisposed: false })
        {
            _settingsForm.Focus();
            return;
        }

        _settingsForm = new SettingsForm(_settings, _widget, s => ApplySettings(s));
        _settingsForm.FormClosed += (_, _) => _settingsForm = null;
        _settingsForm.Show();
    }

    private void ApplySettings(AppSettings settings, bool initial = false)
    {
        _widget.ApplyScale(settings.WidgetScalePercent);
        _widget.ApplyBackgroundOpacity(settings.WidgetBackgroundOpacityPercent);
        _widget.ApplyFontOpacity(settings.WidgetFontOpacityPercent);
        _widget.SetDraggable(settings.WidgetDraggable);
        _widget.ApplyPosition(settings.ResolveWidgetLocation(_widget.Size));

        _widget.Visible = settings.WidgetVisible;
        _widgetMenuItem.Checked = settings.WidgetVisible;

        if (!initial && _pollTimer.Interval != settings.PollIntervalSeconds * 1000)
        {
            _pollTimer.Stop();
            _pollTimer.Interval = settings.PollIntervalSeconds * 1000;
            _pollTimer.Start();
        }

        if (_lastReading is not null)
            UpdateUi(_lastReading, null);
        else if (initial)
            UpdateUi(null, null);
    }

    private void OnWidgetMoved(Point location)
    {
        _settings.WidgetX = location.X;
        _settings.WidgetY = location.Y;
        _settings.Save();
    }

    private async Task RefreshBatteryAsync()
    {
        try
        {
            var reading = await Task.Run(() =>
            {
                if (!_reader.IsConnected)
                    _reader.Connect();
                return _reader.ReadBattery();
            });

            _lastReading = reading;
            UpdateUi(reading, null);
        }
        catch (Exception ex)
        {
            _reader.Disconnect();
            UpdateUi(null, ex.Message);
        }
    }

    private void UpdateUi(BatteryReading? reading, string? error)
    {
        _currentIcon?.Dispose();
        if (reading is not null)
        {
            _currentIcon = BatteryIconRenderer.Create(
                reading.Value.Percent,
                reading.Value.Status is BatteryStatus.Charging or BatteryStatus.Full,
                _settings.TrayDisplay,
                _settings.TrayFontScalePercent,
                _settings.TrayIconScalePercent);
            _trayIcon.Icon = _currentIcon;

            var status = reading.Value.Status switch
            {
                BatteryStatus.Charging => "charging",
                BatteryStatus.Full => "full",
                BatteryStatus.Discharging => "on battery",
                _ => "connected",
            };
            var device = _reader.DeviceLabel ?? "King Ultra";
            _trayIcon.Text = $"UMD: {reading.Value.Percent}% ({status}) · {TrimTip(device)}";
        }
        else
        {
            _trayIcon.Icon = SystemIcons.Application;
            _trayIcon.Text = error is null
                ? "UMD Battery - no device"
                : TrimTip($"UMD Battery - {error}");
        }

        if (_widget.Visible)
            _widget.UpdateReading(reading, error);
    }

    private static string TrimTip(string text)
    {
        // NotifyIcon.Text max ~63 chars on Windows
        return text.Length <= 63 ? text : text[..60] + "…";
    }

    private void ToggleWidget(object? sender, EventArgs e)
    {
        _widget.Visible = !_widget.Visible;
        _widgetMenuItem.Checked = _widget.Visible;
        _settings.WidgetVisible = _widget.Visible;
        _settings.Save();

        if (_widget.Visible)
            _widget.UpdateReading(_lastReading);
    }

    protected override void ExitThreadCore()
    {
        _pollTimer.Stop();
        _pollTimer.Dispose();
        _settingsForm?.Close();
        _trayIcon.Visible = false;
        _trayIcon.Dispose();
        _currentIcon?.Dispose();
        _reader.Dispose();
        _widget.Dispose();
        base.ExitThreadCore();
    }
}
