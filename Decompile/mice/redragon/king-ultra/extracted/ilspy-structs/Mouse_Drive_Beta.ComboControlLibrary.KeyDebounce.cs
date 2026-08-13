using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using CustomControlLibrary;
using FileManager;
using Mouse_Drive_Beta.Properties;

namespace Mouse_Drive_Beta.ComboControlLibrary;

public class KeyDebounce : UserControl
{
	public delegate void ButtonSelectEventHandler(object sender, CustomEventArgs e);

	private Image _SelectImage;

	private Image _MouseEnterImage;

	private Image _NormalImage;

	private int _ButtonCount = 30;

	private int _ButtonInterval = 3;

	private int _SelectedIndex = -1;

	public List<CustomRadioButton> CustomRadioButtons = new List<CustomRadioButton>();

	private int PageButtonCount = 6;

	private int CurrentIndex;

	private List<string> TextString = new List<string>();

	private IContainer components;

	private Label label_KeyDebounce;

	private Panel panel_ButtonList;

	private CustomScrollBar customScrollBar1;

	private CustomCheckBox customCheckBox1;

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
	[Description("功能按钮鼠标进入时图片")]
	public Image MouseEnterImage
	{
		get
		{
			return _MouseEnterImage;
		}
		set
		{
			_MouseEnterImage = value;
			Invalidate();
		}
	}

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
	[Description("按键消抖是否勾选")]
	public bool Checked
	{
		get
		{
			return customCheckBox1.Checked;
		}
		set
		{
			if (_SelectedIndex != -1)
			{
				customCheckBox1.Checked = value;
				customCheckBox1_CheckChange(null, null);
			}
		}
	}

	[Category("自定义")]
	[Description("选择框选中时图片")]
	public Image CheckImage
	{
		get
		{
			return customCheckBox1.CheckImage;
		}
		set
		{
			customCheckBox1.CheckImage = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("选择框选中时图片")]
	public Image UncheckImage
	{
		get
		{
			return customCheckBox1.UncheckImage;
		}
		set
		{
			customCheckBox1.UncheckImage = value;
			Invalidate();
		}
	}

	public event ButtonSelectEventHandler ButtonSelect;

	public KeyDebounce()
	{
		InitializeComponent();
	}

	public void UpdateUI(string[] text)
	{
		if (_ButtonCount > 0 && (_NormalImage != null || _SelectImage != null || _MouseEnterImage != null))
		{
			panel_ButtonList.Controls.Clear();
			CustomRadioButtons.Clear();
			TextString.Clear();
			Image image = ((_NormalImage != null) ? _NormalImage : ((SelectImage != null) ? _SelectImage : _MouseEnterImage));
			for (int i = 0; i < _ButtonCount; i++)
			{
				CustomRadioButton customRadioButton = new CustomRadioButton();
				customRadioButton.CheckImage = _SelectImage;
				customRadioButton.Location = new Point(0, i * (_ButtonInterval + image.Height));
				customRadioButton.MouseEnterImage = _MouseEnterImage;
				customRadioButton.Name = "customRadioButton_KeyDebounce" + i;
				customRadioButton.TextString = text[i];
				customRadioButton.UncheckImage = _NormalImage;
				customRadioButton.Size = image.Size;
				customRadioButton.Tag = i;
				customRadioButton.Click += Button_Click;
				panel_ButtonList.Controls.Add(customRadioButton);
				CustomRadioButtons.Add(customRadioButton);
				TextString.Add(text[i]);
			}
			customScrollBar1.PageSize = panel_ButtonList.Size.Height;
			customScrollBar1.DocSize = _ButtonCount * (_ButtonInterval + image.Height);
			customScrollBar1.DocPosition = 0f;
			PageButtonCount = (panel_ButtonList.Size.Height + _ButtonInterval) / (_ButtonInterval + image.Height);
		}
	}

	public void UpdateText(string[] text)
	{
		TextString.Clear();
		for (int i = 0; i < _ButtonCount; i++)
		{
			CustomRadioButtons[i].TextString = text[i];
			TextString.Add(text[i]);
		}
	}

	private void Button_Click(object sender, EventArgs e)
	{
		CustomRadioButton customRadioButton = (CustomRadioButton)sender;
		_SelectedIndex = (int)customRadioButton.Tag;
		string value = Regex.Replace(customRadioButton.TextString, "[^0-9]+", "");
		if (Convert.ToInt32(value) < 8)
		{
			new FormDialog(LanguageFile.Dialogs[23], DialogButtons.OK, 9f).ShowDialog();
		}
		CustomEventArgs e2 = new CustomEventArgs(Convert.ToInt32(value));
		this.ButtonSelect?.Invoke(this, e2);
		if (customCheckBox1.Checked)
		{
			customCheckBox1.Checked = false;
			customCheckBox1_CheckChange(null, null);
		}
	}

	private void customScrollBar1_CustomScroll(object sender, CustomEventArgs e)
	{
		for (int i = 0; i < panel_ButtonList.Controls.Count; i++)
		{
			panel_ButtonList.Controls[i].Location = new Point(0, i * (_SelectImage.Height + _ButtonInterval) + _ButtonInterval - Convert.ToInt32(customScrollBar1.DocPosition));
		}
	}

	private void ChangePanelLocation()
	{
		int num = 0;
		if (_ButtonCount != 0 && CustomRadioButtons.Count != 0)
		{
			num = ((_SelectedIndex >= PageButtonCount / 2 && _ButtonCount > PageButtonCount) ? ((_SelectedIndex < _ButtonCount - PageButtonCount / 2) ? (_SelectedIndex - PageButtonCount / 2) : (_ButtonCount - PageButtonCount)) : 0);
			for (int i = 0; i < panel_ButtonList.Controls.Count; i++)
			{
				panel_ButtonList.Controls[i].Location = new Point(0, (i - num) * (_SelectImage.Height + _ButtonInterval));
			}
			CurrentIndex = num;
			customScrollBar1.DocPosition = num * (_SelectImage.Height + _ButtonInterval);
			CustomRadioButtons[_SelectedIndex].Checked = true;
		}
	}

	protected override void OnMouseWheel(MouseEventArgs e)
	{
		base.OnMouseWheel(e);
		if (!customCheckBox1.Checked)
		{
			return;
		}
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
			panel_ButtonList.Controls[i].Location = new Point(0, (i - num) * (_SelectImage.Height + _ButtonInterval) + _ButtonInterval);
		}
		customScrollBar1.DocPosition = num * (_SelectImage.Height + _ButtonInterval);
		CurrentIndex = num;
	}

	private void customCheckBox1_CheckChange(object sender, CustomEventArgs e)
	{
		if (customCheckBox1.Checked)
		{
			UpdateUI(TextString.ToArray());
			CustomRadioButtons[_SelectedIndex].Checked = true;
			ChangePanelLocation();
		}
		else if (_ButtonCount > 0 && _SelectImage != null && _MouseEnterImage != null)
		{
			panel_ButtonList.Controls.Clear();
			CustomRadioButtons[_SelectedIndex].Location = new Point(0, _ButtonInterval);
			panel_ButtonList.Controls.Add(CustomRadioButtons[_SelectedIndex]);
		}
		customScrollBar1.Visible = customCheckBox1.Checked;
		customScrollBar1.Enabled = customCheckBox1.Checked;
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
		this.label_KeyDebounce = new System.Windows.Forms.Label();
		this.panel_ButtonList = new System.Windows.Forms.Panel();
		this.customScrollBar1 = new CustomControlLibrary.CustomScrollBar();
		this.customCheckBox1 = new CustomControlLibrary.CustomCheckBox();
		base.SuspendLayout();
		this.label_KeyDebounce.AutoSize = true;
		this.label_KeyDebounce.ForeColor = System.Drawing.Color.White;
		this.label_KeyDebounce.Location = new System.Drawing.Point(41, 21);
		this.label_KeyDebounce.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label_KeyDebounce.Name = "label_KeyDebounce";
		this.label_KeyDebounce.Size = new System.Drawing.Size(93, 20);
		this.label_KeyDebounce.TabIndex = 1;
		this.label_KeyDebounce.Text = "按钮防抖时间";
		this.panel_ButtonList.Location = new System.Drawing.Point(21, 44);
		this.panel_ButtonList.Name = "panel_ButtonList";
		this.panel_ButtonList.Size = new System.Drawing.Size(158, 155);
		this.panel_ButtonList.TabIndex = 2;
		this.customScrollBar1.BarColor = System.Drawing.Color.FromArgb(30, 30, 30);
		this.customScrollBar1.BarRadius = 16;
		this.customScrollBar1.BarSize = 10;
		this.customScrollBar1.DocPosition = 0f;
		this.customScrollBar1.DocSize = 100f;
		this.customScrollBar1.Interval = 2;
		this.customScrollBar1.IsRound = true;
		this.customScrollBar1.Location = new System.Drawing.Point(198, 44);
		this.customScrollBar1.Name = "customScrollBar1";
		this.customScrollBar1.Orientation = System.Windows.Forms.Orientation.Vertical;
		this.customScrollBar1.PageSize = 10f;
		this.customScrollBar1.ScrollInterval = 10f;
		this.customScrollBar1.Size = new System.Drawing.Size(10, 155);
		this.customScrollBar1.SliderColor = System.Drawing.Color.FromArgb(70, 70, 70);
		this.customScrollBar1.SliderMiniSize = 20f;
		this.customScrollBar1.SliderPosition = 0f;
		this.customScrollBar1.TabIndex = 0;
		this.customScrollBar1.Text = "customScrollBar1";
		this.customScrollBar1.CustomScroll += new CustomControlLibrary.CustomScrollBar.CustomScrollEventHandler(customScrollBar1_CustomScroll);
		this.customCheckBox1.Checked = true;
		this.customCheckBox1.CheckImage = Mouse_Drive_Beta.Properties.Resources.单选框选择;
		this.customCheckBox1.Location = new System.Drawing.Point(21, 23);
		this.customCheckBox1.Name = "customCheckBox1";
		this.customCheckBox1.Size = new System.Drawing.Size(16, 16);
		this.customCheckBox1.TabIndex = 3;
		this.customCheckBox1.Text = "customCheckBox1";
		this.customCheckBox1.UncheckImage = Mouse_Drive_Beta.Properties.Resources.单选框未选择;
		this.customCheckBox1.CheckChange += new CustomControlLibrary.CustomCheckBox.CheckChangeEventHandler(customCheckBox1_CheckChange);
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 20f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.Color.Transparent;
		base.Controls.Add(this.customCheckBox1);
		base.Controls.Add(this.customScrollBar1);
		base.Controls.Add(this.panel_ButtonList);
		base.Controls.Add(this.label_KeyDebounce);
		this.Font = new System.Drawing.Font("微软雅黑", 10.5f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		base.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
		base.Name = "KeyDebounce";
		base.Size = new System.Drawing.Size(224, 211);
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
