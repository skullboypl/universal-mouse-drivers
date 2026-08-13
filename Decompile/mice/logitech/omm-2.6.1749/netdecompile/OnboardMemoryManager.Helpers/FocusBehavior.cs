using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace OnboardMemoryManager.Helpers;

public static class FocusBehavior
{
	public static readonly DependencyProperty ClearFocusOnClickProperty = DependencyProperty.RegisterAttached("ClearFocusOnClick", typeof(bool), typeof(FocusBehavior), new UIPropertyMetadata(false, OnClearFocusOnClickChanged));

	public static bool GetClearFocusOnClick(DependencyObject obj)
	{
		return (bool)obj.GetValue(ClearFocusOnClickProperty);
	}

	public static void SetClearFocusOnClick(DependencyObject obj, bool value)
	{
		obj.SetValue(ClearFocusOnClickProperty, value);
	}

	private static void OnClearFocusOnClickChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		if (d is UIElement uIElement)
		{
			if ((bool)e.NewValue)
			{
				uIElement.PreviewMouseDown += Element_PreviewMouseDown;
			}
			else
			{
				uIElement.PreviewMouseDown -= Element_PreviewMouseDown;
			}
		}
	}

	private static void Element_PreviewMouseDown(object sender, MouseButtonEventArgs e)
	{
		if (!(e.OriginalSource is TextBox))
		{
			if (sender is UIElement { Focusable: not false } uIElement)
			{
				uIElement.Focus();
			}
			else
			{
				Keyboard.ClearFocus();
			}
		}
	}
}
