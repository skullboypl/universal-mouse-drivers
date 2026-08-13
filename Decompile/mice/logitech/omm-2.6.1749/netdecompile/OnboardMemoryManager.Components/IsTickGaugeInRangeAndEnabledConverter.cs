using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Components;

public class IsTickGaugeInRangeAndEnabledConverter : IMultiValueConverter
{
	private const int expectedValuesLenght = 3;

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		bool flag = true;
		if (values.Length != 3)
		{
			return flag;
		}
		bool result = false;
		double result2 = 0.0;
		double result3 = 0.0;
		if ((1u & (bool.TryParse(values[0].ToString(), out result) ? 1u : 0u) & (double.TryParse(values[1].ToString(), out result2) ? 1u : 0u) & (double.TryParse(values[2].ToString(), out result3) ? 1u : 0u)) == 0)
		{
			return flag;
		}
		return result && result3 >= result2;
	}

	public static bool IsTickEnabled(int tickValue, int sliderValue, bool isSelectionRangeEnabled, bool isEnabled)
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
