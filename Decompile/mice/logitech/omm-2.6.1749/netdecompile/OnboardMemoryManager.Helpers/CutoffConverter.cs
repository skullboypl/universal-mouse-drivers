using System;
using System.Globalization;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class CutoffConverter : IValueConverter
{
	public int Cutoff { get; set; }

	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return (int)value > Cutoff;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
