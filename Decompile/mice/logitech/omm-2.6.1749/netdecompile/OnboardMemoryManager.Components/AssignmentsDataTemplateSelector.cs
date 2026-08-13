using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Components;

public class AssignmentsDataTemplateSelector : DataTemplateSelector
{
	public override DataTemplate SelectTemplate(object item, DependencyObject container)
	{
		//IL_0063: Unknown result type (might be due to invalid IL or missing references)
		//IL_006d: Invalid comparison between Unknown and I4
		//IL_0075: Unknown result type (might be due to invalid IL or missing references)
		//IL_007b: Invalid comparison between Unknown and I4
		if (!(container is FrameworkElement frameworkElement))
		{
			return null;
		}
		DependencyObject dependencyObject = container;
		while (dependencyObject != null && !(dependencyObject is ComboBoxItem) && !(dependencyObject is ComboBox))
		{
			dependencyObject = VisualTreeHelper.GetParent(dependencyObject);
		}
		if (item is ComboSelectItemSeparator)
		{
			return frameworkElement.FindResource("AssignmentsDividerTemplate") as DataTemplate;
		}
		if (item is Action || item is HIDAction)
		{
			if (item is HIDAction hIDAction && (int)hIDAction.Macro.button_behavior == 128 && (int)hIDAction.Macro.remapping_opcode == 2)
			{
				return frameworkElement.FindResource("AssignmentHIDActionStandardKeyTemplate") as DataTemplate;
			}
			return frameworkElement.FindResource("AssignmentsHidActionTemplate") as DataTemplate;
		}
		return null;
	}
}
