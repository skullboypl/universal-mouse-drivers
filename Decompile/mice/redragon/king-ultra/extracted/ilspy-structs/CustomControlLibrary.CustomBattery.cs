using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;

namespace CustomControlLibrary;

public class CustomBattery : Control
{
	private Image _EmptyBatteryImage;

	private Image _FullBatteryImage;

	private Image _LowBatteryImage;

	private Image _ChargingImage;

	private int _BatteryLevel;

	private int _LowBatteryLevel = 20;

	private bool _BatteryCharging;

	public override Color BackColor { get; set; } = Color.Transparent;

	public Image EmptyBatteryImage
	{
		get
		{
			return _EmptyBatteryImage;
		}
		set
		{
			_EmptyBatteryImage = value;
			Invalidate();
		}
	}

	public Image FullBatteryImage
	{
		get
		{
			return _FullBatteryImage;
		}
		set
		{
			_FullBatteryImage = value;
			Invalidate();
		}
	}

	public Image LowBatteryImage
	{
		get
		{
			return _LowBatteryImage;
		}
		set
		{
			_LowBatteryImage = value;
			Invalidate();
		}
	}

	public Image ChargingImage
	{
		get
		{
			return _ChargingImage;
		}
		set
		{
			_ChargingImage = value;
			Invalidate();
		}
	}

	public int BatteryLevel
	{
		get
		{
			return _BatteryLevel;
		}
		set
		{
			_BatteryLevel = value;
			Invalidate();
		}
	}

	public int LowBatteryLevel
	{
		get
		{
			return _LowBatteryLevel;
		}
		set
		{
			_LowBatteryLevel = value;
			Invalidate();
		}
	}

	public bool BatteryCharging
	{
		get
		{
			return _BatteryCharging;
		}
		set
		{
			_BatteryCharging = value;
			Invalidate();
		}
	}

	public CustomBattery()
	{
		SetStyle(ControlStyles.AllPaintingInWmPaint, value: true);
		SetStyle(ControlStyles.OptimizedDoubleBuffer, value: true);
		SetStyle(ControlStyles.SupportsTransparentBackColor, value: true);
		CreateControl();
	}

	protected override void OnPaint(PaintEventArgs e)
	{
		base.OnPaint(e);
		if (_EmptyBatteryImage != null && _FullBatteryImage != null && _LowBatteryImage != null)
		{
			Graphics graphics = e.Graphics;
			Image image = ((_BatteryLevel <= _LowBatteryLevel) ? _LowBatteryImage : _FullBatteryImage);
			int num = ((_BatteryLevel < 3) ? 3 : _BatteryLevel);
			graphics.DrawImage(rect: new Rectangle(0, 0, base.Width, base.Height), image: _EmptyBatteryImage);
			Image image2 = null;
			Bitmap bitmap = new Bitmap(num * base.Width / 100, base.Height, PixelFormat.Format32bppRgb);
			Graphics graphics2 = Graphics.FromImage(bitmap);
			Rectangle srcRect = new Rectangle(0, 0, num * _FullBatteryImage.Width / 100, _FullBatteryImage.Height);
			Rectangle destRect = new Rectangle(0, 0, num * base.Width / 100, base.Height);
			graphics2.DrawImage(image, destRect, srcRect, GraphicsUnit.Pixel);
			PixelProcess(bitmap);
			image2 = bitmap;
			Rectangle rect = new Rectangle(0, 0, num * base.Width / 100, base.Height);
			graphics.DrawImage(image2, rect);
			if (_BatteryCharging && _ChargingImage != null)
			{
				graphics.DrawImage(rect: new Rectangle((base.Width - _ChargingImage.Width) / 2, (base.Height - _ChargingImage.Height) / 2, _ChargingImage.Width, _ChargingImage.Height), image: _ChargingImage);
			}
		}
	}

	public static void PixelProcess(Bitmap bmp)
	{
		Color pixel = bmp.GetPixel(0, 0);
		bmp.MakeTransparent(pixel);
	}
}
