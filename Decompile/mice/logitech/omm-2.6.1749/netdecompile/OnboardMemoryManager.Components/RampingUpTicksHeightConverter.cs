using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Components;

public class RampingUpTicksHeightConverter : IMultiValueConverter
{
	private const int expectedValuesLength = 7;

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		double num = 16.0;
		if (values.Length != 7)
		{
			return num;
		}
		double result = num;
		bool result2 = false;
		double result3 = 0.0;
		double result4 = 0.0;
		double result5 = 0.0;
		double result6 = 0.0;
		double result7 = 0.0;
		if ((1u & (double.TryParse(values[0].ToString(), out result) ? 1u : 0u) & (bool.TryParse(values[1].ToString(), out result2) ? 1u : 0u) & (double.TryParse(values[2].ToString(), out result3) ? 1u : 0u) & (double.TryParse(values[3].ToString(), out result4) ? 1u : 0u) & (double.TryParse(values[4].ToString(), out result5) ? 1u : 0u) & (double.TryParse(values[5].ToString(), out result6) ? 1u : 0u) & (double.TryParse(values[6].ToString(), out result7) ? 1u : 0u)) == 0)
		{
			return num;
		}
		num = result;
		if (result2)
		{
			double num2 = (result3 - result4) / (result5 - result4);
			num = result6 + (result7 - result6) * num2;
		}
		return num;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
