using System;
using System.Collections.ObjectModel;
using System.Text;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Helpers;

public class HITSCodeGenerator
{
	private readonly ObservableCollection<AnalogButton> _analogButtons;

	public HITSCodeGenerator(ObservableCollection<AnalogButton> analogButtons)
	{
		if (analogButtons == null)
		{
			throw new ArgumentNullException("analogButtons");
		}
		_analogButtons = analogButtons;
	}

	public string Generate()
	{
		return EncodeToBase64(0.ToString().PadLeft(2, '0') + GenerateActuationPointCode() + GenerateRapidTriggerSensitivityCode() + GenerateRapidTriggerStateCode() + GenerateHapticLevelCode());
	}

	private static string EncodeToBase64(string code)
	{
		return Convert.ToBase64String(Encoding.UTF8.GetBytes(code));
	}

	private string GenerateActuationPointCode()
	{
		StringBuilder stringBuilder = new StringBuilder();
		foreach (AnalogButton analogButton in _analogButtons)
		{
			stringBuilder.Append(analogButton.ActuationPoint.ToString().PadLeft(2, '0'));
		}
		return stringBuilder.ToString();
	}

	private string GenerateRapidTriggerSensitivityCode()
	{
		StringBuilder stringBuilder = new StringBuilder();
		foreach (AnalogButton analogButton in _analogButtons)
		{
			stringBuilder.Append(analogButton.RapidTriggerSensitivity.ToString().PadLeft(2, '0'));
		}
		return stringBuilder.ToString();
	}

	private string GenerateRapidTriggerStateCode()
	{
		StringBuilder stringBuilder = new StringBuilder();
		foreach (AnalogButton analogButton in _analogButtons)
		{
			stringBuilder.Append(Convert.ToInt32(analogButton.IsRapidTriggerEnabled).ToString());
		}
		return stringBuilder.ToString();
	}

	private string GenerateHapticLevelCode()
	{
		StringBuilder stringBuilder = new StringBuilder();
		foreach (AnalogButton analogButton in _analogButtons)
		{
			stringBuilder.Append(analogButton.HapticLevel.ToString().PadLeft(2, '0'));
		}
		return stringBuilder.ToString();
	}
}
