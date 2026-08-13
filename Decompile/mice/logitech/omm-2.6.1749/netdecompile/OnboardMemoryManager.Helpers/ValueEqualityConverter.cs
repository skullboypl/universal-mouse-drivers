using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class ValueEqualityConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values.Length != 2)
		{
			return false;
		}
		if (!values[0].GetType().IsAssignableFrom(values[1].GetType()))
		{
			return false;
		}
		return values[0].Equals(values[1]);
	}

	public object[] ConvertBack(object values, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotSupportedException();
	}
}
