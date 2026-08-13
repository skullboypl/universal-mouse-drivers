using System;
using System.Globalization;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Data;

namespace OnboardMemoryManager.Components;

public class TickVisibilityConverter : IMultiValueConverter
{
	private const int expectedValuesLength = 6;

	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		Visibility visibility = Visibility.Visible;
		if (values.Length != 6)
		{
			return visibility;
		}
		double result = 0.0;
		double result2 = 0.0;
		bool result3 = true;
		bool result4 = true;
		TickPlacement tickPlacement = TickPlacement.None;
		bool result5 = true;
		bool flag = true;
		flag &= double.TryParse(values[0].ToString(), out result);
		flag &= double.TryParse(values[1].ToString(), out result2);
		flag &= bool.TryParse(values[2].ToString(), out result3);
		flag &= bool.TryParse(values[3].ToString(), out result4);
		flag &= bool.TryParse(values[5].ToString(), out result5);
		if (values[4] is TickPlacement)
		{
			tickPlacement = (TickPlacement)values[4];
		}
		else
		{
			flag = false;
		}
		if (!flag)
		{
			return visibility;
		}
		if (!IsTickEnabledConverter.IsTickEnabled(result, result2, result3, result4) && tickPlacement == TickPlacement.None)
		{
			visibility = Visibility.Hidden;
		}
		return visibility;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
