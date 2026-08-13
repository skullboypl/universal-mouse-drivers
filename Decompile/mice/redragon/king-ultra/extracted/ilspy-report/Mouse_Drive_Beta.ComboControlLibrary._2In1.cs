using System;
using System.ComponentModel;
using System.Drawing;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using CustomControlLibrary;
using DriverLib;
using FileManager;
using Mouse_Drive_Beta.FileManager;
using Mouse_Drive_Beta.Properties;

namespace Mouse_Drive_Beta.ComboControlLibrary;

public class _2In1 : UserControl
{
	public delegate void ValueChangeEventHandler(object sender, FlashDataMap e);

	private bool UpdateUIFlag;

	private int[] SensorUI;

	public FlashDataMap gFlashDataMap;

	private DriveConfig.DeviceParam gDeviceParam = new DriveConfig.DeviceParam();

	private IContainer components;

	private Panel panel_ReportRate;

	private CustomRadioButton customRadioButton_Report1000Hz;

	private CustomRadioButton customRadioButton_Report500Hz;

	private CustomRadioButton customRadioButton_Report250Hz;

	private CustomRadioButton customRadioButton_Report125Hz;

	private Label label_Report;

	private Label label_DPIBrightnessValue;

	public CustomTrackBar customTrackBar_DPIBrightness;

	private Label label_DPISpeedValue;

	public CustomTrackBar customTrackBar_DPISpeed;

	private Label label_DPIBrightness;

	private Label label_DPISpeed;

	private CustomComboBox customComboBox_DPIEffect;

	private Label label_DPIEffect;

	private PictureBox pictureBox1;

	private PictureBox pictureBox2;

	public Image CheckImage
	{
		get
		{
			return customRadioButton_Report125Hz.CheckImage;
		}
		set
		{
			customRadioButton_Report125Hz.CheckImage = value;
			customRadioButton_Report250Hz.CheckImage = value;
			customRadioButton_Report500Hz.CheckImage = value;
			customRadioButton_Report1000Hz.CheckImage = value;
			Invalidate();
		}
	}

	public Image UncheckImage
	{
		get
		{
			return customRadioButton_Report125Hz.UncheckImage;
		}
		set
		{
			customRadioButton_Report125Hz.UncheckImage = value;
			customRadioButton_Report250Hz.UncheckImage = value;
			customRadioButton_Report500Hz.UncheckImage = value;
			customRadioButton_Report1000Hz.UncheckImage = value;
			Invalidate();
		}
	}

	public event ValueChangeEventHandler ValueChange;

	public _2In1()
	{
		InitializeComponent();
	}

	public void UpdateReportRateUI(byte value)
	{
		int num = SensorUI[1];
		foreach (Control control in panel_ReportRate.Controls)
		{
			if (control is CustomRadioButton)
			{
				CustomRadioButton customRadioButton = (CustomRadioButton)control;
				if (num < 0)
				{
					customRadioButton.Enabled = false;
				}
				if (value == Convert.ToByte(customRadioButton.Tag))
				{
					customRadioButton.Checked = true;
				}
			}
		}
	}

	public void UpdateDPIEffect(FlashDataMap flashDataMap)
	{
		UpdateUIFlag = true;
		if (FormMain.gFlashDataMap.dpiLed.enable > 0)
		{
			customComboBox_DPIEffect.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_DPIEffect, FormMain.gFlashDataMap.dpiLed.mode);
		}
		else
		{
			customComboBox_DPIEffect.SelectIndex = 0;
		}
		label_DPISpeedValue.Text = FormMain.gFlashDataMap.dpiLed.breathSpeed.ToString();
		customTrackBar_DPISpeed.Value = FormMain.gFlashDataMap.dpiLed.breathSpeed;
		int value = ValueConvert.DPIBrightnessToIndex(FormMain.gFlashDataMap.dpiLed.brightness);
		label_DPIBrightnessValue.Text = value.ToString();
		customTrackBar_DPIBrightness.Value = value;
		UpdateUIFlag = false;
	}

	public void SetReportRateHz(string Hz)
	{
		foreach (Control control in panel_ReportRate.Controls)
		{
			if (control is CustomRadioButton)
			{
				CustomRadioButton obj = (CustomRadioButton)control;
				obj.TextString = int.Parse(Regex.Replace(obj.TextString, "[^0-9]+", "")) + Hz;
			}
		}
	}

	public void UpdateUI(DriveConfig.DeviceParam deviceParam, FlashDataMap flashDataMap, byte type)
	{
		UpdateUIFlag = true;
		gDeviceParam = deviceParam;
		string[] array = deviceParam.SensorUI.Split(',');
		SensorUI = new int[array.Length];
		for (int i = 0; i < array.Length; i++)
		{
			SensorUI[i] = Convert.ToInt32(array[i]);
		}
		UpdateReportRateUI(FormMain.gFlashDataMap.mouseConfig.reportRate);
		if (type > 1 && (FormMain.gFlashDataMap.mouseConfig.reportRate == 16 || FormMain.gFlashDataMap.mouseConfig.reportRate == 32))
		{
			customRadioButton_Report1000Hz.Checked = true;
		}
		if (SensorUI[2] == 0)
		{
			label_DPIEffect.Visible = false;
			customComboBox_DPIEffect.Visible = false;
			label_DPISpeedValue.Visible = false;
			customTrackBar_DPISpeed.Visible = false;
			label_DPIBrightnessValue.Visible = false;
			customTrackBar_DPIBrightness.Visible = false;
			pictureBox2.Visible = false;
			label_DPISpeed.Visible = false;
			label_DPIBrightness.Visible = false;
			panel_ReportRate.Location = new Point(3, 80);
		}
		else
		{
			customComboBox_DPIEffect.SelectIndex = SensorUI[3];
			label_DPISpeedValue.Text = SensorUI[4].ToString();
			customTrackBar_DPISpeed.Value = SensorUI[4];
			int value = ValueConvert.DPIBrightnessToIndex(SensorUI[5]);
			label_DPIBrightnessValue.Text = value.ToString();
			customTrackBar_DPIBrightness.Value = value;
		}
		UpdateDPIEffect(FormMain.gFlashDataMap);
		UpdateUIFlag = false;
	}

	public void UpdateUI(LanguageFile file)
	{
		file.ForeachSetControl(this);
	}

	public void UpdateUI(DriveConfig.DeviceParam deviceParam)
	{
		UpdateUIFlag = true;
		gDeviceParam = deviceParam;
		string[] array = deviceParam.SensorUI.Split(',');
		SensorUI = new int[array.Length];
		for (int i = 0; i < array.Length; i++)
		{
			SensorUI[i] = Convert.ToInt32(array[i]);
		}
		UpdateReportRateUI((byte)SensorUI[1]);
		if (SensorUI[2] == 0)
		{
			label_DPIEffect.Visible = false;
			customComboBox_DPIEffect.Visible = false;
			label_DPISpeedValue.Visible = false;
			customTrackBar_DPISpeed.Visible = false;
			label_DPIBrightnessValue.Visible = false;
			customTrackBar_DPIBrightness.Visible = false;
			pictureBox2.Visible = false;
			label_DPISpeed.Visible = false;
			label_DPIBrightness.Visible = false;
			panel_ReportRate.Location = new Point(3, 80);
		}
		else
		{
			customComboBox_DPIEffect.SelectIndex = SensorUI[3];
			label_DPISpeedValue.Text = SensorUI[4].ToString();
			customTrackBar_DPISpeed.Value = SensorUI[4];
			int value = ValueConvert.DPIBrightnessToIndex(SensorUI[5]);
			label_DPIBrightnessValue.Text = value.ToString();
			customTrackBar_DPIBrightness.Value = value;
			CustomTrackBar customTrackBar = customTrackBar_DPIBrightness;
			Color sliderColor = (customTrackBar_DPISpeed.SliderColor = FormMain.driveParam.SliderClr);
			customTrackBar.SliderColor = sliderColor;
		}
		UpdateUIFlag = false;
	}

	public void UpdateFlash(FlashDataMap flashDataMap)
	{
	}

	private void customRadioButton_ReportRateClick(object sender, EventArgs e)
	{
		CustomRadioButton customRadioButton = (CustomRadioButton)sender;
		FormMain.gFlashDataMap.mouseConfig.reportRate = Convert.ToByte(customRadioButton.Tag);
		UpdateValue();
	}

	private void UpdateDPIEffectUI(bool[] bools)
	{
		string[] array = gDeviceParam.SensorUI.Split(',');
		SensorUI = new int[array.Length];
		for (int i = 0; i < array.Length; i++)
		{
			SensorUI[i] = Convert.ToInt32(array[i]);
		}
		if (SensorUI[2] == 0)
		{
			customTrackBar_DPIBrightness.Enable = false;
			customTrackBar_DPISpeed.Enable = false;
			label_DPIBrightnessValue.Visible = false;
			label_DPISpeedValue.Visible = false;
			customComboBox_DPIEffect.Enabled = false;
			label_DPIEffect.ForeColor = Color.Black;
			label_DPISpeed.ForeColor = Color.Black;
			label_DPIBrightness.ForeColor = Color.Black;
		}
		else
		{
			customTrackBar_DPIBrightness.Enable = bools[0];
			customTrackBar_DPISpeed.Enable = bools[1];
			label_DPIBrightnessValue.Visible = bools[0];
			label_DPISpeedValue.Visible = bools[1];
			CustomTrackBar customTrackBar = customTrackBar_DPIBrightness;
			Color sliderColor = (customTrackBar_DPISpeed.SliderColor = FormMain.driveParam.SliderClr);
			customTrackBar.SliderColor = sliderColor;
		}
	}

	private void customComboBox_DPIEffect_OnSelectedIndexChanged(object sender, EventArgs e)
	{
		int selectIndex = customComboBox_DPIEffect.SelectIndex;
		UpdateDPIEffectUI(ValueConvert.SetDPIEffect(selectIndex));
		if (!UpdateUIFlag)
		{
			if (selectIndex == 0)
			{
				FormMain.gFlashDataMap.dpiLed.enable = 0;
			}
			else
			{
				FormMain.gFlashDataMap.dpiLed.enable = 1;
				FormMain.gFlashDataMap.dpiLed.mode = (byte)selectIndex;
			}
			UpdateValue();
		}
	}

	private void customTrackBar_DPISpeed_ValueChanged(object sender, CustomEventArgs e)
	{
		FormMain.gFlashDataMap.dpiLed.breathSpeed = (byte)customTrackBar_DPISpeed.Value;
		label_DPISpeedValue.Text = FormMain.gFlashDataMap.dpiLed.breathSpeed.ToString();
	}

	private void customTrackBar_DPISpeed_SetValue(object sender, CustomEventArgs e)
	{
		UpdateValue();
	}

	private void customTrackBar_DPIBrightness_ValueChanged(object sender, CustomEventArgs e)
	{
		label_DPIBrightnessValue.Text = customTrackBar_DPIBrightness.Value.ToString();
		FormMain.gFlashDataMap.dpiLed.brightness = (byte)ValueConvert.DPIIndexToBrightness(customTrackBar_DPIBrightness.Value);
	}

	private void customTrackBar_DPIBrightness_SetValue(object sender, CustomEventArgs e)
	{
		UpdateValue();
	}

	private void UpdateValue()
	{
		if (!UpdateUIFlag)
		{
			this.ValueChange?.Invoke(this, FormMain.gFlashDataMap);
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.panel_ReportRate = new System.Windows.Forms.Panel();
		this.pictureBox1 = new System.Windows.Forms.PictureBox();
		this.customRadioButton_Report1000Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report500Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report250Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report125Hz = new CustomControlLibrary.CustomRadioButton();
		this.label_Report = new System.Windows.Forms.Label();
		this.label_DPIBrightnessValue = new System.Windows.Forms.Label();
		this.label_DPISpeedValue = new System.Windows.Forms.Label();
		this.label_DPIBrightness = new System.Windows.Forms.Label();
		this.label_DPISpeed = new System.Windows.Forms.Label();
		this.label_DPIEffect = new System.Windows.Forms.Label();
		this.customTrackBar_DPIBrightness = new CustomControlLibrary.CustomTrackBar();
		this.customTrackBar_DPISpeed = new CustomControlLibrary.CustomTrackBar();
		this.customComboBox_DPIEffect = new CustomControlLibrary.CustomComboBox();
		this.pictureBox2 = new System.Windows.Forms.PictureBox();
		this.panel_ReportRate.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pictureBox2).BeginInit();
		base.SuspendLayout();
		this.panel_ReportRate.Controls.Add(this.pictureBox1);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report1000Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report500Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report250Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report125Hz);
		this.panel_ReportRate.Controls.Add(this.label_Report);
		this.panel_ReportRate.Location = new System.Drawing.Point(3, 40);
		this.panel_ReportRate.Name = "panel_ReportRate";
		this.panel_ReportRate.Size = new System.Drawing.Size(823, 94);
		this.panel_ReportRate.TabIndex = 91;
		this.pictureBox1.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox1.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox1.Location = new System.Drawing.Point(26, 16);
		this.pictureBox1.Name = "pictureBox1";
		this.pictureBox1.Size = new System.Drawing.Size(33, 20);
		this.pictureBox1.TabIndex = 5;
		this.pictureBox1.TabStop = false;
		this.customRadioButton_Report1000Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report1000Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report1000Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report1000Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report1000Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report1000Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report1000Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report1000Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report1000Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report1000Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report1000Hz.Location = new System.Drawing.Point(429, 45);
		this.customRadioButton_Report1000Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report1000Hz.Name = "customRadioButton_Report1000Hz";
		this.customRadioButton_Report1000Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report1000Hz.TabIndex = 4;
		this.customRadioButton_Report1000Hz.TabStop = true;
		this.customRadioButton_Report1000Hz.Tag = "1";
		this.customRadioButton_Report1000Hz.TextString = "1000Hz";
		this.customRadioButton_Report1000Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report1000Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report1000Hz.Click += new System.EventHandler(customRadioButton_ReportRateClick);
		this.customRadioButton_Report500Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report500Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report500Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report500Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report500Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report500Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report500Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report500Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report500Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report500Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report500Hz.Location = new System.Drawing.Point(309, 45);
		this.customRadioButton_Report500Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report500Hz.Name = "customRadioButton_Report500Hz";
		this.customRadioButton_Report500Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report500Hz.TabIndex = 3;
		this.customRadioButton_Report500Hz.TabStop = true;
		this.customRadioButton_Report500Hz.Tag = "2";
		this.customRadioButton_Report500Hz.TextString = "500Hz";
		this.customRadioButton_Report500Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report500Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report500Hz.Click += new System.EventHandler(customRadioButton_ReportRateClick);
		this.customRadioButton_Report250Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report250Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report250Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report250Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report250Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report250Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report250Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report250Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report250Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report250Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report250Hz.Location = new System.Drawing.Point(189, 45);
		this.customRadioButton_Report250Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report250Hz.Name = "customRadioButton_Report250Hz";
		this.customRadioButton_Report250Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report250Hz.TabIndex = 2;
		this.customRadioButton_Report250Hz.TabStop = true;
		this.customRadioButton_Report250Hz.Tag = "4";
		this.customRadioButton_Report250Hz.TextString = "250Hz";
		this.customRadioButton_Report250Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report250Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report250Hz.Click += new System.EventHandler(customRadioButton_ReportRateClick);
		this.customRadioButton_Report125Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report125Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report125Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report125Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report125Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report125Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report125Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report125Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report125Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report125Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report125Hz.Location = new System.Drawing.Point(69, 45);
		this.customRadioButton_Report125Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report125Hz.Name = "customRadioButton_Report125Hz";
		this.customRadioButton_Report125Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report125Hz.TabIndex = 1;
		this.customRadioButton_Report125Hz.TabStop = true;
		this.customRadioButton_Report125Hz.Tag = "8";
		this.customRadioButton_Report125Hz.TextString = "125Hz";
		this.customRadioButton_Report125Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report125Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report125Hz.Click += new System.EventHandler(customRadioButton_ReportRateClick);
		this.label_Report.AutoSize = true;
		this.label_Report.ForeColor = System.Drawing.Color.White;
		this.label_Report.Location = new System.Drawing.Point(65, 16);
		this.label_Report.Name = "label_Report";
		this.label_Report.Size = new System.Drawing.Size(64, 24);
		this.label_Report.TabIndex = 0;
		this.label_Report.Text = "回报率";
		this.label_DPIBrightnessValue.AutoSize = true;
		this.label_DPIBrightnessValue.ForeColor = System.Drawing.Color.White;
		this.label_DPIBrightnessValue.Location = new System.Drawing.Point(502, 233);
		this.label_DPIBrightnessValue.Name = "label_DPIBrightnessValue";
		this.label_DPIBrightnessValue.Size = new System.Drawing.Size(21, 24);
		this.label_DPIBrightnessValue.TabIndex = 90;
		this.label_DPIBrightnessValue.Text = "7";
		this.label_DPISpeedValue.AutoSize = true;
		this.label_DPISpeedValue.ForeColor = System.Drawing.Color.White;
		this.label_DPISpeedValue.Location = new System.Drawing.Point(502, 198);
		this.label_DPISpeedValue.Name = "label_DPISpeedValue";
		this.label_DPISpeedValue.Size = new System.Drawing.Size(21, 24);
		this.label_DPISpeedValue.TabIndex = 88;
		this.label_DPISpeedValue.Text = "3";
		this.label_DPIBrightness.AutoSize = true;
		this.label_DPIBrightness.ForeColor = System.Drawing.Color.White;
		this.label_DPIBrightness.Location = new System.Drawing.Point(247, 233);
		this.label_DPIBrightness.Name = "label_DPIBrightness";
		this.label_DPIBrightness.Size = new System.Drawing.Size(46, 24);
		this.label_DPIBrightness.TabIndex = 86;
		this.label_DPIBrightness.Text = "亮度";
		this.label_DPISpeed.AutoSize = true;
		this.label_DPISpeed.ForeColor = System.Drawing.Color.White;
		this.label_DPISpeed.Location = new System.Drawing.Point(247, 198);
		this.label_DPISpeed.Name = "label_DPISpeed";
		this.label_DPISpeed.Size = new System.Drawing.Size(46, 24);
		this.label_DPISpeed.TabIndex = 85;
		this.label_DPISpeed.Text = "速度";
		this.label_DPIEffect.AutoSize = true;
		this.label_DPIEffect.ForeColor = System.Drawing.Color.White;
		this.label_DPIEffect.Location = new System.Drawing.Point(68, 161);
		this.label_DPIEffect.Name = "label_DPIEffect";
		this.label_DPIEffect.Size = new System.Drawing.Size(76, 24);
		this.label_DPIEffect.TabIndex = 83;
		this.label_DPIEffect.Text = "DPI灯效";
		this.customTrackBar_DPIBrightness.BarColor = System.Drawing.Color.FromArgb(255, 255, 255);
		this.customTrackBar_DPIBrightness.BarSize = 2;
		this.customTrackBar_DPIBrightness.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customTrackBar_DPIBrightness.Enable = true;
		this.customTrackBar_DPIBrightness.IsRound = true;
		this.customTrackBar_DPIBrightness.Location = new System.Drawing.Point(332, 233);
		this.customTrackBar_DPIBrightness.Maximum = 10;
		this.customTrackBar_DPIBrightness.Minimum = 1;
		this.customTrackBar_DPIBrightness.Name = "customTrackBar_DPIBrightness";
		this.customTrackBar_DPIBrightness.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.customTrackBar_DPIBrightness.Size = new System.Drawing.Size(164, 23);
		this.customTrackBar_DPIBrightness.SizeSlidSize = new System.Drawing.Size(6, 18);
		this.customTrackBar_DPIBrightness.SliderColor = System.Drawing.Color.FromArgb(255, 106, 0);
		this.customTrackBar_DPIBrightness.Step = 1;
		this.customTrackBar_DPIBrightness.TabIndex = 89;
		this.customTrackBar_DPIBrightness.Value = 7;
		this.customTrackBar_DPIBrightness.ValueChanged += new CustomControlLibrary.CustomTrackBar.ValueChangedEventHandler(customTrackBar_DPIBrightness_ValueChanged);
		this.customTrackBar_DPIBrightness.SetValue += new CustomControlLibrary.CustomTrackBar.SetValueEventHandler(customTrackBar_DPIBrightness_SetValue);
		this.customTrackBar_DPISpeed.BarColor = System.Drawing.Color.FromArgb(255, 255, 255);
		this.customTrackBar_DPISpeed.BarSize = 2;
		this.customTrackBar_DPISpeed.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customTrackBar_DPISpeed.Enable = true;
		this.customTrackBar_DPISpeed.IsRound = true;
		this.customTrackBar_DPISpeed.Location = new System.Drawing.Point(332, 198);
		this.customTrackBar_DPISpeed.Maximum = 5;
		this.customTrackBar_DPISpeed.Minimum = 1;
		this.customTrackBar_DPISpeed.Name = "customTrackBar_DPISpeed";
		this.customTrackBar_DPISpeed.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.customTrackBar_DPISpeed.Size = new System.Drawing.Size(164, 23);
		this.customTrackBar_DPISpeed.SizeSlidSize = new System.Drawing.Size(6, 18);
		this.customTrackBar_DPISpeed.SliderColor = System.Drawing.Color.FromArgb(255, 106, 0);
		this.customTrackBar_DPISpeed.Step = 1;
		this.customTrackBar_DPISpeed.TabIndex = 87;
		this.customTrackBar_DPISpeed.Value = 3;
		this.customTrackBar_DPISpeed.ValueChanged += new CustomControlLibrary.CustomTrackBar.ValueChangedEventHandler(customTrackBar_DPISpeed_ValueChanged);
		this.customTrackBar_DPISpeed.SetValue += new CustomControlLibrary.CustomTrackBar.SetValueEventHandler(customTrackBar_DPISpeed_SetValue);
		this.customComboBox_DPIEffect.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_DPIEffect.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_DPIEffect.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_DPIEffect.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_DPIEffect.ForeColor = System.Drawing.Color.White;
		this.customComboBox_DPIEffect.Item.AddRange(new object[3] { "关闭", "常亮", "呼吸" });
		this.customComboBox_DPIEffect.Location = new System.Drawing.Point(74, 198);
		this.customComboBox_DPIEffect.Name = "customComboBox_DPIEffect";
		this.customComboBox_DPIEffect.SelectIndex = -1;
		this.customComboBox_DPIEffect.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_DPIEffect.Size = new System.Drawing.Size(126, 26);
		this.customComboBox_DPIEffect.TabIndex = 84;
		this.customComboBox_DPIEffect.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_DPIEffect.OnSelectedIndexChanged += new System.EventHandler(customComboBox_DPIEffect_OnSelectedIndexChanged);
		this.pictureBox2.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox2.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox2.Location = new System.Drawing.Point(29, 161);
		this.pictureBox2.Name = "pictureBox2";
		this.pictureBox2.Size = new System.Drawing.Size(33, 20);
		this.pictureBox2.TabIndex = 6;
		this.pictureBox2.TabStop = false;
		base.AutoScaleDimensions = new System.Drawing.SizeF(10f, 23f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.Color.Transparent;
		base.Controls.Add(this.pictureBox2);
		base.Controls.Add(this.panel_ReportRate);
		base.Controls.Add(this.label_DPIBrightnessValue);
		base.Controls.Add(this.customTrackBar_DPIBrightness);
		base.Controls.Add(this.label_DPISpeedValue);
		base.Controls.Add(this.customTrackBar_DPISpeed);
		base.Controls.Add(this.label_DPIBrightness);
		base.Controls.Add(this.label_DPISpeed);
		base.Controls.Add(this.customComboBox_DPIEffect);
		base.Controls.Add(this.label_DPIEffect);
		this.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		base.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		base.Name = "_2In1";
		base.Size = new System.Drawing.Size(866, 368);
		this.panel_ReportRate.ResumeLayout(false);
		this.panel_ReportRate.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pictureBox2).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
