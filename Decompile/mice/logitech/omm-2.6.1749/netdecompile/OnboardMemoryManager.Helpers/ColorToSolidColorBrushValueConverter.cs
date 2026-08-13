using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace OnboardMemoryManager.Helpers;

public class ColorToSolidColorBrushValueConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value == null)
		{
			return null;
		}
		if (value is Color)
		{
			return new SolidColorBrush((Color)value);
		}
		Type type = value.GetType();
		throw new InvalidOperationException("Unsupported type [" + type.Name + "]");
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
