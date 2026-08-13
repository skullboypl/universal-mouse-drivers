namespace UmdBatteryTray;

using UmdBatteryTray.Protocol;

internal sealed class SettingsForm : Form
{
    private readonly AppSettings _settings;
    private readonly BatteryWidgetForm _widget;
    private readonly Action<AppSettings> _onApply;

    private readonly ComboBox _deviceCombo = new()
    {
        DropDownStyle = ComboBoxStyle.DropDownList,
        Width = 318,
    };
    private readonly Button _refreshDevicesBtn = new()
    {
        Text = "Refresh list",
        Size = new Size(100, 26),
    };

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
        Text = "Start with Windows (autostart UMD Battery Tray)",
        AutoSize = true,
    };
    private readonly CheckBox _autoUpdate = new()
    {
        Text = "Check for updates on start",
        AutoSize = true,
    };
    private readonly ComboBox _languageCombo = new()
    {
        DropDownStyle = ComboBoxStyle.DropDownList,
        Width = 220,
    };
    private readonly Label _languageLabel = new() { AutoSize = true };

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
        ClientSize = new Size(380, 860);
        Font = new Font("Segoe UI", 9f);

        var deviceGroup = new GroupBox
        {
            Text = "Mouse (battery source)",
            Location = new Point(16, 12),
            Size = new Size(348, 110),
        };
        var deviceHint = new Label
        {
            Text = "When both mice are plugged in, pick which battery to show.",
            AutoSize = true,
            Location = new Point(14, 22),
            MaximumSize = new Size(318, 0),
        };
        _deviceCombo.Location = new Point(14, 46);
        _refreshDevicesBtn.Location = new Point(14, 76);
        _refreshDevicesBtn.Click += (_, _) => ReloadDevices();
        deviceGroup.Controls.AddRange([deviceHint, _deviceCombo, _refreshDevicesBtn]);

        var trayGroup = new GroupBox
        {
            Text = "Tray icon",
            Location = new Point(16, 130),
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
            Location = new Point(16, 298),
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
            Location = new Point(16, 622),
            Size = new Size(348, 156),
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
        _languageLabel.Text = "Language";
        _languageLabel.Location = new Point(14, 112);
        _languageCombo.Location = new Point(120, 108);
        foreach (var (code, name) in UiLang.Choices)
            _languageCombo.Items.Add(new LangItem(code, name));
        serviceGroup.Controls.AddRange([
            _runAtStartup, _autoUpdate, pollLabel, _pollInterval,
            _languageLabel, _languageCombo,
        ]);

        var okBtn = new Button
        {
            Text = "OK",
            DialogResult = DialogResult.OK,
            Location = new Point(188, 802),
            Size = new Size(84, 28),
        };
        okBtn.Click += (_, _) => SaveAndApply(close: true);

        var applyBtn = new Button
        {
            Text = "Apply",
            Location = new Point(100, 802),
            Size = new Size(84, 28),
        };
        applyBtn.Click += (_, _) => SaveAndApply(close: false);

        var cancelBtn = new Button
        {
            Text = "Cancel",
            DialogResult = DialogResult.Cancel,
            Location = new Point(276, 802),
            Size = new Size(84, 28),
        };

        Controls.AddRange([deviceGroup, trayGroup, widgetGroup, serviceGroup, applyBtn, okBtn, cancelBtn]);

        AcceptButton = okBtn;
        CancelButton = cancelBtn;

        LoadFromSettings();
        _languageCombo.SelectedIndexChanged += (_, _) =>
        {
            if (!_loaded) return;
            ApplyLocalizedLabels();
        };
    }

    private void ReloadDevices()
    {
        var preferred = _settings.PreferredDeviceKey;
        if (_deviceCombo.SelectedItem is DeviceItem selected)
            preferred = selected.Key;

        _deviceCombo.Items.Clear();
        _deviceCombo.Items.Add(new DeviceItem(null, "Auto (first available)"));

        var list = UmdDeviceEnumerator.ListAvailable();
        foreach (var d in list)
            _deviceCombo.Items.Add(new DeviceItem(d.Key, d.DisplayLabel));

        var idx = 0;
        if (!string.IsNullOrWhiteSpace(preferred))
        {
            for (var i = 0; i < _deviceCombo.Items.Count; i++)
            {
                if (_deviceCombo.Items[i] is DeviceItem di
                    && string.Equals(di.Key, preferred, StringComparison.OrdinalIgnoreCase))
                {
                    idx = i;
                    break;
                }
            }

            // Preferred not currently plugged — keep it visible as a sticky entry.
            if (idx == 0 && list.All(d =>
                    !string.Equals(d.Key, preferred, StringComparison.OrdinalIgnoreCase)))
            {
                _deviceCombo.Items.Add(new DeviceItem(preferred, $"{preferred} (not connected)"));
                idx = _deviceCombo.Items.Count - 1;
            }
        }

        _deviceCombo.SelectedIndex = idx;
    }

    private void LoadFromSettings()
    {
        ReloadDevices();

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

        var lang = UiLang.Normalize(_settings.UiLanguage);
        for (var i = 0; i < _languageCombo.Items.Count; i++)
        {
            if (_languageCombo.Items[i] is LangItem li && li.Code == lang)
            {
                _languageCombo.SelectedIndex = i;
                break;
            }
        }
        if (_languageCombo.SelectedIndex < 0 && _languageCombo.Items.Count > 0)
            _languageCombo.SelectedIndex = 0;

        ApplyLocalizedLabels();
        _loaded = true;
    }

    private void ApplyLocalizedLabels()
    {
        var lang = _languageCombo.SelectedItem is LangItem li
            ? li.Code
            : UiLang.Normalize(_settings.UiLanguage);
        string S(string key) => UiText.T(lang, key);

        Text = S("settings.title");
        _refreshDevicesBtn.Text = S("settings.refreshList");
        _trayBattery.Text = S("settings.batteryIcon");
        _trayPercent.Text = S("settings.percentOnly");
        _trayBoth.Text = S("settings.batteryPercent");
        _widgetVisible.Text = S("settings.showWidget");
        _widgetDraggable.Text = S("settings.dragWidget");
        _runAtStartup.Text = S("settings.autostart");
        _autoUpdate.Text = S("settings.autoUpdate");
        _languageLabel.Text = S("settings.language");
    }

    private void CollectIntoSettings()
    {
        _settings.TrayDisplay = _trayBattery.Checked
            ? TrayDisplayMode.BatteryIcon
            : _trayPercent.Checked
                ? TrayDisplayMode.Percent
                : TrayDisplayMode.BatteryWithPercent;

        _settings.PreferredDeviceKey = _deviceCombo.SelectedItem is DeviceItem di
            ? di.Key
            : null;

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
        _settings.UiLanguage = _languageCombo.SelectedItem is LangItem langItem
            ? langItem.Code
            : UiLang.Normalize(_settings.UiLanguage);
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

    private sealed record DeviceItem(string? Key, string Label)
    {
        public override string ToString() => Label;
    }

    private sealed record LangItem(string Code, string NativeName)
    {
        public override string ToString() => NativeName;
    }
}
