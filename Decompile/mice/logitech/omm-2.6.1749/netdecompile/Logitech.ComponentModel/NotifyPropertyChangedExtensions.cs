using System;
using System.ComponentModel;

namespace Logitech.ComponentModel;

public static class NotifyPropertyChangedExtensions
{
	public static void OnPropertyChanged(this INotifyPropertyChanged observableObject, PropertyChangedEventArgs e)
	{
		if (observableObject is ObservableObject)
		{
			(observableObject as ObservableObject).OnPropertyChanged(e);
			return;
		}
		throw new NotSupportedException();
	}

	public static void OnPropertyChanged(this INotifyPropertyChanged observableObject, params string[] propertyNames)
	{
		if (observableObject is ObservableObject)
		{
			(observableObject as ObservableObject).OnPropertyChanged(propertyNames);
			return;
		}
		throw new NotSupportedException();
	}
}
