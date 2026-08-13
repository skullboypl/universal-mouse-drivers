using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Threading;

namespace Logitech.ComponentModel;

public class ObservableObject : INotifyPropertyChanged
{
	public static Dispatcher Dispatcher { get; set; }

	protected virtual bool ShouldThrowOnInvalidPropertyName => false;

	protected virtual bool ShouldVerifyPropertyName => true;

	public event PropertyChangedEventHandler PropertyChanged;

	[Conditional("DEBUG")]
	public void VerifyPropertyName(string propertyName)
	{
		if (GetType().GetRuntimeProperty(propertyName) == null)
		{
			string message = "Invalid property name: " + propertyName;
			if (ShouldThrowOnInvalidPropertyName)
			{
				throw new Exception(message);
			}
		}
	}

	protected internal virtual void OnPropertyChanged(PropertyChangedEventArgs e)
	{
		_ = ShouldVerifyPropertyName;
		if (this.PropertyChanged == null)
		{
			return;
		}
		Dispatcher dispatcher = Dispatcher;
		if (dispatcher != null)
		{
			PropertyChangedEventHandler propertyChangedCopy = (PropertyChangedEventHandler)this.PropertyChanged.Clone();
			dispatcher.InvokeAsync(delegate
			{
				propertyChangedCopy(this, e);
			});
		}
		else
		{
			this.PropertyChanged(this, e);
		}
	}

	protected internal virtual void OnPropertyChanged(params string[] propertyNames)
	{
		if (this.PropertyChanged != null)
		{
			foreach (string propertyName in propertyNames)
			{
				OnPropertyChanged(new PropertyChangedEventArgs(propertyName));
			}
		}
	}
}
