using System.Windows;
using System.Windows.Controls;

namespace OnboardMemoryManager.Components;

public class Switch_Alt : CheckBox
{
	static Switch_Alt()
	{
		FrameworkElement.DefaultStyleKeyProperty.OverrideMetadata(typeof(Switch_Alt), new FrameworkPropertyMetadata(typeof(Switch_Alt)));
	}
}
