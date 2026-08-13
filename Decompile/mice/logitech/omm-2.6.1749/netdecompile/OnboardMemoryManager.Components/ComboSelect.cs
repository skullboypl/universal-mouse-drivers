using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager.Components;

public class ComboSelect : ComboBox
{
	private ContentPresenter Presenter { get; set; }

	static ComboSelect()
	{
		FrameworkElement.DefaultStyleKeyProperty.OverrideMetadata(typeof(ComboSelect), new FrameworkPropertyMetadata(typeof(ComboSelect)));
	}

	public ComboSelect()
	{
		base.PreviewMouseWheel += previewMouseWheel;
	}

	private static void previewMouseWheel(object sender, MouseWheelEventArgs e)
	{
		if (!e.Handled && !(sender is ComboBox { IsDropDownOpen: not false }))
		{
			e.Handled = true;
			MouseWheelEventArgs e2 = new MouseWheelEventArgs(e.MouseDevice, e.Timestamp, e.Delta);
			e2.RoutedEvent = UIElement.MouseWheelEvent;
			e2.Source = sender;
			(((Control)sender).Parent as UIElement).RaiseEvent(e2);
		}
	}

	protected override void OnPreviewKeyDown(KeyEventArgs e)
	{
		Action<FocusNavigationDirection> action = delegate(FocusNavigationDirection focusDirection)
		{
			e.Handled = true;
			TraversalRequest request = new TraversalRequest(focusDirection);
			if (Keyboard.FocusedElement is UIElement uIElement)
			{
				uIElement.MoveFocus(request);
			}
		};
		if (e.Key == Key.Down)
		{
			action(FocusNavigationDirection.Next);
		}
		else if (e.Key == Key.Up)
		{
			action(FocusNavigationDirection.Previous);
		}
		else
		{
			if (e.Key != Key.Space && e.Key != Key.Return)
			{
				return;
			}
			if (!base.IsDropDownOpen)
			{
				base.IsDropDownOpen = true;
				return;
			}
			ComboBoxItem comboBoxItem = null;
			comboBoxItem = ((!(e.OriginalSource is ComboBoxItem)) ? ComponentTreeTraversers.FindParent<ComboBoxItem>(e.OriginalSource as DependencyObject) : (e.OriginalSource as ComboBoxItem));
			if (comboBoxItem != null)
			{
				e.Handled = true;
				comboBoxItem.IsSelected = true;
				base.IsDropDownOpen = false;
			}
			else
			{
				base.OnPreviewKeyDown(e);
			}
		}
	}
}
