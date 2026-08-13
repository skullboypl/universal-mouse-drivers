using System.Windows;

namespace OnboardMemoryManager.Validators;

public class ManualValidationWrapper : Freezable
{
	public static readonly DependencyProperty HasErrorProperty = DependencyProperty.Register("HasError", typeof(bool), typeof(ManualValidationWrapper), new PropertyMetadata(false));

	public bool HasError
	{
		get
		{
			return (bool)GetValue(HasErrorProperty);
		}
		set
		{
			SetValue(HasErrorProperty, value);
		}
	}

	protected override Freezable CreateInstanceCore()
	{
		return new ManualValidationWrapper();
	}
}
