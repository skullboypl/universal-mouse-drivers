using System;
using System.Linq;
using System.Windows.Media;

namespace OnboardMemoryManager.Helpers;

public static class ColorHelpers
{
	public class HSL
	{
		public int H;

		public double S;

		public double L;

		public HSL(int h, double s, double l)
		{
			H = h;
			S = s;
			L = l;
		}

		public HSL()
		{
		}
	}

	public class HSV
	{
		public int H;

		public double S;

		public double V;

		public HSV(int h, double s, double v)
		{
			H = h;
			S = s;
			V = v;
		}

		public HSV()
		{
		}
	}

	public static HSL ColortoHSL(Color color)
	{
		byte r = color.R;
		byte g = color.G;
		byte b = color.B;
		double num = (float)(int)r / 255f;
		double num2 = (float)(int)g / 255f;
		double num3 = (float)(int)b / 255f;
		double num4 = Math.Min(Math.Min(num, num2), num3);
		double num5 = Math.Max(Math.Max(num, num2), num3);
		double num6 = num5 - num4;
		HSL hSL = new HSL();
		hSL.L = (num5 + num4) / 2.0;
		if (num6 != 0.0)
		{
			hSL.S = ((hSL.L <= 0.5) ? (num6 / (num5 + num4)) : (num6 / (2.0 - num5 - num4)));
			double num7 = ((num == num5) ? ((num2 - num3) / 6.0 / num6) : ((num2 != num5) ? (0.6666666865348816 + (num - num2) / 6.0 / num6) : (0.3333333432674408 + (num3 - num) / 6.0 / num6)));
			if (num7 < 0.0)
			{
				num7 += 1.0;
			}
			if (num7 > 1.0)
			{
				num7 -= 1.0;
			}
			hSL.H = (int)(num7 * 360.0);
		}
		return hSL;
	}

	public static HSV ColortoHSV(Color color)
	{
		double num = (float)(int)color.R / 255f;
		double num2 = (float)(int)color.G / 255f;
		double num3 = (float)(int)color.B / 255f;
		double num4 = Math.Min(Math.Min(num, num2), num3);
		double num5 = Math.Max(Math.Max(num, num2), num3);
		double num6 = num5 - num4;
		double num7 = 0.0;
		if (num6 != 0.0)
		{
			num7 = ((num == num5) ? ((num2 - num3) / 6.0 / num6) : ((num2 != num5) ? (0.6666666865348816 + (num - num2) / 6.0 / num6) : (0.3333333432674408 + (num3 - num) / 6.0 / num6)));
			if (num7 < 0.0)
			{
				num7 += 1.0;
			}
			if (num7 > 1.0)
			{
				num7 -= 1.0;
			}
		}
		double s = ((num5 == 0.0) ? 0.0 : (1.0 - 1.0 * (num4 / num5)));
		double v = num5;
		return new HSV((int)(num7 * 360.0), s, v);
	}

	public static Color HSLtoColor(HSL hsl)
	{
		double num = 0.0;
		double num2 = 0.0;
		double num3 = 0.0;
		double num4 = (double)hsl.H / 360.0;
		double s = hsl.S;
		double l = hsl.L;
		if (l != 0.0)
		{
			if (s == 0.0)
			{
				num = (num2 = (num3 = l));
			}
			else
			{
				double num5 = ((!(l < 0.5)) ? (l + s - l * s) : (l * (1.0 + s)));
				double temp = 2.0 * l - num5;
				num = GetColorComponent(temp, num5, num4 + 1.0 / 3.0);
				num2 = GetColorComponent(temp, num5, num4);
				num3 = GetColorComponent(temp, num5, num4 - 1.0 / 3.0);
			}
		}
		num = Math.Round(num * 255.0, MidpointRounding.AwayFromZero);
		num2 = Math.Round(num2 * 255.0, MidpointRounding.AwayFromZero);
		num3 = Math.Round(num3 * 255.0, MidpointRounding.AwayFromZero);
		return Color.FromRgb((byte)num, (byte)num2, (byte)num3);
	}

	public static Color HSVtoColor(HSV hsv)
	{
		double num = hsv.H;
		int num2 = Convert.ToInt32(Math.Floor(num / 60.0)) % 6;
		double num3 = num / 60.0 - Math.Floor(num / 60.0);
		double s = hsv.S;
		double num4 = hsv.V * 255.0;
		byte b = Convert.ToByte(num4);
		byte b2 = Convert.ToByte(num4 * (1.0 - s));
		byte b3 = Convert.ToByte(num4 * (1.0 - num3 * s));
		byte b4 = Convert.ToByte(num4 * (1.0 - (1.0 - num3) * s));
		return num2 switch
		{
			0 => Color.FromArgb(byte.MaxValue, b, b4, b2), 
			1 => Color.FromArgb(byte.MaxValue, b3, b, b2), 
			2 => Color.FromArgb(byte.MaxValue, b2, b, b4), 
			3 => Color.FromArgb(byte.MaxValue, b2, b3, b), 
			4 => Color.FromArgb(byte.MaxValue, b4, b2, b), 
			_ => Color.FromArgb(byte.MaxValue, b, b2, b3), 
		};
	}

	private static double GetColorComponent(double temp1, double temp2, double temp3)
	{
		if (temp3 < 0.0)
		{
			temp3 += 1.0;
		}
		else if (temp3 > 1.0)
		{
			temp3 -= 1.0;
		}
		if (temp3 < 1.0 / 6.0)
		{
			return temp1 + (temp2 - temp1) * 6.0 * temp3;
		}
		if (temp3 < 0.5)
		{
			return temp2;
		}
		if (temp3 < 2.0 / 3.0)
		{
			return temp1 + (temp2 - temp1) * (2.0 / 3.0 - temp3) * 6.0;
		}
		return temp1;
	}

	public static Color GetRelativeColor(GradientStopCollection gsc, double offset)
	{
		GradientStop gradientStop = gsc.SingleOrDefault((GradientStop f) => f.Offset == offset);
		if (gradientStop != null)
		{
			return gradientStop.Color;
		}
		GradientStop gradientStop2 = gsc.Where((GradientStop w) => w.Offset == gsc.Min((GradientStop m) => m.Offset)).First();
		GradientStop gradientStop3 = gsc.Where((GradientStop w) => w.Offset == gsc.Max((GradientStop m) => m.Offset)).First();
		foreach (GradientStop item in gsc)
		{
			if (item.Offset < offset && item.Offset > gradientStop2.Offset)
			{
				gradientStop2 = item;
			}
			if (item.Offset > offset && item.Offset < gradientStop3.Offset)
			{
				gradientStop3 = item;
			}
		}
		return new Color
		{
			ScA = (float)((offset - gradientStop2.Offset) * (double)(gradientStop3.Color.ScA - gradientStop2.Color.ScA) / (gradientStop3.Offset - gradientStop2.Offset) + (double)gradientStop2.Color.ScA),
			ScR = (float)((offset - gradientStop2.Offset) * (double)(gradientStop3.Color.ScR - gradientStop2.Color.ScR) / (gradientStop3.Offset - gradientStop2.Offset) + (double)gradientStop2.Color.ScR),
			ScG = (float)((offset - gradientStop2.Offset) * (double)(gradientStop3.Color.ScG - gradientStop2.Color.ScG) / (gradientStop3.Offset - gradientStop2.Offset) + (double)gradientStop2.Color.ScG),
			ScB = (float)((offset - gradientStop2.Offset) * (double)(gradientStop3.Color.ScB - gradientStop2.Color.ScB) / (gradientStop3.Offset - gradientStop2.Offset) + (double)gradientStop2.Color.ScB)
		};
	}
}
