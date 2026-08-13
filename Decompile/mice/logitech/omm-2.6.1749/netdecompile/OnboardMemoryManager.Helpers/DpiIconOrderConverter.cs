using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace OnboardMemoryManager.Helpers;

public class DpiIconOrderConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (parameter == null || !(parameter is DrawingImage))
		{
			return null;
		}
		DrawingImage drawingImage = (parameter as DrawingImage).Clone();
		if (value == null)
		{
			return drawingImage;
		}
		object obj = null;
		switch ((int)value)
		{
		case 0:
			obj = Application.Current.FindResource("ColorBrush.Dpi.First");
			break;
		case 1:
			obj = Application.Current.FindResource("ColorBrush.Dpi.Second");
			break;
		case 2:
			obj = Application.Current.FindResource("ColorBrush.Dpi.Third");
			break;
		case 3:
			obj = Application.Current.FindResource("ColorBrush.Dpi.Fourth");
			break;
		case 4:
			obj = Application.Current.FindResource("ColorBrush.Dpi.Fifth");
			break;
		}
		if (!(obj is SolidColorBrush))
		{
			return drawingImage;
		}
		SolidColorBrush brush = obj as SolidColorBrush;
		(drawingImage.Drawing as GeometryDrawing).Brush = brush;
		return drawingImage;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
