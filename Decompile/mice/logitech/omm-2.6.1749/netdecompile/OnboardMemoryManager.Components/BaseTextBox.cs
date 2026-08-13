using System;
using System.Globalization;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;

namespace OnboardMemoryManager.Components;

public class BaseTextBox : TextBox
{
	public class PlaceholderAdorner : Adorner
	{
		public PlaceholderAdorner(BaseTextBox textBox)
			: base(textBox)
		{
			base.IsHitTestVisible = false;
		}

		protected override void OnRender(DrawingContext drawingContext)
		{
			BaseTextBox baseTextBox = (BaseTextBox)base.AdornedElement;
			string placeholder = baseTextBox.Placeholder;
			if (!string.IsNullOrEmpty(placeholder))
			{
				FormattedText formattedText = new FormattedText(placeholder, CultureInfo.CurrentCulture, baseTextBox.FlowDirection, new Typeface(baseTextBox.FontFamily, baseTextBox.FontStyle, baseTextBox.FontWeight, baseTextBox.FontStretch), baseTextBox.FontSize, new SolidColorBrush(Color.FromRgb(102, 102, 102)));
				formattedText.MaxTextWidth = Math.Max(baseTextBox.ActualWidth - baseTextBox.Padding.Left - baseTextBox.Padding.Right, 10.0);
				formattedText.MaxTextHeight = Math.Max(baseTextBox.ActualHeight, 10.0);
				Point origin = new Point(baseTextBox.Padding.Left, baseTextBox.Padding.Top);
				if (baseTextBox.Template.FindName("PART_ContentHost", baseTextBox) is FrameworkElement frameworkElement)
				{
					Point point = frameworkElement.TransformToAncestor(baseTextBox).Transform(new Point(0.0, 0.0));
					origin.X += point.X;
					origin.Y += point.Y;
					formattedText.MaxTextWidth = Math.Max(frameworkElement.ActualWidth - origin.X, 10.0);
					formattedText.MaxTextHeight = Math.Max(frameworkElement.ActualHeight, 10.0);
				}
				drawingContext.DrawText(formattedText, origin);
			}
		}
	}

	public static readonly DependencyProperty PlaceholderProperty = DependencyProperty.Register("Placeholder", typeof(string), typeof(BaseTextBox), new FrameworkPropertyMetadata(string.Empty, OnPlaceholderChanged));

	protected string CachedLastSetValue { get; set; }

	public string Placeholder
	{
		get
		{
			return (string)GetValue(PlaceholderProperty);
		}
		set
		{
			SetValue(PlaceholderProperty, value);
		}
	}

	public BaseTextBox()
	{
		base.TargetUpdated += BaseTextBox_TargetUpdated;
	}

	protected override void OnKeyUp(KeyEventArgs e)
	{
		if (e.Key == Key.Escape)
		{
			(e.Source as TextBox).Text = CachedLastSetValue;
			Keyboard.ClearFocus();
		}
		base.OnKeyUp(e);
	}

	protected override void OnLostFocus(RoutedEventArgs e)
	{
		HandleUserInput(e.Source);
		base.OnLostFocus(e);
	}

	protected virtual void HandleUserInput(object element)
	{
		if (element is TextBox { Text: var text } && text != CachedLastSetValue)
		{
			CachedLastSetValue = text;
		}
	}

	private static void OnPlaceholderChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		if (d is BaseTextBox baseTextBox && !string.IsNullOrEmpty(baseTextBox.Placeholder))
		{
			baseTextBox.IsVisibleChanged -= BaseTextBox_IsVisibleChanged;
			baseTextBox.IsVisibleChanged += BaseTextBox_IsVisibleChanged;
			if (baseTextBox.IsVisible)
			{
				BaseTextBox_IsVisibleChanged(baseTextBox, default(DependencyPropertyChangedEventArgs));
			}
		}
	}

	private static void BaseTextBox_IsVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
	{
		if (sender is BaseTextBox baseTextBox)
		{
			if (baseTextBox.IsVisible && GetOrCreateAdorner(baseTextBox, out var adorner))
			{
				adorner.Visibility = ((baseTextBox.Text.Length > 0) ? Visibility.Hidden : Visibility.Visible);
				adorner.InvalidateVisual();
				baseTextBox.TextChanged -= BaseTextBox_TextChanged;
				baseTextBox.TextChanged += BaseTextBox_TextChanged;
			}
			else if (!baseTextBox.IsVisible)
			{
				RemoveAdorner(baseTextBox);
				baseTextBox.TextChanged -= BaseTextBox_TextChanged;
			}
		}
	}

	private static void BaseTextBox_TextChanged(object sender, TextChangedEventArgs e)
	{
		if (sender is BaseTextBox baseTextBox && GetOrCreateAdorner(baseTextBox, out var adorner))
		{
			adorner.Visibility = ((baseTextBox.Text.Length > 0) ? Visibility.Hidden : Visibility.Visible);
		}
	}

	private void BaseTextBox_TargetUpdated(object sender, DataTransferEventArgs e)
	{
		if (sender is TextBox textBox)
		{
			BindingExpression bindingExpression = textBox.GetBindingExpression(TextBox.TextProperty);
			if (bindingExpression != null && bindingExpression.DataItem != null)
			{
				object value = bindingExpression.ResolvedSource.GetType().GetProperty(bindingExpression.ResolvedSourcePropertyName).GetValue(bindingExpression.ResolvedSource, null);
				CachedLastSetValue = ((value != null) ? value.ToString() : string.Empty);
			}
		}
	}

	private static bool GetOrCreateAdorner(BaseTextBox textBox, out PlaceholderAdorner adorner)
	{
		if (string.IsNullOrEmpty(textBox.Placeholder))
		{
			adorner = null;
			return false;
		}
		AdornerLayer adornerLayer = AdornerLayer.GetAdornerLayer(textBox);
		if (adornerLayer == null)
		{
			adorner = null;
			return false;
		}
		adorner = adornerLayer.GetAdorners(textBox)?.OfType<PlaceholderAdorner>().FirstOrDefault();
		if (adorner == null)
		{
			adorner = new PlaceholderAdorner(textBox);
			adornerLayer.Add(adorner);
		}
		return true;
	}

	private static void RemoveAdorner(BaseTextBox textBox)
	{
		AdornerLayer adornerLayer = AdornerLayer.GetAdornerLayer(textBox);
		if (adornerLayer == null)
		{
			return;
		}
		Adorner[] adorners = adornerLayer.GetAdorners(textBox);
		if (adorners == null)
		{
			return;
		}
		Adorner[] array = adorners;
		for (int i = 0; i < array.Length; i++)
		{
			if (array[i] is PlaceholderAdorner adorner)
			{
				adornerLayer.Remove(adorner);
			}
		}
	}
}
