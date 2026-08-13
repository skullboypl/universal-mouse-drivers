using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public class ValueConverterGroup : List<IValueConverter>, IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return this.Aggregate(value, (object current, IValueConverter converter) => converter.Convert(current, targetType, parameter, culture));
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
