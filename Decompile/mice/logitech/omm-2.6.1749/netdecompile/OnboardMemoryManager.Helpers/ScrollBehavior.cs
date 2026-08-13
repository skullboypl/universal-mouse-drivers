using System.Windows;

namespace OnboardMemoryManager.Helpers;

public static class ScrollBehavior
{
	public static readonly DependencyProperty PreventBringIntoViewProperty = DependencyProperty.RegisterAttached("PreventBringIntoView", typeof(bool), typeof(ScrollBehavior), new PropertyMetadata(false, OnPreventBringIntoViewChanged));

	public static bool GetPreventBringIntoView(DependencyObject obj)
	{
		return (bool)obj.GetValue(PreventBringIntoViewProperty);
	}

	public static void SetPreventBringIntoView(DependencyObject obj, bool value)
	{
		obj.SetValue(PreventBringIntoViewProperty, value);
	}

	private static void OnPreventBringIntoViewChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		if (d is FrameworkElement frameworkElement)
		{
			if ((bool)e.NewValue)
			{
				frameworkElement.RequestBringIntoView += OnRequestBringIntoView;
			}
			else
			{
				frameworkElement.RequestBringIntoView -= OnRequestBringIntoView;
			}
		}
	}

	private static void OnRequestBringIntoView(object sender, RequestBringIntoViewEventArgs e)
	{
		e.Handled = true;
	}
}
