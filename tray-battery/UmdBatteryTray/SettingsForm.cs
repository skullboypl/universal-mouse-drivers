namespace UmdBatteryTray;

internal sealed class SettingsForm : Form
{
    private readonly AppSettings _settings;
    private readonly BatteryWidgetForm _widget;
    private readonly Action<AppSettings> _onApply;

    private readonly RadioButton _trayBattery = new() { Text = "Battery icon", AutoSize = true };
    private readonly RadioButton _trayPercent = new() { Text = "Percent only", AutoSize = true };
    private readonly RadioButton _trayBoth = new() { Text = "Battery + percent", AutoSize = true };

    private readonly TrackBar _trayFont = new()
    {
        Minimum = 60,
        Maximum = 400,
        TickFrequency = 50,
        SmallChange = 5,
        LargeChange = 50,
        Width = 185,
    };
    private readonly Label _trayFontValue = new() { AutoSize = true };

    private readonly TrackBar _trayIcon = new()
    {
        Minimum = 60,
        Maximum = 400,
        TickFrequency = 50,
        SmallChange = 5,
        LargeChange = 50,
        Width = 185,
    };
    private readonly Label _trayIconValue = new() { AutoSize = true };

    private bool _loaded;

    private readonly CheckBox _widgetVisible = new() { Text = "Show desktop widget", AutoSize = true };
    private readonly CheckBox _widgetDraggable = new() { Text = "Allow dragging widget", AutoSize = true };

    private readonly NumericUpDown _posX = new() { Minimum = -32768, Maximum = 32767, Width = 90 };
    private readonly NumericUpDown _posY = new() { Minimum = -32768, Maximum = 32767, Width = 90 };
    private readonly TrackBar _widgetScale = new()
    {
        Minimum = 50,
        Maximum = 250,
        TickFrequency = 25,
        SmallChange = 5,
        LargeChange = 25,
        Width = 210,
    };
    private readonly Label _widgetScaleValue = new() { AutoSize = true };
    private readonly TrackBar _widgetOpacity = new()
    {
        Minimum = 0,
        Maximum = 100,
        TickFrequency = 10,
        SmallChange = 5,
        LargeChange = 10,
        Width = 210,
    };
    private readonly Label _widgetOpacityValue = new() { AutoSize = true };
    private readonly TrackBar _widgetFontOpacity = new()
    {
        Minimum = 0,
        Maximum = 100,
        TickFrequency = 10,
        SmallChange = 5,
        LargeChange = 10,
        Width = 210,
    };
    private readonly Label _widgetFontOpacityValue = new() { AutoSize = true };
    private readonly NumericUpDown _pollInterval = new() { Minimum = 15, Maximum = 300, Width = 90, Increment = 15 };
    private readonly CheckBox _runAtStartup = new()
    {
        Text = "Show battery % at Windows startup",
        AutoSize = true,
    };
    private readonly CheckBox _autoUpdate = new()
    {
        Text = "Check for updates on start",
        AutoSize = true,
    };

    public SettingsForm(AppSettings settings, BatteryWidgetForm widget, Action<AppSettings> onApply)
    {
        _settings = settings;
        _widget = widget;
        _onApply = onApply;

        Text = "UMD Battery - Settings";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(380, 668);
        Font = new Font("Segoe UI", 9f);

        var trayGroup = new GroupBox
        {
            Text = "Tray icon",
            Location = new Point(16, 12),
            Size = new Size(348, 160),
        };

        _trayBattery.Location = new Point(14, 26);
        _trayPercent.Location = new Point(14, 50);
        _trayBoth.Location = new Point(14, 74);

        var trayFontLabel = new Label { Text = "Font size:", AutoSize = true, Location = new Point(160, 20) };
        _trayFontValue.Location = new Point(296, 20);
        _trayFontValue.Text = "100%";
        _trayFont.Location = new Point(158, 40);
        _trayFont.ValueChanged += (_, _) =>
        {
            _trayFontValue.Text = $"{_trayFont.Value}%";
            PreviewIfLoaded();
        };

        var trayIconLabel = new Label { Text = "Icon size:", AutoSize = true, Location = new Point(160, 92) };
        _trayIconValue.Location = new Point(296, 92);
        _trayIconValue.Text = "100%";
        _trayIcon.Location = new Point(158, 112);
        _trayIcon.ValueChanged += (_, _) =>
        {
            _trayIconValue.Text = $"{_trayIcon.Value}%";
            PreviewIfLoaded();
        };

        _trayBattery.CheckedChanged += (_, _) => PreviewIfLoaded();
        _trayPercent.CheckedChanged += (_, _) => PreviewIfLoaded();
        _trayBoth.CheckedChanged += (_, _) => PreviewIfLoaded();

        trayGroup.Controls.AddRange([
            _trayBattery, _trayPercent, _trayBoth,
            trayFontLabel, _trayFontValue, _trayFont,
            trayIconLabel, _trayIconValue, _trayIcon,
        ]);

        var widgetGroup = new GroupBox
        {
            Text = "Desktop widget",
            Location = new Point(16, 180),
            Size = new Size(348, 316),
        };

        _widgetVisible.Location = new Point(14, 24);
        _widgetDraggable.Location = new Point(14, 48);

        var posLabel = new Label { Text = "Position (X, Y):", AutoSize = true, Location = new Point(14, 80) };
        _posX.Location = new Point(120, 76);
        _posY.Location = new Point(220, 76);

        var resetBtn = new Button
        {
            Text = "Reset position",
            Location = new Point(14, 112),
            Size = new Size(110, 28),
        };
        resetBtn.Click += (_, _) =>
        {
            var def = AppSettings.DefaultWidgetLocation(_widget.Size);
            _posX.Value = def.X;
            _posY.Value = def.Y;
            _widget.ApplyPosition(def);
        };

        var pickBtn = new Button
        {
            Text = "Use current",
            Location = new Point(132, 112),
            Size = new Size(110, 28),
        };
        pickBtn.Click += (_, _) =>
        {
            if (_widget.Visible)
            {
                _posX.Value = _widget.Location.X;
                _posY.Value = _widget.Location.Y;
            }
        };

        var scaleLabel = new Label { Text = "Size:", AutoSize = true, Location = new Point(14, 152) };
        _widgetScale.Location = new Point(60, 148);
        _widgetScaleValue.Location = new Point(278, 152);
        _widgetScaleValue.Text = "100%";
        _widgetScale.ValueChanged += (_, _) =>
        {
            _widgetScaleValue.Text = $"{_widgetScale.Value}%";
            _widget.ApplyScale(_widgetScale.Value);
            if (_widget.Visible)
                _widget.ApplyPosition(_widget.Location);
        };

        var opacityLabel = new Label { Text = "Background opacity:", AutoSize = true, Location = new Point(14, 188) };
        _widgetOpacity.Location = new Point(14, 208);
        _widgetOpacityValue.Location = new Point(278, 212);
        _widgetOpacityValue.Text = "85%";
        _widgetOpacity.ValueChanged += (_, _) =>
        {
            _widgetOpacityValue.Text = $"{_widgetOpacity.Value}%";
            _widget.ApplyBackgroundOpacity(_widgetOpacity.Value);
        };

        var fontOpacityLabel = new Label { Text = "Font opacity:", AutoSize = true, Location = new Point(14, 248) };
        _widgetFontOpacity.Location = new Point(14, 268);
        _widgetFontOpacityValue.Location = new Point(278, 272);
        _widgetFontOpacityValue.Text = "100%";
        _widgetFontOpacity.ValueChanged += (_, _) =>
        {
            _widgetFontOpacityValue.Text = $"{_widgetFontOpacity.Value}%";
            _widget.ApplyFontOpacity(_widgetFontOpacity.Value);
        };

        _widgetVisible.CheckedChanged += (_, _) => PreviewIfLoaded();
        _widgetDraggable.CheckedChanged += (_, _) => PreviewIfLoaded();

        widgetGroup.Controls.AddRange([
            _widgetVisible, _widgetDraggable, posLabel, _posX, _posY, resetBtn, pickBtn,
            scaleLabel, _widgetScale, _widgetScaleValue,
            opacityLabel, _widgetOpacity, _widgetOpacityValue,
            fontOpacityLabel, _widgetFontOpacity, _widgetFontOpacityValue,
        ]);

        var serviceGroup = new GroupBox
        {
            Text = "Startup & updates",
            Location = new Point(16, 504),
            Size = new Size(348, 118),
        };
        _runAtStartup.Location = new Point(14, 24);
        _autoUpdate.Location = new Point(14, 50);
        var pollLabel = new Label
        {
            Text = "Refresh interval (sec):",
            AutoSize = true,
            Location = new Point(14, 80),
        };
        _pollInterval.Location = new Point(170, 76);
        serviceGroup.Controls.AddRange([_runAtStartup, _autoUpdate, pollLabel, _pollInterval]);

        var okBtn = new Button
        {
            Text = "OK",
            DialogResult = DialogResult.OK,
            Location = new Point(188, 632),
            Size = new Size(84, 28),
        };
        okBtn.Click += (_, _) => SaveAndApply(close: true);

        var applyBtn = new Button
        {
            Text = "Apply",
            Location = new Point(100, 632),
            Size = new Size(84, 28),
        };
        applyBtn.Click += (_, _) => SaveAndApply(close: false);

        var cancelBtn = new Button
        {
            Text = "Cancel",
            DialogResult = DialogResult.Cancel,
            Location = new Point(276, 632),
            Size = new Size(84, 28),
        };

        Controls.AddRange([trayGroup, widgetGroup, serviceGroup, applyBtn, okBtn, cancelBtn]);

        AcceptButton = okBtn;
        CancelButton = cancelBtn;

        LoadFromSettings();
    }

    private void LoadFromSettings()
    {
        switch (_settings.TrayDisplay)
        {
            case TrayDisplayMode.BatteryIcon:
                _trayBattery.Checked = true;
                break;
            case TrayDisplayMode.Percent:
                _trayPercent.Checked = true;
                break;
            default:
                _trayBoth.Checked = true;
                break;
        }

        _widgetVisible.Checked = _settings.WidgetVisible;
        _widgetDraggable.Checked = _settings.WidgetDraggable;
        _runAtStartup.Checked = _settings.RunAtStartup;
        _autoUpdate.Checked = _settings.AutoUpdateOnStart;
        _pollInterval.Value = Math.Clamp(_settings.PollIntervalSeconds, 15, 300);

        _widgetScale.Value = Math.Clamp(_settings.WidgetScalePercent, _widgetScale.Minimum, _widgetScale.Maximum);
        _widgetScaleValue.Text = $"{_widgetScale.Value}%";

        _widgetOpacity.Value = Math.Clamp(_settings.WidgetBackgroundOpacityPercent, _widgetOpacity.Minimum, _widgetOpacity.Maximum);
        _widgetOpacityValue.Text = $"{_widgetOpacity.Value}%";

        _widgetFontOpacity.Value = Math.Clamp(_settings.WidgetFontOpacityPercent, _widgetFontOpacity.Minimum, _widgetFontOpacity.Maximum);
        _widgetFontOpacityValue.Text = $"{_widgetFontOpacity.Value}%";

        _trayFont.Value = Math.Clamp(_settings.TrayFontScalePercent, _trayFont.Minimum, _trayFont.Maximum);
        _trayFontValue.Text = $"{_trayFont.Value}%";

        _trayIcon.Value = Math.Clamp(_settings.TrayIconScalePercent, _trayIcon.Minimum, _trayIcon.Maximum);
        _trayIconValue.Text = $"{_trayIcon.Value}%";

        var pos = _settings.ResolveWidgetLocation(_widget.Size);
        _posX.Value = pos.X;
        _posY.Value = pos.Y;

        _loaded = true;
    }

    private void CollectIntoSettings()
    {
        _settings.TrayDisplay = _trayBattery.Checked
            ? TrayDisplayMode.BatteryIcon
            : _trayPercent.Checked
                ? TrayDisplayMode.Percent
                : TrayDisplayMode.BatteryWithPercent;

        _settings.WidgetVisible = _widgetVisible.Checked;
        _settings.WidgetDraggable = _widgetDraggable.Checked;
        _settings.WidgetX = (int)_posX.Value;
        _settings.WidgetY = (int)_posY.Value;
        _settings.WidgetScalePercent = _widgetScale.Value;
        _settings.WidgetBackgroundOpacityPercent = _widgetOpacity.Value;
        _settings.WidgetFontOpacityPercent = _widgetFontOpacity.Value;
        _settings.TrayFontScalePercent = _trayFont.Value;
        _settings.TrayIconScalePercent = _trayIcon.Value;
        _settings.PollIntervalSeconds = (int)_pollInterval.Value;
        _settings.RunAtStartup = _runAtStartup.Checked;
        _settings.AutoUpdateOnStart = _autoUpdate.Checked;
    }

    private void PreviewIfLoaded()
    {
        if (!_loaded)
            return;

        CollectIntoSettings();
        _onApply(_settings);
    }

    private void SaveAndApply(bool close)
    {
        CollectIntoSettings();
        _settings.Save();
        _onApply(_settings);

        if (close)
            Close();
    }
}
