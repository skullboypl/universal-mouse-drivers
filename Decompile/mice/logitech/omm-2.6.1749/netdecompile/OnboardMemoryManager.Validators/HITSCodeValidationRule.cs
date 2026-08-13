using System;
using System.Globalization;
using System.Text;
using System.Windows.Controls;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Validators;

public class HITSCodeValidationRule : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string s = value as string;
		try
		{
			byte[] bytes = Convert.FromBase64String(s);
			string text = Encoding.UTF8.GetString(bytes);
			if (string.IsNullOrEmpty(text))
			{
				return new ValidationResult(isValid: false, Resources.Code_Not_Found);
			}
			string text2 = text;
			for (int i = 0; i < text2.Length; i++)
			{
				if (!char.IsDigit(text2[i]))
				{
					return new ValidationResult(isValid: false, Resources.Code_Not_Found);
				}
			}
			return ValidationResult.ValidResult;
		}
		catch (Exception)
		{
			return new ValidationResult(isValid: false, Resources.Code_Not_Found);
		}
	}
}
