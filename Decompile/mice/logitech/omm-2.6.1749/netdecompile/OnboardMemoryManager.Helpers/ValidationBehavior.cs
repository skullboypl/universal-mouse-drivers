using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;

namespace OnboardMemoryManager.Helpers;

public static class ValidationBehavior
{
	public static readonly DependencyProperty ValidateOnPropertyChangedProperty = DependencyProperty.RegisterAttached("ValidateOnPropertyChanged", typeof(object), typeof(ValidationBehavior), new PropertyMetadata(null, OnValidateOnPropertyChangedChanged));

	public static readonly DependencyProperty HasTextPropertyProperty = DependencyProperty.RegisterAttached("HasTextProperty", typeof(string), typeof(ValidationBehavior), new PropertyMetadata(null));

	public static readonly DependencyProperty HasValidationErrorPropertyProperty = DependencyProperty.RegisterAttached("HasValidationErrorProperty", typeof(string), typeof(ValidationBehavior), new PropertyMetadata(null));

	public static object GetValidateOnPropertyChanged(DependencyObject obj)
	{
		return obj.GetValue(ValidateOnPropertyChangedProperty);
	}

	public static void SetValidateOnPropertyChanged(DependencyObject obj, object value)
	{
		obj.SetValue(ValidateOnPropertyChangedProperty, value);
	}

	public static string GetHasTextProperty(DependencyObject obj)
	{
		return (string)obj.GetValue(HasTextPropertyProperty);
	}

	public static void SetHasTextProperty(DependencyObject obj, string value)
	{
		obj.SetValue(HasTextPropertyProperty, value);
	}

	public static string GetHasValidationErrorProperty(DependencyObject obj)
	{
		return (string)obj.GetValue(HasValidationErrorPropertyProperty);
	}

	public static void SetHasValidationErrorProperty(DependencyObject obj, string value)
	{
		obj.SetValue(HasValidationErrorPropertyProperty, value);
	}

	private static void OnValidateOnPropertyChangedChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		if (d is TextBox textBox)
		{
			textBox.TextChanged -= TextBox_TextChanged;
			textBox.TextChanged += TextBox_TextChanged;
			if (TriggerValidation(textBox) && textBox.DataContext != null)
			{
				bool hasError = Validation.GetHasError(textBox);
				UpdateHasValidationErrorProperty(textBox, hasError);
			}
		}
	}

	private static void TextBox_TextChanged(object sender, TextChangedEventArgs e)
	{
		if (sender is TextBox textBox)
		{
			ClearValidationErrors(textBox);
			if (textBox.DataContext != null)
			{
				UpdateHasTextProperty(textBox);
				UpdateHasValidationErrorProperty(textBox, hasError: false);
			}
		}
	}

	private static void UpdateHasTextProperty(TextBox textBox)
	{
		string hasTextProperty = GetHasTextProperty(textBox);
		if (!string.IsNullOrEmpty(hasTextProperty))
		{
			PropertyInfo property = textBox.DataContext.GetType().GetProperty(hasTextProperty);
			if (!(property == null) && property.CanWrite)
			{
				bool flag = !string.IsNullOrWhiteSpace(textBox.Text);
				property.SetValue(textBox.DataContext, flag);
			}
		}
	}

	private static void UpdateHasValidationErrorProperty(TextBox textBox, bool hasError)
	{
		string hasValidationErrorProperty = GetHasValidationErrorProperty(textBox);
		if (!string.IsNullOrEmpty(hasValidationErrorProperty))
		{
			PropertyInfo property = textBox.DataContext.GetType().GetProperty(hasValidationErrorProperty);
			if (!(property == null) && property.CanWrite)
			{
				property.SetValue(textBox.DataContext, hasError);
			}
		}
	}

	private static bool TriggerValidation(TextBox textBox)
	{
		BindingExpression bindingExpression = textBox.GetBindingExpression(TextBox.TextProperty);
		if (bindingExpression == null)
		{
			return false;
		}
		bindingExpression.UpdateSource();
		return true;
	}

	private static void ClearValidationErrors(TextBox textBox)
	{
		BindingExpression bindingExpression = textBox.GetBindingExpression(TextBox.TextProperty);
		if (bindingExpression != null)
		{
			Validation.ClearInvalid(bindingExpression);
		}
	}
}
