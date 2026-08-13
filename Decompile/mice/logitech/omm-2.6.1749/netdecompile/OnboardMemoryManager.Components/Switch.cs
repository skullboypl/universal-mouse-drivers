using System.Windows;
using System.Windows.Controls;

namespace OnboardMemoryManager.Components;

public class Switch : CheckBox
{
	static Switch()
	{
		FrameworkElement.DefaultStyleKeyProperty.OverrideMetadata(typeof(Switch), new FrameworkPropertyMetadata(typeof(Switch)));
	}
}
