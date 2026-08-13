using System;
using System.Globalization;
using System.Windows.Data;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Helpers;

public class LocalizationConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return Resources.ResourceManager.GetString((string)value);
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw null;
	}
}
