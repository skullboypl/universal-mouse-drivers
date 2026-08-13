using System;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace CustomControlLibrary;

public class CustomDPIButton : RadioButton
{
	public delegate void ColorChangeEventHandler(object sender, Color e);

	private ColorDialog colorDialog;

	private Image _UncheckImage;

	private Image _CheckImage;

	private string _TextString;

	private Font _CheckFont;

	private Color _DisableColor = Color.FromArgb(57, 57, 57);

	private Color _SelectForeColor = Color.Red;

	private bool _CurrentDPI;

	private bool _DisableDPIColor;

	private PictureBox _PictureBox;

	private Image image;

	[Category("自定义")]
	[Description("鼠标离开的背景图片")]
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

	[Category("自定义")]
	[Description("鼠标按下的背景图片")]
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
	[Description("显示文本")]
	public string TextString
	{
		get
		{
			return _TextString;
		}
		set
		{
			_TextString = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("选中之后的字体大小")]
	public Font CheckFont
	{
		get
		{
			return _CheckFont;
		}
		set
		{
			_CheckFont = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("不使能时字体颜色")]
	public Color DisableColor
	{
		get
		{
			return _DisableColor;
		}
		set
		{
			_DisableColor = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("DPI的颜色")]
	public Color DPIColor
	{
		get
		{
			return _PictureBox.BackColor;
		}
		set
		{
			_PictureBox.BackColor = value;
			Invalidate();
		}
	}

	public Color SelectForeColor
	{
		get
		{
			return _SelectForeColor;
		}
		set
		{
			_SelectForeColor = value;
			Invalidate();
		}
	}

	public bool CurrentDPI
	{
		get
		{
			return _CurrentDPI;
		}
		set
		{
			_CurrentDPI = value;
			Invalidate();
		}
	}

	public bool DisableDPIColor
	{
		get
		{
			return _DisableDPIColor;
		}
		set
		{
			_DisableDPIColor = value;
			Invalidate();
		}
	}

	public event ColorChangeEventHandler ColorChange;

	public CustomDPIButton()
	{
		SetStyle(ControlStyles.UserPaint | ControlStyles.ResizeRedraw | ControlStyles.SupportsTransparentBackColor | ControlStyles.AllPaintingInWmPaint | ControlStyles.DoubleBuffer | ControlStyles.OptimizedDoubleBuffer, value: true);
		UpdateStyles();
		base.Appearance = Appearance.Button;
		base.FlatStyle = FlatStyle.Flat;
		base.FlatAppearance.BorderSize = 0;
		base.FlatAppearance.CheckedBackColor = Color.Transparent;
		base.FlatAppearance.MouseOverBackColor = Color.Transparent;
		base.FlatAppearance.MouseDownBackColor = Color.Transparent;
		AutoSize = false;
		_PictureBox = new PictureBox();
		_PictureBox.BorderStyle = BorderStyle.FixedSingle;
		_PictureBox.Size = new Size(base.Width, 11);
		_PictureBox.Name = "pictureBox1";
		_PictureBox.Location = new Point(0, 11);
		_PictureBox.BackColor = Color.Yellow;
		_PictureBox.Click += _PictureBox_Click;
		base.Controls.Add(_PictureBox);
		colorDialog = new ColorDialog();
	}

	private void _PictureBox_Click(object sender, EventArgs e)
	{
		base.Checked = true;
		OnClick(null);
		colorDialog.FullOpen = true;
		if (colorDialog.ShowDialog() == DialogResult.OK)
		{
			Color e2 = (DPIColor = colorDialog.Color);
			this.ColorChange?.Invoke(this, e2);
		}
	}

	protected override void SetBoundsCore(int x, int y, int width, int height, BoundsSpecified specified)
	{
		int val = ((_CheckImage != null) ? _CheckImage.Width : 0);
		int val2 = ((_CheckImage != null) ? _CheckImage.Height : 0);
		int val3 = ((_UncheckImage != null) ? _UncheckImage.Width : 0);
		int val4 = ((_UncheckImage != null) ? _UncheckImage.Height : 0);
		int val5 = Math.Max(val, val3);
		val5 = Math.Max(val5, val3);
		val5 = ((val5 == 0) ? width : val5);
		int val6 = Math.Max(val2, val4);
		val6 = Math.Max(val6, val4);
		val6 = ((val6 == 0) ? height : val6);
		base.SetBoundsCore(x, y, val5, val6, specified);
	}

	protected override void OnPaint(PaintEventArgs e)
	{
		base.OnPaint(e);
		e.Graphics.SmoothingMode = SmoothingMode.HighQuality;
		if (_DisableDPIColor && base.Controls.Contains(_PictureBox))
		{
			base.Controls.Remove(_PictureBox);
		}
		if (base.Checked)
		{
			image = _CheckImage;
		}
		else
		{
			image = _UncheckImage;
		}
		if (image == null)
		{
			SolidBrush solidBrush = new SolidBrush(BackColor);
			e.Graphics.FillRectangle(solidBrush, e.ClipRectangle);
			solidBrush.Dispose();
		}
		else
		{
			Rectangle rect = new Rectangle((base.Width - image.Size.Width) / 2, (base.Height - image.Size.Height) / 2, image.Size.Width, image.Size.Height);
			e.Graphics.DrawImageUnscaledAndClipped(image, rect);
			_PictureBox.Size = new Size(image.Size.Width, image.Size.Height / 4);
			_PictureBox.Location = new Point((base.Width - image.Size.Width) / 2, (base.Height - image.Size.Height) / 2 + image.Size.Height * 13 / 16);
		}
		SizeF size = CreateGraphics().MeasureString(_TextString, base.Checked ? CheckFont : Font);
		int num = Convert.ToInt32(size.Width);
		int num2 = Convert.ToInt32(size.Height);
		PointF location = new PointF((base.Size.Width - num) / 2, (base.Size.Height - num2 - _PictureBox.Size.Height) / 2);
		RectangleF layoutRectangle = new RectangleF(location, size);
		e.Graphics.DrawString(_TextString, base.Checked ? CheckFont : Font, new SolidBrush(ForeColor), layoutRectangle);
	}

	protected override void OnClick(EventArgs e)
	{
		base.OnClick(e);
	}
}
