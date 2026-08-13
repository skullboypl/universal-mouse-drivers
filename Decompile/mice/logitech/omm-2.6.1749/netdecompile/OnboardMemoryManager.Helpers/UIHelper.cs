using System.Windows;
using System.Windows.Media;

namespace OnboardMemoryManager.Helpers;

public static class UIHelper
{
	public static T FindChild<T>(DependencyObject parent, string childName) where T : DependencyObject
	{
		if (parent == null)
		{
			return null;
		}
		T val = null;
		int childrenCount = VisualTreeHelper.GetChildrenCount(parent);
		for (int i = 0; i < childrenCount; i++)
		{
			DependencyObject child = VisualTreeHelper.GetChild(parent, i);
			if (child as T == null)
			{
				val = FindChild<T>(child, childName);
				if (val != null)
				{
					break;
				}
				continue;
			}
			if (!string.IsNullOrEmpty(childName))
			{
				if (child is FrameworkElement frameworkElement && frameworkElement.Name == childName)
				{
					val = (T)child;
					break;
				}
				continue;
			}
			val = (T)child;
			break;
		}
		return val;
	}
}
