using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class ConditionalNumericDisplayOverrideConverter : IMultiValueConverter
{
	private const string DefaultValue = "-";

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values == null || values.Length < 2)
		{
			return "-";
		}
		bool flag = true;
		if (values[0] != null && values[0] is bool)
		{
			flag = (bool)values[0];
		}
		if (flag)
		{
			if (values[1] != null)
			{
				return values[1].ToString();
			}
		}
		else if (parameter != null && !string.IsNullOrEmpty(parameter.ToString()))
		{
			return parameter.ToString();
		}
		return "-";
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
