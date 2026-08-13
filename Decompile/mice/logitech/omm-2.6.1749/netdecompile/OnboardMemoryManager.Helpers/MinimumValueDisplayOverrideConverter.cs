using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class MinimumValueDisplayOverrideConverter : IMultiValueConverter
{
	private double previousValue;

	private const int expectedValuesLength = 3;

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		string result = "N/A";
		if (values.Length != 3)
		{
			return result;
		}
		if (values[0] == Binding.DoNothing && values[1] == Binding.DoNothing && values[2] != Binding.DoNothing)
		{
			return values[2].ToString();
		}
		string text = "";
		double result2 = 0.0;
		double result3 = 0.0;
		text = values[0].ToString();
		if ((1u & (double.TryParse(values[1].ToString(), out result2) ? 1u : 0u) & (double.TryParse(values[2].ToString(), out result3) ? 1u : 0u)) == 0)
		{
			return result;
		}
		result = ((!string.IsNullOrEmpty(text) && result3 == result2) ? text : result3.ToString());
		previousValue = result3;
		return result;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		if (value is string s)
		{
			if (double.TryParse(s, out var result))
			{
				return new object[3]
				{
					Binding.DoNothing,
					Binding.DoNothing,
					result
				};
			}
			return new object[3]
			{
				Binding.DoNothing,
				Binding.DoNothing,
				previousValue
			};
		}
		return new object[3]
		{
			Binding.DoNothing,
			Binding.DoNothing,
			Binding.DoNothing
		};
	}
}
