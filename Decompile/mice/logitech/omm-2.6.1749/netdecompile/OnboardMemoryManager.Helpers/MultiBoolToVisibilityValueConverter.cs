using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class MultiBoolToVisibilityValueConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values == null || values.Length == 0)
		{
			return Visibility.Collapsed;
		}
		bool? flag = null;
		for (int i = 0; i < values.Length; i++)
		{
			if (values[i] is bool flag2)
			{
				flag = ((!flag.HasValue) ? new bool?(flag2) : new bool?(flag.Value && flag2));
			}
		}
		if (flag.HasValue)
		{
			return (!flag.Value) ? Visibility.Collapsed : Visibility.Visible;
		}
		return Visibility.Collapsed;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
