using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using CustomControlLibrary;
using Mouse_Drive_Beta.Properties;
using Mouse_Drive_Beta.SkinFormLib;

namespace Mouse_Drive_Beta.ComboControlLibrary;

public class CustomSubKeyFunction : UserControl
{
	public delegate void ButtonSelectEventHandler(object sender, CustomEventArgs e);

	public delegate void DoubleClickEventHandler(object sender, EventArgs e);

	private Image _NormalImage;

	private Image _NormalImageArrow;

	private Image _SelectImage;

	private Image _SelectImageArrow;

	private int _SelectedIndex = -1;

	private int _ButtonCount = 6;

	private int _ButtonInterval = 3;

	private Image _CheckImage;

	private Image _UncheckImage;

	public List<CustomRadioButton> CustomRadioButtons = new List<CustomRadioButton>();

	private int PageButtonCount = 6;

	private int CurrentIndex;

	private IContainer components;

	private Panel panel_ButtonList;

	private CustomScrollBar customScrollBar1;

	[Category("自定义")]
	[Description("功能按钮正常时图片")]
	public Image NormalImage
	{
		get
		{
			return _NormalImage;
		}
		set
		{
			_NormalImage = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("功能按钮正常时图片")]
	public Image NormalImageArrow
	{
		get
		{
			return _NormalImageArrow;
		}
		set
		{
			_NormalImageArrow = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("功能按钮选中时图片")]
	public Image SelectImage
	{
		get
		{
			return _SelectImage;
		}
		set
		{
			_SelectImage = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("功能按钮选中时图片(带箭头)")]
	public Image SelectImageArrow
	{
		get
		{
			return _SelectImageArrow;
		}
		set
		{
			_SelectImageArrow = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("功能按钮选中的位置")]
	public int SelectedIndex
	{
		get
		{
			return _SelectedIndex;
		}
		set
		{
			_SelectedIndex = value;
			ChangePanelLocation();
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("功能按钮的个数")]
	public int ButtonCount
	{
		get
		{
			return _ButtonCount;
		}
		set
		{
			_ButtonCount = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("两个功能按钮的间隔")]
	public int ButtonInterval
	{
		get
		{
			return _ButtonInterval;
		}
		set
		{
			_ButtonInterval = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("选择框选中时图片")]
	public Image CheckImage
	{
		get
		{
			return _CheckImage;
		}
		set
		{
			_CheckImage = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("选择框选中时图片")]
	public Image UncheckImage
	{
		get
		{
			return _UncheckImage;
		}
		set
		{
			_UncheckImage = value;
			Invalidate();
		}
	}

	public event ButtonSelectEventHandler ButtonSelect;

	public new event DoubleClickEventHandler DoubleClick;

	public CustomSubKeyFunction()
	{
		InitializeComponent();
	}

	protected override void OnMouseWheel(MouseEventArgs e)
	{
		base.OnMouseWheel(e);
		int num = CurrentIndex;
		if (CurrentIndex > _ButtonCount - PageButtonCount)
		{
			return;
		}
		if (e.Delta <= 0)
		{
			if (num < _ButtonCount - PageButtonCount)
			{
				num++;
			}
		}
		else if (num > 0)
		{
			num--;
		}
		for (int i = 0; i < panel_ButtonList.Controls.Count; i++)
		{
			panel_ButtonList.Controls[i].Location = new Point(0, ((i - num) * (_SelectImage.Height + _ButtonInterval) + _ButtonInterval) * FormResize.GetDpi() / 96);
		}
		customScrollBar1.DocPosition = num * (_SelectImage.Height + _ButtonInterval);
		CurrentIndex = num;
	}

	private void customScrollBar1_CustomScroll(object sender, CustomEventArgs e)
	{
		for (int i = 0; i < panel_ButtonList.Controls.Count; i++)
		{
			panel_ButtonList.Controls[i].Location = new Point(0, (i * (_SelectImage.Height + _ButtonInterval) + _ButtonInterval - Convert.ToInt32(customScrollBar1.DocPosition)) * FormResize.GetDpi() / 96);
		}
	}

	public void UpdateUI(bool[] pull, string[] text, string name)
	{
		if (_ButtonCount <= 0 || (_NormalImage == null && _SelectImage == null))
		{
			return;
		}
		panel_ButtonList.Controls.Clear();
		CustomRadioButtons.Clear();
		Image image = ((_NormalImage != null) ? _NormalImage : _SelectImage);
		for (int i = 0; i < _ButtonCount; i++)
		{
			CustomRadioButton customRadioButton = new CustomRadioButton();
			customRadioButton.CheckImage = (pull[i] ? _SelectImageArrow : _SelectImage);
			customRadioButton.ForeColor = FormMain.driveParam.BtnForeClr;
			customRadioButton.Location = new Point(0, i * (_ButtonInterval + image.Height) * FormResize.GetDpi() / 96);
			customRadioButton.Name = "customRadioButton_SubKeyFunction_" + name + i;
			customRadioButton.TextString = text[i];
			customRadioButton.UncheckImage = (pull[i] ? _NormalImageArrow : _NormalImage);
			customRadioButton.Size = new Size(panel_ButtonList.Width, (panel_ButtonList.Height - _ButtonInterval * 5) / 6);
			customRadioButton.Tag = i;
			customRadioButton.Click -= Button_Click;
			customRadioButton.Click += Button_Click;
			if (!pull[i])
			{
				customRadioButton.DoubleClick -= Button_DoubleClick;
				customRadioButton.DoubleClick += Button_DoubleClick;
			}
			panel_ButtonList.Controls.Add(customRadioButton);
			CustomRadioButtons.Add(customRadioButton);
		}
		customScrollBar1.PageSize = panel_ButtonList.Size.Height;
		customScrollBar1.DocSize = _ButtonCount * (_ButtonInterval + image.Height);
		customScrollBar1.DocPosition = 0f;
		PageButtonCount = (panel_ButtonList.Size.Height + _ButtonInterval) / (_ButtonInterval + image.Height);
	}

	public void SetFontSize(float fontSize)
	{
		for (int i = 0; i < _ButtonCount; i++)
		{
			CustomRadioButtons[i].Font = new Font("微软雅黑", fontSize);
		}
	}

	private void Button_DoubleClick(object sender, EventArgs e)
	{
		Hide();
		this.DoubleClick?.Invoke(this, e);
	}

	private void Button_Click(object sender, EventArgs e)
	{
		int num = 0;
		num = (int)((CustomRadioButton)sender).Tag;
		_SelectedIndex = num;
		this.ButtonSelect?.Invoke(this, new CustomEventArgs(_SelectedIndex));
	}

	private void ChangePanelLocation()
	{
		int num = 0;
		if (_ButtonCount != 0 && CustomRadioButtons.Count != 0)
		{
			num = ((_SelectedIndex >= PageButtonCount / 2 && _ButtonCount > PageButtonCount) ? ((_SelectedIndex < _ButtonCount - PageButtonCount / 2) ? (_SelectedIndex - PageButtonCount / 2) : (_ButtonCount - PageButtonCount)) : 0);
			for (int i = 0; i < panel_ButtonList.Controls.Count; i++)
			{
				panel_ButtonList.Controls[i].Location = new Point(0, ((i - num) * (_SelectImage.Height + _ButtonInterval) + _ButtonInterval) * FormResize.GetDpi() / 96);
			}
			CurrentIndex = num;
			customScrollBar1.DocPosition = num * (_SelectImage.Height + _ButtonInterval);
			CustomRadioButtons[_SelectedIndex].Checked = true;
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
		this.panel_ButtonList = new System.Windows.Forms.Panel();
		this.customScrollBar1 = new CustomControlLibrary.CustomScrollBar();
		base.SuspendLayout();
		this.panel_ButtonList.BackColor = System.Drawing.Color.Transparent;
		this.panel_ButtonList.Location = new System.Drawing.Point(10, 10);
		this.panel_ButtonList.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		this.panel_ButtonList.Name = "panel_ButtonList";
		this.panel_ButtonList.Size = new System.Drawing.Size(155, 175);
		this.panel_ButtonList.TabIndex = 1;
		this.customScrollBar1.BarColor = System.Drawing.Color.FromArgb(30, 30, 30);
		this.customScrollBar1.BarRadius = 16;
		this.customScrollBar1.BarSize = 10;
		this.customScrollBar1.DocPosition = 0f;
		this.customScrollBar1.DocSize = 10f;
		this.customScrollBar1.Interval = 2;
		this.customScrollBar1.IsRound = true;
		this.customScrollBar1.Location = new System.Drawing.Point(178, 9);
		this.customScrollBar1.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		this.customScrollBar1.Name = "customScrollBar1";
		this.customScrollBar1.Orientation = System.Windows.Forms.Orientation.Vertical;
		this.customScrollBar1.PageSize = 1f;
		this.customScrollBar1.ScrollInterval = 10f;
		this.customScrollBar1.Size = new System.Drawing.Size(10, 176);
		this.customScrollBar1.SliderColor = System.Drawing.Color.FromArgb(70, 70, 70);
		this.customScrollBar1.SliderMiniSize = 20f;
		this.customScrollBar1.SliderPosition = 0f;
		this.customScrollBar1.TabIndex = 2;
		this.customScrollBar1.Text = "customScrollBar1";
		this.customScrollBar1.CustomScroll += new CustomControlLibrary.CustomScrollBar.CustomScrollEventHandler(customScrollBar1_CustomScroll);
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 20f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackgroundImage = Mouse_Drive_Beta.Properties.Resources.按键功能背景;
		this.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
		base.Controls.Add(this.customScrollBar1);
		base.Controls.Add(this.panel_ButtonList);
		this.DoubleBuffered = true;
		this.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		base.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		base.Name = "CustomSubKeyFunction";
		base.Size = new System.Drawing.Size(200, 194);
		base.ResumeLayout(false);
	}
}
