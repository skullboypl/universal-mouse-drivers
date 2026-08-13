using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class StringToURIConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value != null && value is string)
		{
			return new Uri((string)value);
		}
		return value;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return null;
	}
}
