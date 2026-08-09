using System;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace CustomControlLibrary;

public class CustomRecordMacro : Control
{
	private Image _StartImage_MouseEnter;

	private Image _StartImage_Normal;

	private Image _StopImage_MouseEnter;

	private Image _StopImage_Normal;

	private bool _Checked;

	private string _StopText = "";

	private string _StartText = "";

	private MouseStatus mouseStatus = MouseStatus.Leave;

	public override Color BackColor { get; set; } = Color.Transparent;

	[Category("自定义")]
	[Description("鼠标进入框时的图片")]
	public Image StartImage_MouseEnter
	{
		get
		{
			return _StartImage_MouseEnter;
		}
		set
		{
			_StartImage_MouseEnter = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("普通模式时的图片")]
	public Image StartImage_Normal
	{
		get
		{
			return _StartImage_Normal;
		}
		set
		{
			if (_StartImage_Normal != value)
			{
				_StartImage_Normal = value;
				Invalidate();
			}
		}
	}

	[Category("自定义")]
	[Description("鼠标按下时的图片")]
	public Image StopImage_MouseEnter
	{
		get
		{
			return _StopImage_MouseEnter;
		}
		set
		{
			_StopImage_MouseEnter = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("普通模式时的图片")]
	public Image StopImage_Normal
	{
		get
		{
			return _StopImage_Normal;
		}
		set
		{
			if (_StopImage_Normal != value)
			{
				_StopImage_Normal = value;
				Invalidate();
			}
		}
	}

	[Category("自定义")]
	[Description("是否选择")]
	public bool Checked
	{
		get
		{
			return _Checked;
		}
		set
		{
			_Checked = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("选择时出现的文本")]
	public string StopText
	{
		get
		{
			return _StopText;
		}
		set
		{
			_StopText = value;
			Invalidate();
		}
	}

	[Category("自定义")]
	[Description("未选择时出现的文本")]
	public string StartText
	{
		get
		{
			return _StartText;
		}
		set
		{
			_StartText = value;
			Invalidate();
		}
	}

	public CustomRecordMacro()
	{
		SetStyle(ControlStyles.AllPaintingInWmPaint, value: true);
		SetStyle(ControlStyles.OptimizedDoubleBuffer, value: true);
		SetStyle(ControlStyles.SupportsTransparentBackColor, value: true);
		CreateControl();
	}

	protected override void OnPaint(PaintEventArgs e)
	{
		base.OnPaint(e);
		e.Graphics.SmoothingMode = SmoothingMode.HighQuality;
		Image image = null;
		image = (_Checked ? ((mouseStatus != MouseStatus.Enter) ? _StopImage_Normal : _StopImage_MouseEnter) : ((mouseStatus != MouseStatus.Enter) ? _StartImage_Normal : _StartImage_MouseEnter));
		if (image == null)
		{
			SolidBrush solidBrush = new SolidBrush(BackColor);
			e.Graphics.FillRectangle(solidBrush, e.ClipRectangle);
			solidBrush.Dispose();
		}
		else
		{
			PointF location = new PointF((base.Size.Width - image.Size.Width) / 2, (base.Size.Height - image.Size.Height) / 2);
			new RectangleF(location, image.Size);
			e.Graphics.DrawImage(image, 0, 0, base.Width, base.Height);
		}
		Graphics graphics = CreateGraphics();
		string s = (_Checked ? _StopText : _StartText);
		SizeF size = graphics.MeasureString(s, Font);
		int num = Convert.ToInt32(size.Width);
		int num2 = Convert.ToInt32(size.Height);
		PointF location2 = new PointF((base.Size.Width - num + 30) / 2, (base.Size.Height - num2) / 2);
		RectangleF layoutRectangle = new RectangleF(location2, size);
		e.Graphics.DrawString(s, Font, new SolidBrush(ForeColor), layoutRectangle);
	}

	protected override void OnMouseDown(MouseEventArgs e)
	{
		base.OnMouseDown(e);
		mouseStatus = MouseStatus.Down;
		Invalidate();
	}

	protected override void OnMouseUp(MouseEventArgs e)
	{
		base.OnMouseDown(e);
		mouseStatus = MouseStatus.Up;
		Invalidate();
	}

	protected override void OnMouseEnter(EventArgs e)
	{
		base.OnMouseEnter(e);
		mouseStatus = MouseStatus.Enter;
		Invalidate();
	}

	protected override void OnMouseLeave(EventArgs e)
	{
		base.OnMouseLeave(e);
		mouseStatus = MouseStatus.Leave;
		Invalidate();
	}
}
