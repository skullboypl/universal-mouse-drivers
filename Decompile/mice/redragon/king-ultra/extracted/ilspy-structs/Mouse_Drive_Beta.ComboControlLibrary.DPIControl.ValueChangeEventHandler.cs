using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using CustomControlLibrary;
using DriverLib;
using Mouse_Drive_Beta.FileManager;
using Mouse_Drive_Beta.Properties;

namespace Mouse_Drive_Beta.ComboControlLibrary;

public class DPIControl : UserControl
{
	public delegate void ValueChangeEventHandler(object sender, FlashDataMap e);

	private bool IsUpdateUI;

	public bool UpdateUIFlag;

	public FlashDataMap gFlashDataMap;

	private List<CustomDPIButton> CustomDPIButtons = new List<CustomDPIButton>();

	private Timer PressTimer;

	private int LastDPIGrade;

	private int SelectIndex = -1;

	private SensorDPI Sensor;

	private int _MinValue = 50;

	private int _MaxValue = 30000;

	private int _Step = 50;

	private int _Value = 1500;

	private int _MaxGrade = 8;

	private bool TrackBarMouseDown;

	private int pressCount;

	private MouseStatus SubMouseStatus = MouseStatus.Up;

	private MouseStatus AddMouseStatus = MouseStatus.Up;

	private MouseStatus mouseStatus = MouseStatus.Up;

	private Point buttomPoint;

	private Point mousePoint;

	private IContainer components;

	private Label label_DPIGrade;

	private CustomComboBox customComboBox_DPIGrade;

	private Panel panel1;

	private CustomTrackBar customTrackBar1;

	private CustomDPIButton customDPIButton1;

	private CustomDPIButton customDPIButton2;

	private CustomDPIButton customDPIButton3;

	private CustomDPIButton customDPIButton4;

	private CustomDPIButton customDPIButton5;

	private CustomDPIButton customDPIButton6;

	private CustomDPIButton customDPIButton7;

	private CustomDPIButton customDPIButton8;

	private PictureBox pictureBox1;

	private CustomButton customButton_Sub;

	private CustomButton customButton_Add;

	private CustomButton customButton_CurrentDPI;

	private TextBox textBox_DPIValue;

	[Category("自定义")]
	[Description("最小值")]
	public int MinValue
	{
		get
		{
			return _MinValue;
		}
		set
		{
			_MinValue = value;
			customTrackBar1.Minimum = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("最大值")]
	public int MaxValue
	{
		get
		{
			return _MaxValue;
		}
		set
		{
			_MaxValue = value;
			customTrackBar1.Maximum = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("一格的大小")]
	public int Step
	{
		get
		{
			return _Step;
		}
		set
		{
			_Step = value;
			customTrackBar1.Step = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("当前值")]
	public int Value
	{
		get
		{
			return _Value;
		}
		set
		{
			_Value = value;
			customTrackBar1.Value = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("支持最多几档DPI")]
	public int MaxGrade
	{
		get
		{
			return _MaxGrade;
		}
		set
		{
			_MaxGrade = value;
			customComboBox_DPIGrade.Item.Clear();
			for (int i = 1; i < _MaxGrade + 1; i++)
			{
				customComboBox_DPIGrade.Item.Add(i);
			}
			Invalidate();
		}
	}

	public Image CurrentDPINormalImage
	{
		get
		{
			return customButton_CurrentDPI.NormalImage;
		}
		set
		{
			customButton_CurrentDPI.NormalImage = value;
			Invalidate();
		}
	}

	public Image CurrentDPIMouseDownImage
	{
		get
		{
			return customButton_CurrentDPI.MouseDownImage;
		}
		set
		{
			customButton_CurrentDPI.MouseDownImage = value;
			Invalidate();
		}
	}

	public Image CurrentDPIMouseEnterImage
	{
		get
		{
			return customButton_CurrentDPI.MouseEnterImage;
		}
		set
		{
			customButton_CurrentDPI.MouseEnterImage = value;
			Invalidate();
		}
	}

	public Image DPICheckImage
	{
		get
		{
			return customDPIButton1.CheckImage;
		}
		set
		{
			foreach (Control control in base.Controls)
			{
				if (control is CustomDPIButton)
				{
					((CustomDPIButton)control).CheckImage = value;
				}
			}
			Invalidate();
		}
	}

	public Image DPIUncheckImage
	{
		get
		{
			return customDPIButton1.UncheckImage;
		}
		set
		{
			foreach (Control control in base.Controls)
			{
				if (control is CustomDPIButton)
				{
					((CustomDPIButton)control).UncheckImage = value;
				}
			}
			Invalidate();
		}
	}

	public Image TitlePicture
	{
		get
		{
			return pictureBox1.BackgroundImage;
		}
		set
		{
			pictureBox1.BackgroundImage = value;
			Invalidate();
		}
	}

	public Image SubImage
	{
		get
		{
			return customButton_Sub.NormalImage;
		}
		set
		{
			customButton_Sub.NormalImage = value;
			customButton_Sub.MouseDownImage = value;
			customButton_Sub.MouseEnterImage = value;
		}
	}

	public Image AddImage
	{
		get
		{
			return customButton_Add.NormalImage;
		}
		set
		{
			customButton_Add.NormalImage = value;
			customButton_Add.MouseDownImage = value;
			customButton_Add.MouseEnterImage = value;
		}
	}

	public event ValueChangeEventHandler ValueChange;

	public DPIControl()
	{
		InitializeComponent();
		SetStyles();
		PressTimer = new Timer();
		PressTimer.Enabled = false;
		PressTimer.Interval = 100;
		PressTimer.Tick += PressTimer_Tick;
	}

	private void SetStyles()
	{
		SetStyle(ControlStyles.UserPaint | ControlStyles.ResizeRedraw | ControlStyles.AllPaintingInWmPaint | ControlStyles.DoubleBuffer | ControlStyles.OptimizedDoubleBuffer, value: true);
		UpdateStyles();
		base.AutoScaleMode = AutoScaleMode.None;
	}

	private void UpdateDPIButton(bool disableDpiColor)
	{
		int num = Convert.ToInt32(customComboBox_DPIGrade.Item[customComboBox_DPIGrade.Item.Count - 1].ToString());
		CustomDPIButtons.Clear();
		for (int i = 1; i < 9; i++)
		{
			foreach (Control control in base.Controls)
			{
				if (control is CustomDPIButton)
				{
					CustomDPIButton customDPIButton = (CustomDPIButton)control;
					if (control.Name == "customDPIButton" + i)
					{
						customDPIButton.Tag = i - 1;
						customDPIButton.Click -= CustomDPIButton_Click;
						customDPIButton.ColorChange -= CustomDPIButton_ColorChange;
						customDPIButton.Click += CustomDPIButton_Click;
						customDPIButton.ColorChange += CustomDPIButton_ColorChange;
						string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
						customDPIButton.CheckImage = new Bitmap(baseDirectory + "\\res\\3Sensor\\btn_DPI_Select.png");
						customDPIButton.UncheckImage = new Bitmap(baseDirectory + "\\res\\3Sensor\\btn_DPI_Unselect.png");
						CustomDPIButtons.Add(customDPIButton);
						CustomDPIButtons[i - 1].Visible = i - 1 < num;
						CustomDPIButtons[i - 1].DisableDPIColor = disableDpiColor;
						break;
					}
				}
			}
		}
	}

	public bool UpdateUI(FlashDataMap flashDataMap, SensorDPI sensor, bool disableDpiColor)
	{
		bool result = true;
		int num = 0;
		IsUpdateUI = true;
		UpdateDPIButton(disableDpiColor);
		try
		{
			int num2 = (customComboBox_DPIGrade.SelectIndex = FormMain.gFlashDataMap.mouseConfig.maxDPI - 1);
			num = num2;
		}
		catch
		{
			result = false;
			int num2 = (customComboBox_DPIGrade.SelectIndex = customComboBox_DPIGrade.Item.Count - 1);
			num = num2;
			FormMain.gFlashDataMap.mouseConfig.maxDPI = (byte)customComboBox_DPIGrade.Item.Count;
			if (FormMain.gFlashDataMap.mouseConfig.currentDPI > num)
			{
				FormMain.gFlashDataMap.mouseConfig.currentDPI = (byte)num;
			}
		}
		num++;
		Sensor = sensor;
		for (int i = 0; i < 8; i++)
		{
			CustomDPIButtons[i].Visible = i < num;
			int num5 = FormMain.gFlashDataMap.dpiConfig[i].xDPI;
			int dPIex = FormMain.gFlashDataMap.dpiConfig[i].DPIex;
			int num6 = 0;
			if (Sensor.Discord)
			{
				for (int j = 0; j < Sensor.DPIList.Count; j++)
				{
					if (Sensor.DPIValueList[j] == num5)
					{
						num6 = Sensor.DPIList[j];
						break;
					}
				}
				if ((dPIex & 0x22) > 0)
				{
					num6 *= 2;
				}
			}
			else
			{
				if (Sensor.Type == "3395" || Sensor.Type == "3950" || Sensor.Type == "S205")
				{
					int num7 = dPIex >> 6;
					num7 <<= 8;
					num5 |= num7;
				}
				num6 = (((dPIex & 0x22) <= 0) ? ((num5 + ((!(Sensor.Type == "S205")) ? 1 : 0)) * 50) : ((num5 + ((!(Sensor.Type == "S205")) ? 1 : 0)) * 100));
			}
			if ((dPIex & 0x11) > 0)
			{
				num6 *= 2;
			}
			CustomDPIButtons[i].TextString = num6.ToString();
			Color dPIColor = Color.FromArgb(FormMain.gFlashDataMap.dpiConfig[i].color[0], FormMain.gFlashDataMap.dpiConfig[i].color[1], FormMain.gFlashDataMap.dpiConfig[i].color[2]);
			CustomDPIButtons[i].DPIColor = dPIColor;
			if (i == FormMain.gFlashDataMap.mouseConfig.currentDPI)
			{
				CustomDPIButtons[i].Checked = true;
				CustomDPIButton_Click(CustomDPIButtons[i], null);
			}
		}
		LastDPIGrade = (SelectIndex = FormMain.gFlashDataMap.mouseConfig.currentDPI);
		customTrackBar1.Value = Convert.ToInt32(CustomDPIButtons[SelectIndex].TextString);
		UpdateCurrentDPI(FormMain.gFlashDataMap.mouseConfig.currentDPI);
		IsUpdateUI = false;
		UpdateUIFlag = true;
		return result;
	}

	public void UpdateUI(DriveConfig.DeviceParam deviceParam)
	{
		IsUpdateUI = true;
		UpdateDPIButton(deviceParam.DisableDPIColor);
		for (int i = 0; i < deviceParam.DPIMaxGrade; i++)
		{
			CustomDPIButtons[i].Visible = i < deviceParam.DPIMaxGrade;
			CustomDPIButtons[i].TextString = deviceParam.DPIGrade[i].ToString();
			CustomDPIButtons[i].DPIColor = deviceParam.DPIColor[i];
			CustomDPIButtons[i].DisableDPIColor = deviceParam.DisableDPIColor;
		}
		UpdateCurrentDPI(deviceParam.DefaultDPI - 1);
		customComboBox_DPIGrade.SelectIndex = deviceParam.DPIMaxGrade - 1;
		SelectIndex = deviceParam.DefaultDPI - 1;
		_Value = Convert.ToInt32(CustomDPIButtons[SelectIndex].TextString);
		customTrackBar1.Value = _Value;
		textBox_DPIValue.Text = _Value.ToString();
		IsUpdateUI = false;
		UpdateUIFlag = true;
	}

	public void UpdateFlash(FlashDataMap flashDataMap)
	{
	}

	public void UpdateCurrentDPI(int index)
	{
		SelectIndex = index;
		FormMain.gFlashDataMap.mouseConfig.currentDPI = (byte)index;
		for (int i = 0; i < FormMain.gFlashDataMap.mouseConfig.maxDPI; i++)
		{
			CustomDPIButtons[i].CurrentDPI = false;
		}
		CustomDPIButtons[index].CurrentDPI = true;
		customButton_CurrentDPI.Location = new Point(CustomDPIButtons[index].Left + (CustomDPIButtons[index].Width - customButton_CurrentDPI.Width) / 2, CustomDPIButtons[index].Bottom + 3);
		CustomDPIButtons[index].Checked = true;
		_Value = Convert.ToInt32(CustomDPIButtons[index].TextString);
		textBox_DPIValue.Text = _Value.ToString();
		customTrackBar1.Value = _Value;
		FormMain.UpdateDllFlashMap();
	}

	private void UpdateValue()
	{
		if (!IsUpdateUI)
		{
			this.ValueChange?.Invoke(this, FormMain.gFlashDataMap);
		}
	}

	private void CustomDPIButton_Click(object sender, EventArgs e)
	{
		if (IsUpdateUI)
		{
			return;
		}
		int num = int.Parse(((CustomDPIButton)sender).Tag.ToString());
		if (FormMain.GetDeviceOnlineFlag())
		{
			CustomDPIButton customDPIButton = (CustomDPIButton)sender;
			SelectIndex = (int)customDPIButton.Tag;
			_Value = Convert.ToInt32(CustomDPIButtons[SelectIndex].TextString);
			textBox_DPIValue.Text = _Value.ToString();
			customTrackBar1.Value = _Value;
			FormMain.gFlashDataMap.mouseConfig.currentDPI = (byte)num;
			UpdateValue();
			int num2 = CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Left + (CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Width - customButton_CurrentDPI.Width) / 2;
			int num3 = CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Bottom + 3;
			if (FormMain.gFlashDataMap.mouseConfig.currentDPI != num)
			{
				SelectIndex = num;
				num2 = CustomDPIButtons[num].Left + (CustomDPIButtons[num].Width - customButton_CurrentDPI.Width) / 2;
				num3 = CustomDPIButtons[num].Bottom + 3;
			}
			customButton_CurrentDPI.Location = new Point(num2, num3);
		}
	}

	private void CustomDPIButton_ColorChange(object sender, Color e)
	{
		if (UpdateUIFlag && FormMain.GetDeviceOnlineFlag() && !IsUpdateUI && (FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[0] != CustomDPIButtons[SelectIndex].DPIColor.R || FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[1] != CustomDPIButtons[SelectIndex].DPIColor.G || FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[2] != CustomDPIButtons[SelectIndex].DPIColor.B))
		{
			FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[0] = CustomDPIButtons[SelectIndex].DPIColor.R;
			FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[1] = CustomDPIButtons[SelectIndex].DPIColor.G;
			FormMain.gFlashDataMap.dpiConfig[SelectIndex].color[2] = CustomDPIButtons[SelectIndex].DPIColor.B;
			UpdateValue();
		}
	}

	private void customComboBox_DPIGrade_OnSelectedIndexChanged(object sender, EventArgs e)
	{
		if (!IsUpdateUI && UpdateUIFlag && FormMain.GetDeviceOnlineFlag() && !IsUpdateUI)
		{
			byte b = Convert.ToByte(customComboBox_DPIGrade.Item[customComboBox_DPIGrade.SelectIndex]);
			FormMain.gFlashDataMap.mouseConfig.maxDPI = b;
			b--;
			if (FormMain.gFlashDataMap.mouseConfig.currentDPI > b)
			{
				LastDPIGrade = FormMain.gFlashDataMap.mouseConfig.currentDPI;
				string textString = CustomDPIButtons[b].TextString;
				CustomDPIButtons[b].TextString = CustomDPIButtons[LastDPIGrade].TextString;
				CustomDPIButtons[LastDPIGrade].TextString = textString;
				Color dPIColor = CustomDPIButtons[b].DPIColor;
				CustomDPIButtons[b].DPIColor = CustomDPIButtons[LastDPIGrade].DPIColor;
				CustomDPIButtons[LastDPIGrade].DPIColor = dPIColor;
				byte xDPI = FormMain.gFlashDataMap.dpiConfig[b].xDPI;
				FormMain.gFlashDataMap.dpiConfig[b].xDPI = FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].xDPI;
				FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].xDPI = xDPI;
				xDPI = FormMain.gFlashDataMap.dpiConfig[b].yDPI;
				FormMain.gFlashDataMap.dpiConfig[b].yDPI = FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].yDPI;
				FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].yDPI = xDPI;
				xDPI = FormMain.gFlashDataMap.dpiConfig[b].color[0];
				FormMain.gFlashDataMap.dpiConfig[b].color[0] = FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[0];
				FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[0] = xDPI;
				xDPI = FormMain.gFlashDataMap.dpiConfig[b].color[1];
				FormMain.gFlashDataMap.dpiConfig[b].color[1] = FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[1];
				FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[1] = xDPI;
				xDPI = FormMain.gFlashDataMap.dpiConfig[b].color[2];
				FormMain.gFlashDataMap.dpiConfig[b].color[2] = FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[2];
				FormMain.gFlashDataMap.dpiConfig[LastDPIGrade].color[2] = xDPI;
				FormMain.gFlashDataMap.mouseConfig.currentDPI = b;
				SelectIndex = b;
				_Value = Convert.ToInt32(CustomDPIButtons[b].TextString);
				textBox_DPIValue.Text = _Value.ToString();
				customTrackBar1.Value = _Value;
				CustomDPIButtons[SelectIndex].Checked = true;
				customButton_CurrentDPI.Location = new Point(CustomDPIButtons[b].Left + (CustomDPIButtons[b].Width - customButton_CurrentDPI.Width) / 2, CustomDPIButtons[b].Bottom + 3);
			}
			for (int i = 0; i < CustomDPIButtons.Count; i++)
			{
				CustomDPIButtons[i].Visible = i < FormMain.gFlashDataMap.mouseConfig.maxDPI;
			}
			UpdateValue();
		}
	}

	private void customTrackBar1_ValueChanged(object sender, CustomEventArgs e)
	{
		if (!UpdateUIFlag)
		{
			return;
		}
		if (!TrackBarMouseDown)
		{
			TrackBarMouseDown = true;
			if (!FormMain.GetDeviceOnlineFlag())
			{
				return;
			}
		}
		if (IsUpdateUI)
		{
			return;
		}
		for (int num = Sensor.Min.Count - 1; num > 0; num--)
		{
			if (customTrackBar1.Value >= Sensor.Min[num] - Sensor.Step[num])
			{
				customTrackBar1.Value = customTrackBar1.Value / Sensor.Step[num] * Sensor.Step[num];
				break;
			}
		}
		_Value = customTrackBar1.Value;
		SetValue();
	}

	private void customTrackBar1_SetValue(object sender, CustomEventArgs e)
	{
		TrackBarMouseDown = false;
		ValueToDPI(_Value);
	}

	private void PressTimer_Tick(object sender, EventArgs e)
	{
		if (AddMouseStatus == MouseStatus.Down)
		{
			if (pressCount < 15)
			{
				pressCount++;
			}
			if (pressCount > 10)
			{
				for (int num = Sensor.Min.Count - 1; num >= 0; num--)
				{
					if (_Value >= Sensor.Min[num] - Sensor.Step[num])
					{
						if (_Value < _MaxValue)
						{
							_Value += Sensor.Step[num];
						}
						break;
					}
				}
			}
		}
		else if (SubMouseStatus == MouseStatus.Down)
		{
			if (pressCount < 15)
			{
				pressCount++;
			}
			if (pressCount > 10)
			{
				for (int i = 0; i < Sensor.Max.Count; i++)
				{
					if (_Value <= Sensor.Max[i])
					{
						if (_Value > _MinValue)
						{
							_Value -= Sensor.Step[i];
						}
						break;
					}
				}
			}
		}
		else
		{
			pressCount = 0;
		}
		SetValue();
	}

	private void customButton_Add_MouseDown(object sender, MouseEventArgs e)
	{
		if (AddMouseStatus == MouseStatus.Down || !FormMain.GetDeviceOnlineFlag())
		{
			return;
		}
		AddMouseStatus = MouseStatus.Down;
		for (int num = Sensor.Min.Count - 1; num >= 0; num--)
		{
			if (_Value >= Sensor.Min[num] - Sensor.Step[num])
			{
				if (_Value < _MaxValue)
				{
					_Value += Sensor.Step[num];
				}
				break;
			}
		}
		SetValue();
	}

	private void customButton_Add_MouseUp(object sender, MouseEventArgs e)
	{
		if (AddMouseStatus == MouseStatus.Down)
		{
			UpdateDPI();
		}
		AddMouseStatus = MouseStatus.Up;
	}

	private void customButton_Sub_MouseDown(object sender, MouseEventArgs e)
	{
		if (SubMouseStatus == MouseStatus.Down || !FormMain.GetDeviceOnlineFlag())
		{
			return;
		}
		SubMouseStatus = MouseStatus.Down;
		for (int i = 0; i < Sensor.Max.Count; i++)
		{
			if (_Value <= Sensor.Max[i])
			{
				if (_Value > _MinValue)
				{
					_Value -= Sensor.Step[i];
				}
				break;
			}
		}
		SetValue();
	}

	private void customButton_Sub_MouseUp(object sender, MouseEventArgs e)
	{
		if (SubMouseStatus == MouseStatus.Down)
		{
			UpdateDPI();
		}
		SubMouseStatus = MouseStatus.Up;
	}

	private void SetValue()
	{
		textBox_DPIValue.Text = _Value.ToString();
		CustomDPIButtons[SelectIndex].TextString = _Value.ToString();
		customTrackBar1.Value = _Value;
	}

	private void UpdateDPI()
	{
		ValueToDPI(_Value);
		SetValue();
		PressTimer.Enabled = false;
		pressCount = 0;
	}

	private void ValueToDPI(int InValue)
	{
		_ = new byte[2];
		if (FormMain.gFlashDataMap.dpiConfig == null)
		{
			UpdateValue();
			return;
		}
		int dPIex = FormMain.gFlashDataMap.dpiConfig[SelectIndex].DPIex;
		bool flag = true;
		if ((dPIex & 0x22) > 0)
		{
			flag = false;
		}
		int num = (flag ? 50 : 100);
		int num2 = InValue / num;
		dPIex = 0;
		int num3 = InValue;
		int num4 = 1;
		if (Sensor.DPIex == 51)
		{
			int num5 = 0;
			for (int num6 = Sensor.Step.Count - 1; num6 >= 0; num6--)
			{
				if (num3 >= Sensor.Min[num6])
				{
					num5 = num6;
					break;
				}
			}
			switch (num5)
			{
			case 3:
				dPIex = 51;
				num4 = 4;
				break;
			case 2:
				dPIex = 17;
				num4 = 2;
				break;
			case 1:
				dPIex = 34;
				num4 = 2;
				break;
			}
		}
		else if ((Sensor.DPIex == 34 || Sensor.DPIex == 17) && num3 > Sensor.Max[0])
		{
			dPIex = Sensor.DPIex;
			num4 = 2;
		}
		if (Sensor.Discord)
		{
			num3 /= num4;
			for (int i = 0; i < Sensor.DPIList.Count; i++)
			{
				if (Sensor.DPIList[i] == num3)
				{
					num2 = Sensor.DPIValueList[i];
					break;
				}
			}
		}
		else
		{
			num = 50 * num4;
			num2 = ((!(Sensor.Type == "3395") && !(Sensor.Type == "3950")) ? (InValue / num) : (InValue / num - 1));
			if (Sensor.Type == "3395" || Sensor.Type == "3950" || Sensor.Type == "S205")
			{
				int num7 = num2 >> 8;
				dPIex |= (num7 << 2) | (num7 << 6);
			}
		}
		FormMain.gFlashDataMap.dpiConfig[SelectIndex].xDPI = (byte)num2;
		FormMain.gFlashDataMap.dpiConfig[SelectIndex].yDPI = (byte)num2;
		FormMain.gFlashDataMap.dpiConfig[SelectIndex].DPIex = (byte)dPIex;
		UpdateValue();
	}

	private void customButton_CurrentDPI_MouseDown(object sender, MouseEventArgs e)
	{
		if (FormMain.GetDeviceOnlineFlag() && e.Button == MouseButtons.Left)
		{
			mouseStatus = MouseStatus.Down;
			mousePoint = new Point(Control.MousePosition.X, Control.MousePosition.Y);
			buttomPoint = new Point(customButton_CurrentDPI.Location.X, customButton_CurrentDPI.Location.Y);
		}
	}

	private void customButton_CurrentDPI_MouseMove(object sender, MouseEventArgs e)
	{
		if (mouseStatus == MouseStatus.Down)
		{
			int num = Control.MousePosition.X - mousePoint.X + buttomPoint.X;
			int num2 = Control.MousePosition.Y - mousePoint.Y + buttomPoint.Y;
			if (num < 0)
			{
				num = 0;
			}
			if (num > base.Width - customButton_CurrentDPI.Width)
			{
				num = base.Width - customButton_CurrentDPI.Width;
			}
			if (num2 < 0)
			{
				num2 = 0;
			}
			if (num2 > base.Height - customButton_CurrentDPI.Height)
			{
				num2 = base.Height - customButton_CurrentDPI.Height;
			}
			customButton_CurrentDPI.Location = new Point(num, num2);
		}
	}

	private void customButton_CurrentDPI_MouseUp(object sender, MouseEventArgs e)
	{
		if (mouseStatus == MouseStatus.Down)
		{
			bool flag = false;
			int num = -1;
			int num2 = CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Left + (CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Width - customButton_CurrentDPI.Width) / 2;
			int num3 = CustomDPIButtons[FormMain.gFlashDataMap.mouseConfig.currentDPI].Bottom + 3;
			for (int i = 0; i < FormMain.gFlashDataMap.mouseConfig.maxDPI; i++)
			{
				if (CustomDPIButtons[i].Location.X < customButton_CurrentDPI.Location.X && customButton_CurrentDPI.Location.X < CustomDPIButtons[i].Location.X + CustomDPIButtons[i].Width)
				{
					num = i;
					break;
				}
			}
			if (num != -1 && FormMain.gFlashDataMap.mouseConfig.currentDPI != num)
			{
				SelectIndex = num;
				num2 = CustomDPIButtons[num].Left + (CustomDPIButtons[num].Width - customButton_CurrentDPI.Width) / 2;
				num3 = CustomDPIButtons[num].Bottom + 3;
				flag = true;
			}
			customButton_CurrentDPI.Location = new Point(num2, num3);
			if (flag)
			{
				CustomDPIButtons[SelectIndex].Checked = true;
				_Value = Convert.ToInt32(CustomDPIButtons[SelectIndex].TextString);
				textBox_DPIValue.Text = _Value.ToString();
				customTrackBar1.Value = _Value;
				FormMain.gFlashDataMap.mouseConfig.currentDPI = (byte)num;
				UpdateValue();
			}
		}
		mouseStatus = MouseStatus.Up;
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
		this.label_DPIGrade = new System.Windows.Forms.Label();
		this.panel1 = new System.Windows.Forms.Panel();
		this.customButton_Add = new CustomControlLibrary.CustomButton();
		this.textBox_DPIValue = new System.Windows.Forms.TextBox();
		this.customButton_Sub = new CustomControlLibrary.CustomButton();
		this.customTrackBar1 = new CustomControlLibrary.CustomTrackBar();
		this.pictureBox1 = new System.Windows.Forms.PictureBox();
		this.customButton_CurrentDPI = new CustomControlLibrary.CustomButton();
		this.customDPIButton8 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton7 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton6 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton5 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton4 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton3 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton2 = new CustomControlLibrary.CustomDPIButton();
		this.customDPIButton1 = new CustomControlLibrary.CustomDPIButton();
		this.customComboBox_DPIGrade = new CustomControlLibrary.CustomComboBox();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).BeginInit();
		base.SuspendLayout();
		this.label_DPIGrade.AutoSize = true;
		this.label_DPIGrade.Location = new System.Drawing.Point(76, 20);
		this.label_DPIGrade.Name = "label_DPIGrade";
		this.label_DPIGrade.Size = new System.Drawing.Size(61, 20);
		this.label_DPIGrade.TabIndex = 0;
		this.label_DPIGrade.Text = "DPI级数";
		this.panel1.Controls.Add(this.customButton_Add);
		this.panel1.Controls.Add(this.textBox_DPIValue);
		this.panel1.Controls.Add(this.customButton_Sub);
		this.panel1.Controls.Add(this.customTrackBar1);
		this.panel1.Location = new System.Drawing.Point(81, 55);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(747, 36);
		this.panel1.TabIndex = 2;
		this.customButton_Add.Location = new System.Drawing.Point(721, 11);
		this.customButton_Add.MouseDownImage = Mouse_Drive_Beta.Properties.Resources.加键使能;
		this.customButton_Add.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.加键使能;
		this.customButton_Add.Name = "customButton_Add";
		this.customButton_Add.NormalImage = Mouse_Drive_Beta.Properties.Resources.加键使能;
		this.customButton_Add.Size = new System.Drawing.Size(14, 14);
		this.customButton_Add.TabIndex = 3;
		this.customButton_Add.MouseClick += new System.Windows.Forms.MouseEventHandler(customButton_Add_MouseDown);
		this.customButton_Add.MouseDown += new System.Windows.Forms.MouseEventHandler(customButton_Add_MouseDown);
		this.customButton_Add.MouseUp += new System.Windows.Forms.MouseEventHandler(customButton_Add_MouseUp);
		this.textBox_DPIValue.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.textBox_DPIValue.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.textBox_DPIValue.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.textBox_DPIValue.ForeColor = System.Drawing.Color.White;
		this.textBox_DPIValue.Location = new System.Drawing.Point(649, 8);
		this.textBox_DPIValue.Name = "textBox_DPIValue";
		this.textBox_DPIValue.ReadOnly = true;
		this.textBox_DPIValue.Size = new System.Drawing.Size(66, 19);
		this.textBox_DPIValue.TabIndex = 16;
		this.textBox_DPIValue.Text = "50";
		this.textBox_DPIValue.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.customButton_Sub.Location = new System.Drawing.Point(629, 17);
		this.customButton_Sub.MouseDownImage = Mouse_Drive_Beta.Properties.Resources.减键使能;
		this.customButton_Sub.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.减键使能;
		this.customButton_Sub.Name = "customButton_Sub";
		this.customButton_Sub.NormalImage = Mouse_Drive_Beta.Properties.Resources.减键使能;
		this.customButton_Sub.Size = new System.Drawing.Size(14, 4);
		this.customButton_Sub.TabIndex = 1;
		this.customButton_Sub.MouseClick += new System.Windows.Forms.MouseEventHandler(customButton_Sub_MouseDown);
		this.customButton_Sub.MouseDown += new System.Windows.Forms.MouseEventHandler(customButton_Sub_MouseDown);
		this.customButton_Sub.MouseUp += new System.Windows.Forms.MouseEventHandler(customButton_Sub_MouseUp);
		this.customTrackBar1.BarColor = System.Drawing.Color.FromArgb(255, 255, 255);
		this.customTrackBar1.BarSize = 2;
		this.customTrackBar1.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customTrackBar1.Enable = true;
		this.customTrackBar1.IsRound = true;
		this.customTrackBar1.Location = new System.Drawing.Point(3, 7);
		this.customTrackBar1.Maximum = 100;
		this.customTrackBar1.Minimum = 0;
		this.customTrackBar1.Name = "customTrackBar1";
		this.customTrackBar1.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.customTrackBar1.Size = new System.Drawing.Size(620, 23);
		this.customTrackBar1.SizeSlidSize = new System.Drawing.Size(6, 18);
		this.customTrackBar1.SliderColor = System.Drawing.Color.FromArgb(255, 106, 0);
		this.customTrackBar1.Step = 1;
		this.customTrackBar1.TabIndex = 0;
		this.customTrackBar1.Text = "customTrackBar1";
		this.customTrackBar1.ValueChanged += new CustomControlLibrary.CustomTrackBar.ValueChangedEventHandler(customTrackBar1_ValueChanged);
		this.customTrackBar1.SetValue += new CustomControlLibrary.CustomTrackBar.SetValueEventHandler(customTrackBar1_SetValue);
		this.pictureBox1.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.标题符号;
		this.pictureBox1.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
		this.pictureBox1.Location = new System.Drawing.Point(37, 20);
		this.pictureBox1.Name = "pictureBox1";
		this.pictureBox1.Size = new System.Drawing.Size(33, 20);
		this.pictureBox1.TabIndex = 11;
		this.pictureBox1.TabStop = false;
		this.customButton_CurrentDPI.Location = new System.Drawing.Point(198, 184);
		this.customButton_CurrentDPI.MouseDownImage = Mouse_Drive_Beta.Properties.Resources.当前DPI档位鼠标进入;
		this.customButton_CurrentDPI.MouseEnterImage = Mouse_Drive_Beta.Properties.Resources.当前DPI档位鼠标进入;
		this.customButton_CurrentDPI.Name = "customButton_CurrentDPI";
		this.customButton_CurrentDPI.NormalImage = Mouse_Drive_Beta.Properties.Resources.当前DPI档位;
		this.customButton_CurrentDPI.Size = new System.Drawing.Size(24, 20);
		this.customButton_CurrentDPI.TabIndex = 13;
		this.customButton_CurrentDPI.MouseDown += new System.Windows.Forms.MouseEventHandler(customButton_CurrentDPI_MouseDown);
		this.customButton_CurrentDPI.MouseMove += new System.Windows.Forms.MouseEventHandler(customButton_CurrentDPI_MouseMove);
		this.customButton_CurrentDPI.MouseUp += new System.Windows.Forms.MouseEventHandler(customButton_CurrentDPI_MouseUp);
		this.customDPIButton8.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton8.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton8.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton8.CurrentDPI = false;
		this.customDPIButton8.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton8.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton8.FlatAppearance.BorderSize = 0;
		this.customDPIButton8.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton8.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton8.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton8.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton8.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton8.Location = new System.Drawing.Point(774, 108);
		this.customDPIButton8.Name = "customDPIButton8";
		this.customDPIButton8.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton8.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton8.TabIndex = 10;
		this.customDPIButton8.TextString = "26000";
		this.customDPIButton8.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton8.UseVisualStyleBackColor = true;
		this.customDPIButton7.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton7.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton7.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton7.CurrentDPI = false;
		this.customDPIButton7.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton7.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton7.FlatAppearance.BorderSize = 0;
		this.customDPIButton7.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton7.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton7.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton7.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton7.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton7.Location = new System.Drawing.Point(674, 108);
		this.customDPIButton7.Name = "customDPIButton7";
		this.customDPIButton7.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton7.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton7.TabIndex = 9;
		this.customDPIButton7.TextString = "26000";
		this.customDPIButton7.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton7.UseVisualStyleBackColor = true;
		this.customDPIButton6.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton6.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton6.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton6.CurrentDPI = false;
		this.customDPIButton6.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton6.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton6.FlatAppearance.BorderSize = 0;
		this.customDPIButton6.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton6.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton6.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton6.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton6.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton6.Location = new System.Drawing.Point(574, 108);
		this.customDPIButton6.Name = "customDPIButton6";
		this.customDPIButton6.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton6.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton6.TabIndex = 8;
		this.customDPIButton6.TextString = "26000";
		this.customDPIButton6.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton6.UseVisualStyleBackColor = true;
		this.customDPIButton5.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton5.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton5.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton5.CurrentDPI = false;
		this.customDPIButton5.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton5.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton5.FlatAppearance.BorderSize = 0;
		this.customDPIButton5.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton5.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton5.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton5.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton5.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton5.Location = new System.Drawing.Point(474, 108);
		this.customDPIButton5.Name = "customDPIButton5";
		this.customDPIButton5.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton5.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton5.TabIndex = 7;
		this.customDPIButton5.TextString = "26000";
		this.customDPIButton5.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton5.UseVisualStyleBackColor = true;
		this.customDPIButton4.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton4.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton4.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton4.CurrentDPI = false;
		this.customDPIButton4.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton4.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton4.FlatAppearance.BorderSize = 0;
		this.customDPIButton4.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton4.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton4.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton4.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton4.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton4.Location = new System.Drawing.Point(374, 108);
		this.customDPIButton4.Name = "customDPIButton4";
		this.customDPIButton4.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton4.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton4.TabIndex = 6;
		this.customDPIButton4.TextString = "26000";
		this.customDPIButton4.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton4.UseVisualStyleBackColor = true;
		this.customDPIButton3.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton3.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton3.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton3.CurrentDPI = false;
		this.customDPIButton3.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton3.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton3.FlatAppearance.BorderSize = 0;
		this.customDPIButton3.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton3.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton3.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton3.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton3.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton3.Location = new System.Drawing.Point(274, 108);
		this.customDPIButton3.Name = "customDPIButton3";
		this.customDPIButton3.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton3.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton3.TabIndex = 5;
		this.customDPIButton3.TextString = "26000";
		this.customDPIButton3.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton3.UseVisualStyleBackColor = true;
		this.customDPIButton2.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton2.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton2.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton2.CurrentDPI = false;
		this.customDPIButton2.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton2.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton2.FlatAppearance.BorderSize = 0;
		this.customDPIButton2.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton2.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton2.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton2.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton2.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton2.Location = new System.Drawing.Point(174, 108);
		this.customDPIButton2.Name = "customDPIButton2";
		this.customDPIButton2.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton2.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton2.TabIndex = 4;
		this.customDPIButton2.TextString = "26000";
		this.customDPIButton2.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton2.UseVisualStyleBackColor = true;
		this.customDPIButton1.Appearance = System.Windows.Forms.Appearance.Button;
		this.customDPIButton1.CheckFont = new System.Drawing.Font("微软雅黑", 12f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton1.CheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键选择;
		this.customDPIButton1.CurrentDPI = false;
		this.customDPIButton1.DisableColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customDPIButton1.DPIColor = System.Drawing.Color.Yellow;
		this.customDPIButton1.FlatAppearance.BorderSize = 0;
		this.customDPIButton1.FlatAppearance.CheckedBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton1.FlatAppearance.MouseDownBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton1.FlatAppearance.MouseOverBackColor = System.Drawing.Color.Transparent;
		this.customDPIButton1.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
		this.customDPIButton1.Font = new System.Drawing.Font("微软雅黑", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.customDPIButton1.Location = new System.Drawing.Point(80, 108);
		this.customDPIButton1.Name = "customDPIButton1";
		this.customDPIButton1.SelectForeColor = System.Drawing.Color.Red;
		this.customDPIButton1.Size = new System.Drawing.Size(68, 70);
		this.customDPIButton1.TabIndex = 3;
		this.customDPIButton1.TextString = "26000";
		this.customDPIButton1.UncheckImage = Mouse_Drive_Beta.Properties.Resources.DPI按键未选择;
		this.customDPIButton1.UseVisualStyleBackColor = true;
		this.customComboBox_DPIGrade.ArrowDirection = CustomControlLibrary.CustomComboBox.ArrowDirectionEnum.Down;
		this.customComboBox_DPIGrade.ArrowImageNoraml = Mouse_Drive_Beta.Properties.Resources.下拉框按键;
		this.customComboBox_DPIGrade.BackColor = System.Drawing.Color.FromArgb(57, 57, 57);
		this.customComboBox_DPIGrade.Font = new System.Drawing.Font("微软雅黑", 10.5f);
		this.customComboBox_DPIGrade.Item.AddRange(new object[8] { "1", "2", "3", "4", "5", "6", "7", "8" });
		this.customComboBox_DPIGrade.Location = new System.Drawing.Point(172, 20);
		this.customComboBox_DPIGrade.Name = "customComboBox_DPIGrade";
		this.customComboBox_DPIGrade.SelectIndex = -1;
		this.customComboBox_DPIGrade.SelectItemColor = System.Drawing.Color.FromArgb(119, 119, 119);
		this.customComboBox_DPIGrade.Size = new System.Drawing.Size(65, 20);
		this.customComboBox_DPIGrade.TabIndex = 15;
		this.customComboBox_DPIGrade.UnselectItemColor = System.Drawing.Color.FromArgb(63, 63, 63);
		this.customComboBox_DPIGrade.OnSelectedIndexChanged += new System.EventHandler(customComboBox_DPIGrade_OnSelectedIndexChanged);
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 20f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.Color.Transparent;
		base.Controls.Add(this.customButton_CurrentDPI);
		base.Controls.Add(this.pictureBox1);
		base.Controls.Add(this.customDPIButton8);
		base.Controls.Add(this.customDPIButton7);
		base.Controls.Add(this.customDPIButton6);
		base.Controls.Add(this.customDPIButton5);
		base.Controls.Add(this.customDPIButton4);
		base.Controls.Add(this.customDPIButton3);
		base.Controls.Add(this.customDPIButton2);
		base.Controls.Add(this.customDPIButton1);
		base.Controls.Add(this.panel1);
		base.Controls.Add(this.customComboBox_DPIGrade);
		base.Controls.Add(this.label_DPIGrade);
		this.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		this.ForeColor = System.Drawing.Color.White;
		base.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		base.Name = "DPIControl";
		base.Size = new System.Drawing.Size(870, 220);
		this.panel1.ResumeLayout(false);
		this.panel1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pictureBox1).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
