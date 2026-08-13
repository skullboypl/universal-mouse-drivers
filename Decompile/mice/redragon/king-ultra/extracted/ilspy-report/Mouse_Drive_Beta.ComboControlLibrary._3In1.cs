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

public class _3In1 : UserControl
{
	public delegate void ValueChangeEventHandler(object sender, FlashDataMap e);

	private bool UpdateUIFlag;

	private bool USBConnect;

	private int[] SensorUI;

	public FlashDataMap gFlashDataMap;

	private DriveConfig.DeviceParam gDeviceParam = new DriveConfig.DeviceParam();

	private string corded = "Corded";

	private IContainer components;

	private Panel panel_ReportRate;

	private CustomRadioButton customRadioButton_Report4000Hz;

	private CustomRadioButton customRadioButton_Report2000Hz;

	private CustomRadioButton customRadioButton_Report1000Hz;

	private CustomRadioButton customRadioButton_Report500Hz;

	private CustomRadioButton customRadioButton_Report250Hz;

	private CustomRadioButton customRadioButton_Report125Hz;

	private Label label_Report;

	private PictureBox pictureBox1;

	private CustomRadioButton customRadioButton_Report8000Hz;

	private Panel panel_Sensor;

	private PictureBox pictureBox2;

	private CustomCheckBox customCheckBox_FullPerformance;

	private CustomComboBox customComboBox_LOD;

	private CustomComboBox customComboBox_ModeSelect;

	private CustomComboBox customComboBox_FullPerformance;

	private CustomCheckBox customCheckBox_MotionSync;

	private CustomCheckBox customCheckBox_FixLine;

	private CustomCheckBox customCheckBox_Ripple;

	private Label label_MotionSync;

	private Label label_FixLine;

	private Label label_Ripple;

	private Label label_LOD;

	private Label label_ModeSelect;

	private Label label_FullPerformance;

	private Label label_SensorSetting;

	private Panel panel_DPIEffect;

	private PictureBox pictureBox3;

	private Label label_DPIBrightnessValue;

	public CustomTrackBar customTrackBar_DPIBrightness;

	private Label label_DPISpeedValue;

	public CustomTrackBar customTrackBar_DPISpeed;

	private Label label_DPIBrightness;

	private Label label_DPISpeed;

	private CustomComboBox customComboBox_DPIEffect;

	private Label label_DPIEffect;

	private ToolTip toolTip;

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
			customRadioButton_Report2000Hz.CheckImage = value;
			customRadioButton_Report4000Hz.CheckImage = value;
			customRadioButton_Report8000Hz.CheckImage = value;
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
			customRadioButton_Report2000Hz.UncheckImage = value;
			customRadioButton_Report4000Hz.UncheckImage = value;
			customRadioButton_Report8000Hz.UncheckImage = value;
			Invalidate();
		}
	}

	public Image FullCheckImage
	{
		get
		{
			return customCheckBox_FullPerformance.CheckImage;
		}
		set
		{
			customCheckBox_FullPerformance.CheckImage = value;
			Invalidate();
		}
	}

	public Image FullUncheckImage
	{
		get
		{
			return customCheckBox_FullPerformance.UncheckImage;
		}
		set
		{
			customCheckBox_FullPerformance.UncheckImage = value;
			Invalidate();
		}
	}

	public Image SensorCheckImage
	{
		get
		{
			return customCheckBox_FixLine.CheckImage;
		}
		set
		{
			customCheckBox_FixLine.CheckImage = value;
			customCheckBox_MotionSync.CheckImage = value;
			customCheckBox_Ripple.CheckImage = value;
			Invalidate();
		}
	}

	public Image SensorUncheckImage
	{
		get
		{
			return customCheckBox_FixLine.UncheckImage;
		}
		set
		{
			customCheckBox_FixLine.UncheckImage = value;
			customCheckBox_MotionSync.UncheckImage = value;
			customCheckBox_Ripple.UncheckImage = value;
			Invalidate();
		}
	}

	public event ValueChangeEventHandler ValueChange;

	public _3In1()
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
		UpdateModeSelect(value >= 16 || USBConnect);
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
			customComboBox_DPIEffect.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_DPIEffect, 0);
		}
		label_DPISpeedValue.Text = FormMain.gFlashDataMap.dpiLed.breathSpeed.ToString();
		customTrackBar_DPISpeed.Value = FormMain.gFlashDataMap.dpiLed.breathSpeed;
		CustomTrackBar customTrackBar = customTrackBar_DPIBrightness;
		Color sliderColor = (customTrackBar_DPISpeed.SliderColor = FormMain.driveParam.SliderClr);
		customTrackBar.SliderColor = sliderColor;
		int value = ValueConvert.DPIBrightnessToIndex(FormMain.gFlashDataMap.dpiLed.brightness);
		label_DPIBrightnessValue.Text = value.ToString();
		customTrackBar_DPIBrightness.Value = value;
		UpdateUIFlag = false;
	}

	public void UpdateModeSelect(bool support)
	{
		UpdateUIFlag = true;
		GetCordedString();
		if (support)
		{
			if (customComboBox_ModeSelect.Item.Count == 2)
			{
				customComboBox_ModeSelect.Item.Add(corded);
				for (int i = 0; i < LanguageFile.ComboBoxStructs.Count; i++)
				{
					if (customComboBox_ModeSelect.Name == LanguageFile.ComboBoxStructs[i].Name)
					{
						LanguageFile.ComboBoxStructs[i].Items.Add(corded);
						LanguageFile.ComboBoxStructs[i].Values.Add(10);
					}
				}
			}
			customComboBox_ModeSelect.Enabled = false;
			customComboBox_ModeSelect.SelectIndex = customComboBox_ModeSelect.Item.Count - 1;
		}
		else
		{
			if (customComboBox_ModeSelect.Item.Count == 3)
			{
				customComboBox_ModeSelect.Item.RemoveAt(2);
				for (int j = 0; j < LanguageFile.ComboBoxStructs.Count; j++)
				{
					if (customComboBox_ModeSelect.Name == LanguageFile.ComboBoxStructs[j].Name)
					{
						LanguageFile.ComboBoxStructs[j].Items.RemoveAt(2);
						LanguageFile.ComboBoxStructs[j].Values.RemoveAt(2);
					}
				}
			}
			customComboBox_ModeSelect.Enabled = SensorDPIFile.SupportSensorModeSel(FormMain.deviceParam.Sensor);
			customComboBox_ModeSelect.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_ModeSelect, FormMain.gFlashDataMap.mouseConfig.sensorPowerSavingModeEnable);
		}
		if (FormMain.deviceParam.Sensor != "3950" && customComboBox_LOD.Item.Count == 3)
		{
			customComboBox_LOD.Item.RemoveAt(0);
			for (int k = 0; k < LanguageFile.ComboBoxStructs.Count; k++)
			{
				if (customComboBox_LOD.Name == LanguageFile.ComboBoxStructs[k].Name)
				{
					LanguageFile.ComboBoxStructs[k].Items.RemoveAt(0);
					LanguageFile.ComboBoxStructs[k].Values.RemoveAt(0);
					break;
				}
			}
		}
		customComboBox_LOD.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_LOD, FormMain.gFlashDataMap.mouseConfig.silenceHeight);
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
		bool flag = false;
		bool flag2 = false;
		bool flag3 = false;
		bool flag4 = false;
		int num = 1000;
		DeviceType deviceType = (DeviceType)type;
		flag4 = !deviceType.ToString().Contains("Wireless");
		if (deviceType.ToString().Contains("2K"))
		{
			flag = true;
			num = 2000;
		}
		if (deviceType.ToString().Contains("4K"))
		{
			flag2 = true;
			num = 4000;
		}
		if (deviceType.ToString().Contains("8K"))
		{
			flag3 = true;
			num = 8000;
		}
		USBConnect = flag4;
		customRadioButton_Report2000Hz.Visible = (flag || flag2 || flag3) && SensorUI[0] > 4;
		customRadioButton_Report4000Hz.Visible = (flag2 || flag3) && SensorUI[0] > 5;
		customRadioButton_Report8000Hz.Visible = flag3 && SensorUI[0] > 6;
		UpdateReportRateUI(FormMain.gFlashDataMap.mouseConfig.reportRate);
		int num2 = 1000;
		num2 = ((FormMain.gFlashDataMap.mouseConfig.reportRate < 16) ? (1000 / FormMain.gFlashDataMap.mouseConfig.reportRate) : (FormMain.gFlashDataMap.mouseConfig.reportRate / 16 * 2000));
		if (num < num2)
		{
			num2 = num;
		}
		if (num2 >= 2000)
		{
			UpdateReportRateUI((byte)(num2 / 2000 * 16));
		}
		else
		{
			UpdateReportRateUI((byte)(1000 / num2));
		}
		customCheckBox_FullPerformance.Checked = FormMain.gFlashDataMap.mouseConfig.sensorCustomSleepTimeEnable > 0;
		UpdateFullPerformance();
		customComboBox_FullPerformance.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_FullPerformance, FormMain.gFlashDataMap.mouseConfig.sensorSleepTime);
		byte b = (byte)ValueConvert.ComboxIndexToValue(customComboBox_FullPerformance);
		UpdateModeSelect(flag4 || FormMain.gFlashDataMap.mouseConfig.reportRate >= 16);
		if (deviceParam.Sensor != "3950" && customComboBox_LOD.Item.Count == 3)
		{
			customComboBox_LOD.Item.RemoveAt(0);
			for (int j = 0; j < LanguageFile.ComboBoxStructs.Count; j++)
			{
				if (customComboBox_LOD.Name == LanguageFile.ComboBoxStructs[j].Name)
				{
					LanguageFile.ComboBoxStructs[j].Items.RemoveAt(0);
					LanguageFile.ComboBoxStructs[j].Values.RemoveAt(0);
					break;
				}
			}
		}
		customComboBox_LOD.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_LOD, FormMain.gFlashDataMap.mouseConfig.silenceHeight);
		customCheckBox_Ripple.Checked = FormMain.gFlashDataMap.mouseConfig.rippleControlEnable > 0;
		customCheckBox_FixLine.Checked = FormMain.gFlashDataMap.mouseConfig.linearCorrectionEnable > 0;
		customCheckBox_MotionSync.Checked = FormMain.gFlashDataMap.mouseConfig.motionSyncEnable > 0;
		if (SensorUI[2] == 0)
		{
			panel_DPIEffect.Visible = false;
			panel_ReportRate.Location = new Point(panel_ReportRate.Left, 25);
			panel_Sensor.Location = new Point(panel_Sensor.Left, 160);
		}
		else
		{
			UpdateDPIEffect(FormMain.gFlashDataMap);
		}
		UpdateSensorUI(deviceParam.Sensor);
		UpdateUIFlag = false;
		if (b != FormMain.gFlashDataMap.mouseConfig.sensorSleepTime)
		{
			FormMain.gFlashDataMap.mouseConfig.sensorSleepTime = b;
			UpdateValue();
		}
	}

	public void UpdateSensorUI(string sensor)
	{
		if (customComboBox_ModeSelect.Enabled)
		{
			customComboBox_ModeSelect.Enabled = SensorDPIFile.SupportSensorModeSel(sensor);
		}
		customComboBox_LOD.Enabled = SensorDPIFile.SupportLODCal(sensor);
		customCheckBox_Ripple.Visible = SensorDPIFile.SupportRipple(sensor);
		label_Ripple.Visible = SensorDPIFile.SupportRipple(sensor);
		customCheckBox_FixLine.Visible = SensorDPIFile.SupportFixline(sensor);
		label_FixLine.Visible = SensorDPIFile.SupportFixline(sensor);
		customCheckBox_MotionSync.Visible = SensorDPIFile.SupportMotionSync(sensor);
		label_MotionSync.Visible = SensorDPIFile.SupportMotionSync(sensor);
		if (!SensorDPIFile.SupportMotionSync(sensor))
		{
			label_Ripple.Location = new Point(label_Ripple.Left, 45);
			customCheckBox_Ripple.Location = new Point(customCheckBox_Ripple.Left, 45);
			label_FixLine.Location = new Point(label_FixLine.Left, 85);
			customCheckBox_FixLine.Location = new Point(customCheckBox_FixLine.Left, 85);
		}
		foreach (Control control in panel_Sensor.Controls)
		{
			if (control is Label)
			{
				Label label = (Label)control;
				if (label.Name != "label_SensorSetting")
				{
					label.MouseEnter += Label_MouseEnter;
				}
			}
		}
	}

	private void Label_MouseEnter(object sender, EventArgs e)
	{
		Label label = sender as Label;
		string text = label.Name.Replace("label_", "");
		text += "Des";
		DialogEnum index = (DialogEnum)Enum.Parse(typeof(DialogEnum), text);
		toolTip.SetToolTip(label, LanguageFile.Dialogs[(int)index]);
	}

	private void GetCordedString()
	{
		if (customComboBox_ModeSelect.Item.Count != 3)
		{
			return;
		}
		for (int i = 0; i < LanguageFile.ComboBoxStructs.Count; i++)
		{
			if (customComboBox_ModeSelect.Name == LanguageFile.ComboBoxStructs[i].Name)
			{
				corded = LanguageFile.ComboBoxStructs[i].Items[2];
			}
		}
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
		customRadioButton_Report2000Hz.Visible = SensorUI[0] > 4;
		customRadioButton_Report4000Hz.Visible = SensorUI[0] > 5;
		customRadioButton_Report8000Hz.Visible = SensorUI[0] > 6;
		UpdateReportRateUI((byte)SensorUI[1]);
		if (SensorUI[2] == 0)
		{
			panel_DPIEffect.Visible = false;
			panel_ReportRate.Location = new Point(panel_ReportRate.Left, 25);
			panel_Sensor.Location = new Point(panel_Sensor.Left, 160);
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
		GetCordedString();
		customCheckBox_FullPerformance.Checked = SensorUI[8] > 0;
		UpdateFullPerformance();
		customComboBox_FullPerformance.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_FullPerformance, SensorUI[9]);
		customComboBox_ModeSelect.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_ModeSelect, SensorUI[6]);
		if (deviceParam.Sensor != "3950" && customComboBox_LOD.Item.Count == 3)
		{
			customComboBox_LOD.Item.RemoveAt(0);
			for (int j = 0; j < LanguageFile.ComboBoxStructs.Count; j++)
			{
				if (customComboBox_LOD.Name == LanguageFile.ComboBoxStructs[j].Name)
				{
					LanguageFile.ComboBoxStructs[j].Items.RemoveAt(0);
					LanguageFile.ComboBoxStructs[j].Values.RemoveAt(0);
					break;
				}
			}
		}
		customComboBox_LOD.SelectIndex = ValueConvert.ValueToComboxIndex(customComboBox_LOD, SensorUI[7]);
		customCheckBox_Ripple.Checked = SensorUI[10] > 0;
		customCheckBox_FixLine.Checked = SensorUI[11] > 0;
		customCheckBox_MotionSync.Checked = SensorUI[12] > 0;
		UpdateSensorUI(deviceParam.Sensor);
		UpdateUIFlag = false;
	}

	public void UpdateFlash(FlashDataMap flashDataMap)
	{
	}

	private void customRadioButton_ReportRate_Click(object sender, EventArgs e)
	{
		CustomRadioButton customRadioButton = (CustomRadioButton)sender;
		UpdateModeSelect((FormMain.gFlashDataMap.mouseConfig.reportRate = (byte)Convert.ToInt32(customRadioButton.Tag)) >= 16 || USBConnect);
		UpdateValue();
	}

	private void UpdateDPIEffectUI(bool[] bools)
	{
		customTrackBar_DPIBrightness.Enable = bools[0];
		customTrackBar_DPISpeed.Enable = bools[1];
		label_DPIBrightnessValue.Visible = bools[0];
		label_DPISpeedValue.Visible = bools[1];
	}

	public void AddLODItems(string str)
	{
		customComboBox_LOD.Item.Add(str);
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
		if (FormMain.gFlashDataMap.dpiLed.enable > 0 && FormMain.gFlashDataMap.dpiLed.mode == 2)
		{
			UpdateValue();
		}
	}

	private void customTrackBar_DPIBrightness_ValueChanged(object sender, CustomEventArgs e)
	{
		label_DPIBrightnessValue.Text = customTrackBar_DPIBrightness.Value.ToString();
		FormMain.gFlashDataMap.dpiLed.brightness = (byte)ValueConvert.DPIIndexToBrightness(customTrackBar_DPIBrightness.Value);
	}

	private void customTrackBar_DPIBrightness_SetValue(object sender, CustomEventArgs e)
	{
		if (FormMain.gFlashDataMap.dpiLed.enable > 0 && FormMain.gFlashDataMap.dpiLed.mode == 1)
		{
			UpdateValue();
		}
	}

	private void customComboBox_FullPerformance_OnSelectedIndexChanged(object sender, EventArgs e)
	{
		int num = ValueConvert.ComboxIndexToValue(customComboBox_FullPerformance);
		if (!UpdateUIFlag)
		{
			FormMain.gFlashDataMap.mouseConfig.sensorSleepTime = (byte)num;
			UpdateValue();
		}
	}

	private void customComboBox_ModeSelect_OnSelectedIndexChanged(object sender, EventArgs e)
	{
		int num = ValueConvert.ComboxIndexToValue(customComboBox_ModeSelect);
		if (!UpdateUIFlag && num != 10)
		{
			FormMain.gFlashDataMap.mouseConfig.sensorPowerSavingModeEnable = (byte)num;
			UpdateValue();
		}
	}

	private void customComboBox_LOD_OnSelectedIndexChanged(object sender, EventArgs e)
	{
		int num = ValueConvert.ComboxIndexToValue(customComboBox_LOD);
		if (!UpdateUIFlag && !FormMain.SetLanguage)
		{
			FormMain.gFlashDataMap.mouseConfig.silenceHeight = (byte)num;
			UpdateValue();
		}
	}

	private void UpdateValue()
	{
		if (!UpdateUIFlag && !FormMain.SetLanguage)
		{
			this.ValueChange?.Invoke(this, FormMain.gFlashDataMap);
		}
	}

	private void customCheckBox_Ripple_CheckChange(object sender, CustomEventArgs e)
	{
		FormMain.gFlashDataMap.mouseConfig.rippleControlEnable = (byte)(customCheckBox_Ripple.Checked ? 1u : 0u);
		UpdateValue();
	}

	private void customCheckBox_FixLine_CheckChange(object sender, CustomEventArgs e)
	{
		FormMain.gFlashDataMap.mouseConfig.linearCorrectionEnable = (byte)(customCheckBox_FixLine.Checked ? 1u : 0u);
		UpdateValue();
	}

	private void customCheckBox_MotionSync_CheckChange(object sender, CustomEventArgs e)
	{
		FormMain.gFlashDataMap.mouseConfig.motionSyncEnable = (byte)(customCheckBox_MotionSync.Checked ? 1u : 0u);
		UpdateValue();
	}

	private void customCheckBox_FullPerformance_CheckChange(object sender, CustomEventArgs e)
	{
		UpdateFullPerformance();
		FormMain.gFlashDataMap.mouseConfig.sensorCustomSleepTimeEnable = (byte)(customCheckBox_FullPerformance.Checked ? 1u : 0u);
		UpdateValue();
	}

	private void UpdateFullPerformance()
	{
		customComboBox_FullPerformance.Enabled = customCheckBox_FullPerformance.Checked;
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
		this.components = new System.ComponentModel.Container();
		this.panel_ReportRate = new System.Windows.Forms.Panel();
		this.customRadioButton_Report8000Hz = new CustomControlLibrary.CustomRadioButton();
		this.pictureBox1 = new System.Windows.Forms.PictureBox();
		this.customRadioButton_Report4000Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report2000Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report1000Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report500Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report250Hz = new CustomControlLibrary.CustomRadioButton();
		this.customRadioButton_Report125Hz = new CustomControlLibrary.CustomRadioButton();
		this.label_Report = new System.Windows.Forms.Label();
		this.panel_Sensor = new System.Windows.Forms.Panel();
		this.pictureBox2 = new System.Windows.Forms.PictureBox();
		this.customCheckBox_FullPerformance = new CustomControlLibrary.CustomCheckBox();
		this.customComboBox_LOD = new CustomControlLibrary.CustomComboBox();
		this.customComboBox_ModeSelect = new CustomControlLibrary.CustomComboBox();
		this.customComboBox_FullPerformance = new CustomControlLibrary.CustomComboBox();
		this.customCheckBox_MotionSync = new CustomControlLibrary.CustomCheckBox();
		this.customCheckBox_FixLine = new CustomControlLibrary.CustomCheckBox();
		this.customCheckBox_Ripple = new CustomControlLibrary.CustomCheckBox();
		this.label_MotionSync = new System.Windows.Forms.Label();
		this.label_FixLine = new System.Windows.Forms.Label();
		this.label_Ripple = new System.Windows.Forms.Label();
		this.label_LOD = new System.Windows.Forms.Label();
		this.label_ModeSelect = new System.Windows.Forms.Label();
		this.label_FullPerformance = new System.Windows.Forms.Label();
		this.label_SensorSetting = new System.Windows.Forms.Label();
		this.panel_DPIEffect = new System.Windows.Forms.Panel();
		this.pictureBox3 = new System.Windows.Forms.PictureBox();
		this.label_DPIBrightnessValue = new System.Windows.Forms.Label();
		this.customTrackBar_DPIBrightness = new CustomControlLibrary.CustomTrackBar();
		this.label_DPISpeedValue = new System.Windows.Forms.Label();
		this.customTrackBar_DPISpeed = new CustomControlLibrary.CustomTrackBar();
		this.label_DPIBrightness = new System.Windows.Forms.Label();
		this.label_DPISpeed = new System.Windows.Forms.Label();
		this.customComboBox_DPIEffect = new CustomControlLibrary.CustomComboBox();
		this.label_DPIEffect = new System.Windows.Forms.Label();
		this.toolTip = new System.Windows.Forms.ToolTip(this.components);
		this.panel_ReportRate.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).BeginInit();
		this.panel_Sensor.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox2).BeginInit();
		this.panel_DPIEffect.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox3).BeginInit();
		base.SuspendLayout();
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report8000Hz);
		this.panel_ReportRate.Controls.Add(this.pictureBox1);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report4000Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report2000Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report1000Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report500Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report250Hz);
		this.panel_ReportRate.Controls.Add(this.customRadioButton_Report125Hz);
		this.panel_ReportRate.Controls.Add(this.label_Report);
		this.panel_ReportRate.Location = new System.Drawing.Point(3, 3);
		this.panel_ReportRate.Name = "panel_ReportRate";
		this.panel_ReportRate.Size = new System.Drawing.Size(863, 95);
		this.panel_ReportRate.TabIndex = 82;
		this.customRadioButton_Report8000Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report8000Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report8000Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report8000Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report8000Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report8000Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report8000Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report8000Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report8000Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report8000Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report8000Hz.Location = new System.Drawing.Point(670, 54);
		this.customRadioButton_Report8000Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report8000Hz.Name = "customRadioButton_Report8000Hz";
		this.customRadioButton_Report8000Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report8000Hz.TabIndex = 8;
		this.customRadioButton_Report8000Hz.TabStop = true;
		this.customRadioButton_Report8000Hz.Tag = "64";
		this.customRadioButton_Report8000Hz.TextString = "8000Hz";
		this.customRadioButton_Report8000Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report8000Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report8000Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
		this.pictureBox1.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox1.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox1.Location = new System.Drawing.Point(27, 17);
		this.pictureBox1.Name = "pictureBox1";
		this.pictureBox1.Size = new System.Drawing.Size(33, 20);
		this.pictureBox1.TabIndex = 7;
		this.pictureBox1.TabStop = false;
		this.customRadioButton_Report4000Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report4000Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report4000Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report4000Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report4000Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report4000Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report4000Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report4000Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report4000Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report4000Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report4000Hz.Location = new System.Drawing.Point(570, 54);
		this.customRadioButton_Report4000Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report4000Hz.Name = "customRadioButton_Report4000Hz";
		this.customRadioButton_Report4000Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report4000Hz.TabIndex = 6;
		this.customRadioButton_Report4000Hz.TabStop = true;
		this.customRadioButton_Report4000Hz.Tag = "32";
		this.customRadioButton_Report4000Hz.TextString = "4000Hz";
		this.customRadioButton_Report4000Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report4000Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report4000Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
		this.customRadioButton_Report2000Hz.Appearance = System.Windows.Forms.Appearance.Button;
		this.customRadioButton_Report2000Hz.CheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键选择;
		this.customRadioButton_Report2000Hz.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customRadioButton_Report2000Hz.DisableImage = Mouse_Drive_Beta.Properties.Resources.回报率按键不可选;
		this.customRadioButton_Report2000Hz.FlatAppearance.BorderSize = 0;
		this.customRadioButton_Report2000Hz.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report2000Hz.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report2000Hz.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customRadioButton_Report2000Hz.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customRadioButton_Report2000Hz.ForeColor = System.Drawing.Color.White;
		this.customRadioButton_Report2000Hz.Location = new System.Drawing.Point(470, 54);
		this.customRadioButton_Report2000Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report2000Hz.Name = "customRadioButton_Report2000Hz";
		this.customRadioButton_Report2000Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report2000Hz.TabIndex = 5;
		this.customRadioButton_Report2000Hz.TabStop = true;
		this.customRadioButton_Report2000Hz.Tag = "16";
		this.customRadioButton_Report2000Hz.TextString = "2000Hz";
		this.customRadioButton_Report2000Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report2000Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report2000Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
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
		this.customRadioButton_Report1000Hz.Location = new System.Drawing.Point(370, 54);
		this.customRadioButton_Report1000Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report1000Hz.Name = "customRadioButton_Report1000Hz";
		this.customRadioButton_Report1000Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report1000Hz.TabIndex = 4;
		this.customRadioButton_Report1000Hz.TabStop = true;
		this.customRadioButton_Report1000Hz.Tag = "1";
		this.customRadioButton_Report1000Hz.TextString = "1000Hz";
		this.customRadioButton_Report1000Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report1000Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report1000Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
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
		this.customRadioButton_Report500Hz.Location = new System.Drawing.Point(270, 54);
		this.customRadioButton_Report500Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report500Hz.Name = "customRadioButton_Report500Hz";
		this.customRadioButton_Report500Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report500Hz.TabIndex = 3;
		this.customRadioButton_Report500Hz.TabStop = true;
		this.customRadioButton_Report500Hz.Tag = "2";
		this.customRadioButton_Report500Hz.TextString = "500Hz";
		this.customRadioButton_Report500Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report500Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report500Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
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
		this.customRadioButton_Report250Hz.Location = new System.Drawing.Point(170, 54);
		this.customRadioButton_Report250Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report250Hz.Name = "customRadioButton_Report250Hz";
		this.customRadioButton_Report250Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report250Hz.TabIndex = 2;
		this.customRadioButton_Report250Hz.TabStop = true;
		this.customRadioButton_Report250Hz.Tag = "4";
		this.customRadioButton_Report250Hz.TextString = "250Hz";
		this.customRadioButton_Report250Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report250Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report250Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
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
		this.customRadioButton_Report125Hz.Location = new System.Drawing.Point(70, 54);
		this.customRadioButton_Report125Hz.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.回报率按键鼠标进入;
		this.customRadioButton_Report125Hz.Name = "customRadioButton_Report125Hz";
		this.customRadioButton_Report125Hz.Size = new System.Drawing.Size(74, 26);
		this.customRadioButton_Report125Hz.TabIndex = 1;
		this.customRadioButton_Report125Hz.TabStop = true;
		this.customRadioButton_Report125Hz.Tag = "8";
		this.customRadioButton_Report125Hz.TextString = "125Hz";
		this.customRadioButton_Report125Hz.UncheckImage = Mouse_Drive_Beta.Properties.Resources.回报率按键未选择;
		this.customRadioButton_Report125Hz.UseVisualStyleBackColor = true;
		this.customRadioButton_Report125Hz.Click += new System.EventHandler(customRadioButton_ReportRate_Click);
		this.label_Report.AutoSize = true;
		this.label_Report.ForeColor = System.Drawing.Color.White;
		this.label_Report.Location = new System.Drawing.Point(66, 17);
		this.label_Report.Name = "label_Report";
		this.label_Report.Size = new System.Drawing.Size(51, 20);
		this.label_Report.TabIndex = 0;
		this.label_Report.Text = "回报率";
		this.panel_Sensor.Controls.Add(this.pictureBox2);
		this.panel_Sensor.Controls.Add(this.customCheckBox_FullPerformance);
		this.panel_Sensor.Controls.Add(this.customComboBox_LOD);
		this.panel_Sensor.Controls.Add(this.customComboBox_ModeSelect);
		this.panel_Sensor.Controls.Add(this.customComboBox_FullPerformance);
		this.panel_Sensor.Controls.Add(this.customCheckBox_MotionSync);
		this.panel_Sensor.Controls.Add(this.customCheckBox_FixLine);
		this.panel_Sensor.Controls.Add(this.customCheckBox_Ripple);
		this.panel_Sensor.Controls.Add(this.label_MotionSync);
		this.panel_Sensor.Controls.Add(this.label_FixLine);
		this.panel_Sensor.Controls.Add(this.label_Ripple);
		this.panel_Sensor.Controls.Add(this.label_LOD);
		this.panel_Sensor.Controls.Add(this.label_ModeSelect);
		this.panel_Sensor.Controls.Add(this.label_FullPerformance);
		this.panel_Sensor.Controls.Add(this.label_SensorSetting);
		this.panel_Sensor.Location = new System.Drawing.Point(3, 97);
		this.panel_Sensor.Name = "panel_Sensor";
		this.panel_Sensor.Size = new System.Drawing.Size(860, 133);
		this.panel_Sensor.TabIndex = 100;
		this.pictureBox2.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox2.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox2.Location = new System.Drawing.Point(27, 13);
		this.pictureBox2.Name = "pictureBox2";
		this.pictureBox2.Size = new System.Drawing.Size(33, 20);
		this.pictureBox2.TabIndex = 99;
		this.pictureBox2.TabStop = false;
		this.customCheckBox_FullPerformance.Checked = true;
		this.customCheckBox_FullPerformance.CheckImage = Mouse_Drive_Beta.Properties.Resources.单选框选择;
		this.customCheckBox_FullPerformance.Location = new System.Drawing.Point(442, 47);
		this.customCheckBox_FullPerformance.Name = "customCheckBox_FullPerformance";
		this.customCheckBox_FullPerformance.Size = new System.Drawing.Size(16, 16);
		this.customCheckBox_FullPerformance.TabIndex = 113;
		this.customCheckBox_FullPerformance.UncheckImage = Mouse_Drive_Beta.Properties.Resources.单选框未选择;
		this.customCheckBox_FullPerformance.CheckChange += new CustomControlLibrary.CustomCheckBox.CheckChangeEventHandler(customCheckBox_FullPerformance_CheckChange);
		this.customComboBox_LOD.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_LOD.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_LOD.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_LOD.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_LOD.Item.AddRange(new object[3] { "不检测静默高度", "1mm", "2mm" });
		this.customComboBox_LOD.Location = new System.Drawing.Point(252, 87);
		this.customComboBox_LOD.Name = "customComboBox_LOD";
		this.customComboBox_LOD.SelectIndex = -1;
		this.customComboBox_LOD.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_LOD.Size = new System.Drawing.Size(126, 26);
		this.customComboBox_LOD.TabIndex = 112;
		this.customComboBox_LOD.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_LOD.OnSelectedIndexChanged += new System.EventHandler(customComboBox_LOD_OnSelectedIndexChanged);
		this.customComboBox_ModeSelect.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_ModeSelect.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_ModeSelect.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_ModeSelect.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_ModeSelect.Item.AddRange(new object[2] { "LP", "HP" });
		this.customComboBox_ModeSelect.Location = new System.Drawing.Point(70, 87);
		this.customComboBox_ModeSelect.Name = "customComboBox_ModeSelect";
		this.customComboBox_ModeSelect.SelectIndex = -1;
		this.customComboBox_ModeSelect.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_ModeSelect.Size = new System.Drawing.Size(126, 26);
		this.customComboBox_ModeSelect.TabIndex = 111;
		this.customComboBox_ModeSelect.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_ModeSelect.OnSelectedIndexChanged += new System.EventHandler(customComboBox_ModeSelect_OnSelectedIndexChanged);
		this.customComboBox_FullPerformance.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_FullPerformance.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_FullPerformance.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_FullPerformance.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_FullPerformance.Item.AddRange(new object[3] { "关闭", "10s", "20s" });
		this.customComboBox_FullPerformance.Location = new System.Drawing.Point(442, 87);
		this.customComboBox_FullPerformance.Name = "customComboBox_FullPerformance";
		this.customComboBox_FullPerformance.SelectIndex = -1;
		this.customComboBox_FullPerformance.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_FullPerformance.Size = new System.Drawing.Size(126, 26);
		this.customComboBox_FullPerformance.TabIndex = 110;
		this.customComboBox_FullPerformance.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_FullPerformance.OnSelectedIndexChanged += new System.EventHandler(customComboBox_FullPerformance_OnSelectedIndexChanged);
		this.customCheckBox_MotionSync.Checked = false;
		this.customCheckBox_MotionSync.CheckImage = Mouse_Drive_Beta.Properties.Resources.开;
		this.customCheckBox_MotionSync.Location = new System.Drawing.Point(630, 95);
		this.customCheckBox_MotionSync.Name = "customCheckBox_MotionSync";
		this.customCheckBox_MotionSync.Size = new System.Drawing.Size(36, 18);
		this.customCheckBox_MotionSync.TabIndex = 109;
		this.customCheckBox_MotionSync.UncheckImage = Mouse_Drive_Beta.Properties.Resources.关;
		this.customCheckBox_MotionSync.CheckChange += new CustomControlLibrary.CustomCheckBox.CheckChangeEventHandler(customCheckBox_MotionSync_CheckChange);
		this.customCheckBox_FixLine.Checked = false;
		this.customCheckBox_FixLine.CheckImage = Mouse_Drive_Beta.Properties.Resources.开;
		this.customCheckBox_FixLine.Location = new System.Drawing.Point(630, 61);
		this.customCheckBox_FixLine.Name = "customCheckBox_FixLine";
		this.customCheckBox_FixLine.Size = new System.Drawing.Size(36, 18);
		this.customCheckBox_FixLine.TabIndex = 108;
		this.customCheckBox_FixLine.UncheckImage = Mouse_Drive_Beta.Properties.Resources.关;
		this.customCheckBox_FixLine.CheckChange += new CustomControlLibrary.CustomCheckBox.CheckChangeEventHandler(customCheckBox_FixLine_CheckChange);
		this.customCheckBox_Ripple.Checked = false;
		this.customCheckBox_Ripple.CheckImage = Mouse_Drive_Beta.Properties.Resources.开;
		this.customCheckBox_Ripple.Location = new System.Drawing.Point(630, 27);
		this.customCheckBox_Ripple.Name = "customCheckBox_Ripple";
		this.customCheckBox_Ripple.Size = new System.Drawing.Size(36, 18);
		this.customCheckBox_Ripple.TabIndex = 107;
		this.customCheckBox_Ripple.UncheckImage = Mouse_Drive_Beta.Properties.Resources.关;
		this.customCheckBox_Ripple.CheckChange += new CustomControlLibrary.CustomCheckBox.CheckChangeEventHandler(customCheckBox_Ripple_CheckChange);
		this.label_MotionSync.AutoSize = true;
		this.label_MotionSync.Location = new System.Drawing.Point(672, 93);
		this.label_MotionSync.Name = "label_MotionSync";
		this.label_MotionSync.Size = new System.Drawing.Size(91, 20);
		this.label_MotionSync.TabIndex = 106;
		this.label_MotionSync.Text = "motion sync";
		this.label_FixLine.AutoSize = true;
		this.label_FixLine.Location = new System.Drawing.Point(672, 59);
		this.label_FixLine.Name = "label_FixLine";
		this.label_FixLine.Size = new System.Drawing.Size(65, 20);
		this.label_FixLine.TabIndex = 105;
		this.label_FixLine.Text = "直线修正";
		this.label_Ripple.AutoSize = true;
		this.label_Ripple.Location = new System.Drawing.Point(672, 27);
		this.label_Ripple.Name = "label_Ripple";
		this.label_Ripple.Size = new System.Drawing.Size(65, 20);
		this.label_Ripple.TabIndex = 104;
		this.label_Ripple.Text = "波纹控制";
		this.label_LOD.AutoSize = true;
		this.label_LOD.Location = new System.Drawing.Point(248, 43);
		this.label_LOD.Name = "label_LOD";
		this.label_LOD.Size = new System.Drawing.Size(38, 20);
		this.label_LOD.TabIndex = 103;
		this.label_LOD.Text = "LOD";
		this.label_ModeSelect.AutoSize = true;
		this.label_ModeSelect.Location = new System.Drawing.Point(66, 43);
		this.label_ModeSelect.Name = "label_ModeSelect";
		this.label_ModeSelect.Size = new System.Drawing.Size(65, 20);
		this.label_ModeSelect.TabIndex = 102;
		this.label_ModeSelect.Text = "模式选择";
		this.label_FullPerformance.Location = new System.Drawing.Point(466, 43);
		this.label_FullPerformance.Name = "label_FullPerformance";
		this.label_FullPerformance.Size = new System.Drawing.Size(145, 40);
		this.label_FullPerformance.TabIndex = 101;
		this.label_FullPerformance.Text = "性能全开";
		this.label_SensorSetting.AutoSize = true;
		this.label_SensorSetting.Location = new System.Drawing.Point(66, 13);
		this.label_SensorSetting.Name = "label_SensorSetting";
		this.label_SensorSetting.Size = new System.Drawing.Size(82, 20);
		this.label_SensorSetting.TabIndex = 100;
		this.label_SensorSetting.Text = "Sensor设置";
		this.panel_DPIEffect.Controls.Add(this.pictureBox3);
		this.panel_DPIEffect.Controls.Add(this.label_DPIBrightnessValue);
		this.panel_DPIEffect.Controls.Add(this.customTrackBar_DPIBrightness);
		this.panel_DPIEffect.Controls.Add(this.label_DPISpeedValue);
		this.panel_DPIEffect.Controls.Add(this.customTrackBar_DPISpeed);
		this.panel_DPIEffect.Controls.Add(this.label_DPIBrightness);
		this.panel_DPIEffect.Controls.Add(this.label_DPISpeed);
		this.panel_DPIEffect.Controls.Add(this.customComboBox_DPIEffect);
		this.panel_DPIEffect.Controls.Add(this.label_DPIEffect);
		this.panel_DPIEffect.Location = new System.Drawing.Point(3, 233);
		this.panel_DPIEffect.Name = "panel_DPIEffect";
		this.panel_DPIEffect.Size = new System.Drawing.Size(860, 129);
		this.panel_DPIEffect.TabIndex = 101;
		this.pictureBox3.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox3.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox3.Location = new System.Drawing.Point(27, 4);
		this.pictureBox3.Name = "pictureBox3";
		this.pictureBox3.Size = new System.Drawing.Size(33, 20);
		this.pictureBox3.TabIndex = 108;
		this.pictureBox3.TabStop = false;
		this.label_DPIBrightnessValue.AutoSize = true;
		this.label_DPIBrightnessValue.ForeColor = System.Drawing.Color.White;
		this.label_DPIBrightnessValue.Location = new System.Drawing.Point(455, 82);
		this.label_DPIBrightnessValue.Name = "label_DPIBrightnessValue";
		this.label_DPIBrightnessValue.Size = new System.Drawing.Size(17, 20);
		this.label_DPIBrightnessValue.TabIndex = 107;
		this.label_DPIBrightnessValue.Text = "7";
		this.customTrackBar_DPIBrightness.BarColor = System.Drawing.Color.FromArgb(255, 255, 255);
		this.customTrackBar_DPIBrightness.BarSize = 2;
		this.customTrackBar_DPIBrightness.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customTrackBar_DPIBrightness.Enable = true;
		this.customTrackBar_DPIBrightness.IsRound = true;
		this.customTrackBar_DPIBrightness.Location = new System.Drawing.Point(327, 82);
		this.customTrackBar_DPIBrightness.Maximum = 10;
		this.customTrackBar_DPIBrightness.Minimum = 1;
		this.customTrackBar_DPIBrightness.Name = "customTrackBar_DPIBrightness";
		this.customTrackBar_DPIBrightness.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.customTrackBar_DPIBrightness.Size = new System.Drawing.Size(122, 23);
		this.customTrackBar_DPIBrightness.SizeSlidSize = new System.Drawing.Size(6, 18);
		this.customTrackBar_DPIBrightness.SliderColor = System.Drawing.Color.FromArgb(255, 106, 0);
		this.customTrackBar_DPIBrightness.Step = 1;
		this.customTrackBar_DPIBrightness.TabIndex = 106;
		this.customTrackBar_DPIBrightness.Value = 3;
		this.customTrackBar_DPIBrightness.ValueChanged += new CustomControlLibrary.CustomTrackBar.ValueChangedEventHandler(customTrackBar_DPIBrightness_ValueChanged);
		this.customTrackBar_DPIBrightness.SetValue += new CustomControlLibrary.CustomTrackBar.SetValueEventHandler(customTrackBar_DPIBrightness_SetValue);
		this.label_DPISpeedValue.AutoSize = true;
		this.label_DPISpeedValue.ForeColor = System.Drawing.Color.White;
		this.label_DPISpeedValue.Location = new System.Drawing.Point(455, 45);
		this.label_DPISpeedValue.Name = "label_DPISpeedValue";
		this.label_DPISpeedValue.Size = new System.Drawing.Size(17, 20);
		this.label_DPISpeedValue.TabIndex = 105;
		this.label_DPISpeedValue.Text = "3";
		this.customTrackBar_DPISpeed.BarColor = System.Drawing.Color.FromArgb(255, 255, 255);
		this.customTrackBar_DPISpeed.BarSize = 2;
		this.customTrackBar_DPISpeed.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customTrackBar_DPISpeed.Enable = true;
		this.customTrackBar_DPISpeed.IsRound = true;
		this.customTrackBar_DPISpeed.Location = new System.Drawing.Point(327, 45);
		this.customTrackBar_DPISpeed.Maximum = 5;
		this.customTrackBar_DPISpeed.Minimum = 1;
		this.customTrackBar_DPISpeed.Name = "customTrackBar_DPISpeed";
		this.customTrackBar_DPISpeed.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.customTrackBar_DPISpeed.Size = new System.Drawing.Size(122, 23);
		this.customTrackBar_DPISpeed.SizeSlidSize = new System.Drawing.Size(6, 18);
		this.customTrackBar_DPISpeed.SliderColor = System.Drawing.Color.FromArgb(255, 106, 0);
		this.customTrackBar_DPISpeed.Step = 1;
		this.customTrackBar_DPISpeed.TabIndex = 104;
		this.customTrackBar_DPISpeed.Value = 3;
		this.customTrackBar_DPISpeed.ValueChanged += new CustomControlLibrary.CustomTrackBar.ValueChangedEventHandler(customTrackBar_DPISpeed_ValueChanged);
		this.customTrackBar_DPISpeed.SetValue += new CustomControlLibrary.CustomTrackBar.SetValueEventHandler(customTrackBar_DPISpeed_SetValue);
		this.label_DPIBrightness.AutoSize = true;
		this.label_DPIBrightness.ForeColor = System.Drawing.Color.White;
		this.label_DPIBrightness.Location = new System.Drawing.Point(248, 82);
		this.label_DPIBrightness.Name = "label_DPIBrightness";
		this.label_DPIBrightness.Size = new System.Drawing.Size(37, 20);
		this.label_DPIBrightness.TabIndex = 103;
		this.label_DPIBrightness.Text = "亮度";
		this.label_DPISpeed.AutoSize = true;
		this.label_DPISpeed.ForeColor = System.Drawing.Color.White;
		this.label_DPISpeed.Location = new System.Drawing.Point(248, 45);
		this.label_DPISpeed.Name = "label_DPISpeed";
		this.label_DPISpeed.Size = new System.Drawing.Size(37, 20);
		this.label_DPISpeed.TabIndex = 102;
		this.label_DPISpeed.Text = "速度";
		this.customComboBox_DPIEffect.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_DPIEffect.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_DPIEffect.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_DPIEffect.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_DPIEffect.Item.AddRange(new object[3] { "关闭", "常亮", "呼吸" });
		this.customComboBox_DPIEffect.Location = new System.Drawing.Point(70, 45);
		this.customComboBox_DPIEffect.Name = "customComboBox_DPIEffect";
		this.customComboBox_DPIEffect.SelectIndex = -1;
		this.customComboBox_DPIEffect.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_DPIEffect.Size = new System.Drawing.Size(126, 26);
		this.customComboBox_DPIEffect.TabIndex = 101;
		this.customComboBox_DPIEffect.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_DPIEffect.OnSelectedIndexChanged += new System.EventHandler(customComboBox_DPIEffect_OnSelectedIndexChanged);
		this.label_DPIEffect.AutoSize = true;
		this.label_DPIEffect.ForeColor = System.Drawing.Color.White;
		this.label_DPIEffect.Location = new System.Drawing.Point(66, 4);
		this.label_DPIEffect.Name = "label_DPIEffect";
		this.label_DPIEffect.Size = new System.Drawing.Size(61, 20);
		this.label_DPIEffect.TabIndex = 100;
		this.label_DPIEffect.Text = "DPI灯效";
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 20f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.Color.Transparent;
		base.Controls.Add(this.panel_DPIEffect);
		base.Controls.Add(this.panel_Sensor);
		base.Controls.Add(this.panel_ReportRate);
		this.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.ForeColor = System.Drawing.Color.White;
		base.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		base.Name = "_3In1";
		base.Size = new System.Drawing.Size(866, 368);
		this.panel_ReportRate.ResumeLayout(false);
		this.panel_ReportRate.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).EndInit();
		this.panel_Sensor.ResumeLayout(false);
		this.panel_Sensor.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox2).EndInit();
		this.panel_DPIEffect.ResumeLayout(false);
		this.panel_DPIEffect.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox3).EndInit();
		base.ResumeLayout(false);
	}
}
