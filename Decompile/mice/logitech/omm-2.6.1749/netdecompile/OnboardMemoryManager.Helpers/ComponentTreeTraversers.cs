using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Media;

namespace OnboardMemoryManager.Helpers;

public static class ComponentTreeTraversers
{
	public static T FindParent<T>(DependencyObject child) where T : DependencyObject
	{
		DependencyObject parent = VisualTreeHelper.GetParent(child);
		if (parent == null)
		{
			return null;
		}
		if (parent is T result)
		{
			return result;
		}
		return FindParent<T>(parent);
	}

	public static List<childItem> FindVisualChildren<childItem>(DependencyObject obj) where childItem : DependencyObject
	{
		List<childItem> list = new List<childItem>();
		for (int i = 0; i < VisualTreeHelper.GetChildrenCount(obj); i++)
		{
			DependencyObject child = VisualTreeHelper.GetChild(obj, i);
			if (child != null && child is childItem)
			{
				list.Add((childItem)child);
				continue;
			}
			List<childItem> second = FindVisualChildren<childItem>(child);
			list = list.Concat(second).ToList();
		}
		return list;
	}

	public static childItem FindVisualChild<childItem>(DependencyObject obj) where childItem : DependencyObject
	{
		for (int i = 0; i < VisualTreeHelper.GetChildrenCount(obj); i++)
		{
			DependencyObject child = VisualTreeHelper.GetChild(obj, i);
			if (child != null && child is childItem)
			{
				return (childItem)child;
			}
			childItem val = FindVisualChild<childItem>(child);
			if (val != null)
			{
				return val;
			}
		}
		return null;
	}
}
