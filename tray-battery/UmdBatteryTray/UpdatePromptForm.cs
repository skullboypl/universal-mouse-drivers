namespace UmdBatteryTray;

/// <summary>
/// Small modal: check for updates → show result → optional Yes/No to download & apply.
/// </summary>
internal sealed class UpdatePromptForm : Form
{
    private readonly AppSettings _settings;
    private readonly Label _status;
    private readonly Button _yes;
    private readonly Button _no;
    private readonly Button _close;
    private readonly ProgressBar _progress;
    private UpdateManifestInfo? _pending;
    private bool _busy;

    public UpdatePromptForm(AppSettings settings)
    {
        _settings = settings;
        var lang = settings.UiLanguage;

        Text = UiText.T(lang, "update.title");
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ShowInTaskbar = true;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(420, 168);
        Font = new Font("Segoe UI", 9f);

        _status = new Label
        {
            AutoSize = false,
            Location = new Point(16, 16),
            Size = new Size(388, 72),
            Text = UiText.T(lang, "update.checking"),
        };

        _progress = new ProgressBar
        {
            Location = new Point(16, 92),
            Size = new Size(388, 16),
            Style = ProgressBarStyle.Marquee,
            MarqueeAnimationSpeed = 30,
            Visible = true,
        };

        _yes = new Button
        {
            Text = UiText.T(lang, "update.yes"),
            Location = new Point(140, 122),
            Size = new Size(120, 28),
            Visible = false,
            DialogResult = DialogResult.None,
        };
        _yes.Click += async (_, _) => await ApplyPendingAsync();

        _no = new Button
        {
            Text = UiText.T(lang, "update.no"),
            Location = new Point(272, 122),
            Size = new Size(120, 28),
            Visible = false,
        };
        _no.Click += (_, _) => Close();

        _close = new Button
        {
            Text = UiText.T(lang, "update.close"),
            Location = new Point(272, 122),
            Size = new Size(120, 28),
            Visible = false,
        };
        _close.Click += (_, _) => Close();

        Controls.Add(_status);
        Controls.Add(_progress);
        Controls.Add(_yes);
        Controls.Add(_no);
        Controls.Add(_close);

        Shown += async (_, _) => await RunCheckAsync();
    }

    private void SetBusy(bool busy)
    {
        _busy = busy;
        UseWaitCursor = busy;
        _progress.Visible = busy;
        _yes.Enabled = !busy;
        _no.Enabled = !busy;
        _close.Enabled = !busy;
    }

    private async Task RunCheckAsync()
    {
        if (_busy) return;
        SetBusy(true);
        _status.Text = UiText.T(_settings.UiLanguage, "update.checking");
        _yes.Visible = false;
        _no.Visible = false;
        _close.Visible = false;

        try
        {
            var outcome = await new UpdateService(_settings).FetchLatestAsync();
            if (!outcome.Success)
            {
                _status.Text = string.Format(
                    UiText.T(_settings.UiLanguage, "update.error"),
                    outcome.Error ?? "?");
                _close.Visible = true;
                return;
            }

            if (!outcome.UpdateAvailable || outcome.Manifest is null)
            {
                _status.Text = string.Format(
                    UiText.T(_settings.UiLanguage, "update.upToDate"),
                    UpdateService.CurrentVersion);
                _close.Visible = true;
                return;
            }

            _pending = outcome.Manifest;
            _status.Text = string.Format(
                UiText.T(_settings.UiLanguage, "update.available"),
                UpdateService.CurrentVersion,
                outcome.Manifest.Version);
            _yes.Visible = true;
            _no.Visible = true;
        }
        catch (Exception ex)
        {
            _status.Text = string.Format(
                UiText.T(_settings.UiLanguage, "update.error"),
                ex.Message);
            _close.Visible = true;
        }
        finally
        {
            SetBusy(false);
            _progress.Visible = false;
        }
    }

    private async Task ApplyPendingAsync()
    {
        if (_pending is null || _busy) return;
        SetBusy(true);
        _progress.Visible = true;
        _status.Text = string.Format(
            UiText.T(_settings.UiLanguage, "update.downloading"),
            _pending.Version);
        _yes.Visible = false;
        _no.Visible = false;

        try
        {
            await new UpdateService(_settings).DownloadAndApplyAsync(_pending);
            // Process exits via Application.Exit inside Apply.
        }
        catch (Exception ex)
        {
            _status.Text = string.Format(
                UiText.T(_settings.UiLanguage, "update.downloadFailed"),
                ex.Message);
            _close.Visible = true;
            SetBusy(false);
            _progress.Visible = false;
        }
    }
}
