using System.ComponentModel;

namespace Logitech.ComponentModel;

public class PropertyValueChangedEventArgs<T> : PropertyChangedEventArgs
{
	public T OldValue { get; private set; }

	public T NewValue { get; private set; }

	public PropertyValueChangedEventArgs(string propertyName, T oldValue, T newValue)
		: base(propertyName)
	{
		OldValue = oldValue;
		NewValue = newValue;
	}
}
