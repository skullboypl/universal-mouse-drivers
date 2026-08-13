using System.Windows;
using System.Windows.Controls.Primitives;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Helpers;

public static class ContextMenuDataContextFromButtonTagBehavior
{
	public static readonly DependencyProperty EnableProperty = DependencyProperty.RegisterAttached("Enable", typeof(bool), typeof(ContextMenuDataContextFromButtonTagBehavior), new PropertyMetadata(false, OnEnableChanged));

	public static bool GetEnable(DependencyObject obj)
	{
		return (bool)obj.GetValue(EnableProperty);
	}

	public static void SetEnable(DependencyObject obj, bool value)
	{
		obj.SetValue(EnableProperty, value);
	}

	private static void OnEnableChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		if (d is ButtonBase buttonBase)
		{
			if ((bool)e.NewValue)
			{
				buttonBase.Click -= Button_Click;
				buttonBase.Click += Button_Click;
			}
			else
			{
				buttonBase.Click -= Button_Click;
			}
		}
	}

	private static void Button_Click(object sender, RoutedEventArgs e)
	{
		FrameworkElement frameworkElement = sender as FrameworkElement;
		if (frameworkElement?.ContextMenu != null && frameworkElement.Tag != null && frameworkElement.Tag is HIDProfile dataContext)
		{
			frameworkElement.ContextMenu.DataContext = dataContext;
		}
	}
}
