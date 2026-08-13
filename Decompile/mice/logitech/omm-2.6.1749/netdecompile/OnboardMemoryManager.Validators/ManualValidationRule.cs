using System.Globalization;
using System.Windows.Controls;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Validators;

public class ManualValidationRule : ValidationRule
{
	public ManualValidationWrapper ErrorWrapper { get; set; }

	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (ErrorWrapper != null && ErrorWrapper.HasError)
		{
			return new ValidationResult(isValid: false, Resources.Code_Not_Found);
		}
		return ValidationResult.ValidResult;
	}
}
