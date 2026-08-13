using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class StringSubstitutionConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return string.Format((string)value, (string)parameter);
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw null;
	}
}
