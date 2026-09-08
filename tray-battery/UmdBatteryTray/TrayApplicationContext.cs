using System.Diagnostics;
using System.Reflection;
using UmdBatteryTray.Protocol;

namespace UmdBatteryTray;

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly ContextMenuStrip _menu;
    private readonly ToolStripMenuItem _widgetMenuItem;
    private readonly ToolStripMenuItem _deviceMenuItem;
    private readonly System.Windows.Forms.Timer _pollTimer;
    private readonly UmdBatteryReader _reader = new();
    private readonly BatteryWidgetForm _widget = new();
    private readonly AppSettings _settings;
    private readonly BridgeServer _bridge;
    private readonly Icon _appIcon;

    private Icon? _currentIcon;
    private BatteryReading? _lastReading;
    private SettingsForm? _settingsForm;
    private UpdatePromptForm? _updateForm;
    private bool _rebuildingDeviceMenu;

    public TrayApplicationContext()
    {
        _settings = AppSettings.Load();
        _reader.SetPreferredDeviceKey(_settings.PreferredDeviceKey);
        // Sync shortcut with saved preference (and heal missing/extra shortcuts).
        StartupHelper.SetEnabled(_settings.RunAtStartup);

        _appIcon = LoadAppIcon();

        _menu = new ContextMenuStrip();
        var versionItem = new ToolStripMenuItem(
            $"{AppConstants.ProductName} v{UpdateService.CurrentVersion}")
        {
            Enabled = false,
        };
        _menu.Items.Add(versionItem);
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add(UiText.T(_settings.UiLanguage, "tray.refreshNow"), null, (_, _) => _ = RefreshBatteryAsync());

        _deviceMenuItem = new ToolStripMenuItem(UiText.T(_settings.UiLanguage, "settings.mouse"));
        _menu.Items.Add(_deviceMenuItem);
        _menu.Opening += (_, _) => RebuildDeviceMenu();

        _widgetMenuItem = new ToolStripMenuItem(
            UiText.T(_settings.UiLanguage, "settings.showWidget"),
            null,
            ToggleWidget)
        {
            Checked = _settings.WidgetVisible,
        };
        _menu.Items.Add(_widgetMenuItem);
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add(
            UiText.T(_settings.UiLanguage, "tray.menuOpenSite"),
            null,
            (_, _) => OpenUrl(AppConstants.MouseSiteUrl));
        _menu.Items.Add(
            UiText.T(_settings.UiLanguage, "tray.menuCheckUpdates"),
            null,
            (_, _) => OpenUpdatePrompt());
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add(
            UiText.T(_settings.UiLanguage, "tray.menuSettings"),
            null,
            (_, _) => OpenSettings());
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add(
            UiText.T(_settings.UiLanguage, "tray.menuExit"),
            null,
            (_, _) => ExitThread());

        _trayIcon = new NotifyIcon
        {
            Visible = true,
            Text = UiText.T(_settings.UiLanguage, "tray.starting"),
            ContextMenuStrip = _menu,
            Icon = _appIcon,
        };
        _trayIcon.DoubleClick += (_, _) => _ = RefreshBatteryAsync();

        _widget.SetPositionChangedHandler(OnWidgetMoved);
        ApplySettings(_settings, initial: true);

        _bridge = new BridgeServer(
            _settings,
            () => _lastReading,
            () => _reader.DeviceLabel,
            BuildDevicesPayload,
            SetPreferredDeviceFromBridgeAsync,
            s => ApplySettings(s),
            RequestOpenSettings);
        _bridge.Start();

        _pollTimer = new System.Windows.Forms.Timer { Interval = _settings.PollIntervalSeconds * 1000 };
        _pollTimer.Tick += (_, _) => _ = RefreshBatteryAsync();
        _pollTimer.Start();

        RebuildDeviceMenu();
        _ = RefreshBatteryAsync();
        if (_settings.AutoUpdateOnStart)
        {
            var updateKick = new System.Windows.Forms.Timer { Interval = 1200 };
            updateKick.Tick += (_, _) =>
            {
                updateKick.Stop();
                updateKick.Dispose();
                OpenUpdatePrompt(silentIfUpToDate: true);
            };
            updateKick.Start();
        }
    }

    private object BuildDevicesPayload()
    {
        var available = _reader.ListAvailable();
        return available.Select(d => new
        {
            key = d.Key,
            kind = d.Kind.ToString(),
            vendorId = d.VendorId,
            productId = d.ProductId,
            name = d.ProductName,
            label = d.DisplayLabel,
            active = string.Equals(d.Key, _reader.ActiveDeviceKey, StringComparison.OrdinalIgnoreCase),
            preferred = string.Equals(d.Key, _settings.PreferredDeviceKey, StringComparison.OrdinalIgnoreCase),
        }).ToArray();
    }

    private Task<object> SetPreferredDeviceFromBridgeAsync(string? key)
    {
        var tcs = new TaskCompletionSource<object>();
        void Work()
        {
            try
            {
                ApplyPreferredDevice(key, reconnect: true);
                tcs.SetResult(new
                {
                    ok = true,
                    preferredDeviceKey = _settings.PreferredDeviceKey,
                    device = _reader.DeviceLabel,
                    devices = BuildDevicesPayload(),
                });
            }
            catch (Exception ex)
            {
                tcs.SetResult(new { ok = false, error = ex.Message });
            }
        }

        try
        {
            if (_menu.IsHandleCreated)
            {
                _menu.BeginInvoke(Work);
                return tcs.Task;
            }
        }
        catch { /* fall through */ }

        Work();
        return tcs.Task;
    }

    private void ApplyPreferredDevice(string? key, bool reconnect)
    {
        var normalized = string.IsNullOrWhiteSpace(key) ? null : key.Trim();
        _settings.PreferredDeviceKey = normalized;
        _settings.Save();
        _reader.SetPreferredDeviceKey(normalized);
        RebuildDeviceMenu();

        if (reconnect)
        {
            _reader.Disconnect();
            _ = RefreshBatteryAsync();
        }
    }

    private void RebuildDeviceMenu()
    {
        if (_rebuildingDeviceMenu)
            return;
        _rebuildingDeviceMenu = true;
        try
        {
            _deviceMenuItem.DropDownItems.Clear();

            var autoItem = new ToolStripMenuItem("Auto (first available)")
            {
                Checked = string.IsNullOrWhiteSpace(_settings.PreferredDeviceKey),
                Tag = null,
            };
            autoItem.Click += DeviceMenuItem_Click;
            _deviceMenuItem.DropDownItems.Add(autoItem);

            var available = _reader.ListAvailable();
            if (available.Count == 0)
            {
                _deviceMenuItem.DropDownItems.Add(new ToolStripMenuItem("(no mice detected)") { Enabled = false });
            }
            else
            {
                _deviceMenuItem.DropDownItems.Add(new ToolStripSeparator());
                foreach (var d in available)
                {
                    var item = new ToolStripMenuItem(d.DisplayLabel)
                    {
                        Checked = string.Equals(d.Key, _settings.PreferredDeviceKey, StringComparison.OrdinalIgnoreCase)
                            || (string.IsNullOrWhiteSpace(_settings.PreferredDeviceKey)
                                && string.Equals(d.Key, _reader.ActiveDeviceKey, StringComparison.OrdinalIgnoreCase)),
                        Tag = d.Key,
                    };
                    item.Click += DeviceMenuItem_Click;
                    _deviceMenuItem.DropDownItems.Add(item);
                }
            }
        }
        finally
        {
            _rebuildingDeviceMenu = false;
        }
    }

    private void DeviceMenuItem_Click(object? sender, EventArgs e)
    {
        if (sender is not ToolStripMenuItem item)
            return;

        var key = item.Tag as string;
        ApplyPreferredDevice(key, reconnect: true);
    }

    private static Icon LoadAppIcon()
    {
        try
        {
            var exe = Environment.ProcessPath;
            if (!string.IsNullOrWhiteSpace(exe) && File.Exists(exe))
            {
                var extracted = Icon.ExtractAssociatedIcon(exe);
                if (extracted is not null)
                    return extracted;
            }
        }
        catch { /* fall through */ }

        var asm = Assembly.GetExecutingAssembly();
        var name = asm.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("app.ico", StringComparison.OrdinalIgnoreCase));
        if (name is not null)
        {
            using var stream = asm.GetManifestResourceStream(name);
            if (stream is not null)
                return new Icon(stream);
        }

        return (Icon)SystemIcons.Application.Clone();
    }

    private static void OpenUrl(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
        }
        catch { /* ignore */ }
    }

    /// <summary>
    /// Context-menu / startup update UI. When <paramref name="silentIfUpToDate"/> is true
    /// (auto-check on start), the dialog is only shown if an update is available.
    /// </summary>
    private void OpenUpdatePrompt(bool silentIfUpToDate = false)
    {
        void Show()
        {
            if (_updateForm is { IsDisposed: false })
            {
                _updateForm.BringToFront();
                _updateForm.Activate();
                return;
            }

            if (silentIfUpToDate)
            {
                _ = CheckUpdatesQuietThenPromptAsync();
                return;
            }

            _updateForm = new UpdatePromptForm(_settings);
            _updateForm.FormClosed += (_, _) => _updateForm = null;
            _updateForm.Show();
            _updateForm.BringToFront();
        }

        try
        {
            if (_menu.IsHandleCreated && _menu.InvokeRequired)
            {
                _menu.BeginInvoke(Show);
                return;
            }
        }
        catch { /* fall through */ }

        Show();
    }

    private async Task CheckUpdatesQuietThenPromptAsync()
    {
        try
        {
            var outcome = await new UpdateService(_settings).FetchLatestAsync();
            if (!outcome.Success || !outcome.UpdateAvailable)
                return;

            RunOnUi(() =>
            {
                if (_updateForm is { IsDisposed: false })
                {
                    _updateForm.BringToFront();
                    return;
                }

                _updateForm = new UpdatePromptForm(_settings);
                _updateForm.FormClosed += (_, _) => _updateForm = null;
                _updateForm.Show();
                _updateForm.BringToFront();
            });
        }
        catch
        {
            /* ignore auto-check failures */
        }
    }

    /// <summary>
    /// Called from the loopback HTTP bridge (and tray menu). Marshals to the UI thread.
    /// </summary>
    private void RequestOpenSettings()
    {
        try
        {
            if (_menu.IsHandleCreated)
            {
                _menu.BeginInvoke(new Action(OpenSettings));
                return;
            }
        }
        catch
        {
            /* fall through */
        }

        OpenSettings();
    }

    private void OpenSettings()
    {
        if (_settingsForm is { IsDisposed: false })
        {
            if (_settingsForm.WindowState == FormWindowState.Minimized)
                _settingsForm.WindowState = FormWindowState.Normal;
            _settingsForm.Show();
            _settingsForm.BringToFront();
            _settingsForm.Activate();
            _settingsForm.Focus();
            return;
        }

        _settingsForm = new SettingsForm(_settings, _widget, s =>
        {
            ApplySettings(s);
            StartupHelper.SetEnabled(s.RunAtStartup);
        });
        _settingsForm.FormClosed += (_, _) => _settingsForm = null;
        _settingsForm.Show();
        _settingsForm.BringToFront();
        _settingsForm.Activate();
    }

    private void ApplySettings(AppSettings settings, bool initial = false)
    {
        var preferredChanged = !string.Equals(
            _reader.PreferredDeviceKey,
            settings.PreferredDeviceKey,
            StringComparison.OrdinalIgnoreCase);

        _reader.SetPreferredDeviceKey(settings.PreferredDeviceKey);
        RebuildDeviceMenu();

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

        if (!initial && preferredChanged)
        {
            _reader.Disconnect();
            _ = RefreshBatteryAsync();
            return;
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
                    _reader.Connect(_settings.PreferredDeviceKey);
                return _reader.ReadBattery();
            });

            _lastReading = reading;
            RunOnUi(() =>
            {
                UpdateUi(reading, null);
                RebuildDeviceMenu();
            });
        }
        catch (Exception ex)
        {
            _reader.Disconnect();
            RunOnUi(() => UpdateUi(null, ex.Message));
        }
    }

    private void RunOnUi(Action action)
    {
        try
        {
            if (_menu.IsHandleCreated && _menu.InvokeRequired)
            {
                _menu.BeginInvoke(action);
                return;
            }
        }
        catch { /* fall through */ }

        action();
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
                BatteryStatus.Unknown => "battery n/a",
                _ => "connected",
            };
            var device = _reader.DeviceLabel ?? "UMD mouse";
            _trayIcon.Text = reading.Value.Status == BatteryStatus.Unknown
                ? TrimTip($"UMD: n/a · {device}")
                : $"UMD: {reading.Value.Percent}% ({status}) · {TrimTip(device)}";
        }
        else
        {
            _trayIcon.Icon = _appIcon;
            _trayIcon.Text = error is null
                ? "UMD Battery - no device"
                : TrimTip($"UMD Battery - {error}");
        }

        if (_widget.Visible)
            _widget.UpdateReading(reading, error);
    }

    private static string TrimTip(string text)
    {
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
        _bridge.Dispose();
        _trayIcon.Visible = false;
        _trayIcon.Dispose();
        _currentIcon?.Dispose();
        _appIcon.Dispose();
        _reader.Dispose();
        _widget.Dispose();
        base.ExitThreadCore();
    }
}
