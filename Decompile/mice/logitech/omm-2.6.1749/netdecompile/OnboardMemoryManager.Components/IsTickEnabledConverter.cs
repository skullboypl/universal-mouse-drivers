using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Components;

public class IsTickEnabledConverter : IMultiValueConverter
{
	private const int expectedValuesLength = 4;

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		bool flag = true;
		if (values.Length != 4)
		{
			return flag;
		}
		double result = 0.0;
		double result2 = 0.0;
		bool result3 = false;
		bool result4 = false;
		if ((1u & (double.TryParse(values[0].ToString(), out result) ? 1u : 0u) & (double.TryParse(values[1].ToString(), out result2) ? 1u : 0u) & (bool.TryParse(values[2].ToString(), out result3) ? 1u : 0u) & (bool.TryParse(values[3].ToString(), out result4) ? 1u : 0u)) == 0)
		{
			return flag;
		}
		return IsTickEnabled(result, result2, result3, result4);
	}

	public static bool IsTickEnabled(double tickValue, double sliderValue, bool isSelectionRangeEnabled, bool isEnabled)
	{
		if (isEnabled)
		{
			if (!(sliderValue >= tickValue && isSelectionRangeEnabled))
			{
				if (sliderValue == tickValue)
				{
					return !isSelectionRangeEnabled;
				}
				return false;
			}
			return true;
		}
		return false;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
