using System;
using System.Collections.ObjectModel;
using System.Text;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Helpers;

public class HITSCodeParser
{
	private readonly ObservableCollection<AnalogButton> _analogButtons;

	private readonly AnalogMetadata _metadata;

	public HITSCodeParser(ObservableCollection<AnalogButton> analogButtons, AnalogMetadata metadata)
	{
		if (analogButtons == null)
		{
			throw new ArgumentNullException("analogButtons");
		}
		if (metadata == null)
		{
			throw new ArgumentNullException("metadata");
		}
		_analogButtons = analogButtons;
		_metadata = metadata;
	}

	public bool TryParse(string base64Code)
	{
		try
		{
			string text = DecodeFromBase64(base64Code);
			if (text.Length != GetExpectedCodeLength())
			{
				return false;
			}
			int position = ParseVersion(text);
			position = ParseActuationPoint(text, position);
			position = ParseRapidTriggerSensitivity(text, position);
			position = ParseRapidTriggerState(text, position);
			position = ParseHapticLevel(text, position);
			return true;
		}
		catch (Exception)
		{
			return false;
		}
	}

	private static string DecodeFromBase64(string base64Code)
	{
		byte[] bytes = Convert.FromBase64String(base64Code);
		return Encoding.UTF8.GetString(bytes);
	}

	private int GetExpectedCodeLength()
	{
		return 2 + _analogButtons.Count * 2 + _analogButtons.Count * 2 + _analogButtons.Count + _analogButtons.Count * 2;
	}

	private int ParseVersion(string code)
	{
		if (int.Parse(code.Substring(0, 2)) != 0)
		{
			throw new ArgumentException();
		}
		return 2;
	}

	private int ParseActuationPoint(string code, int position)
	{
		for (int i = 0; i < _analogButtons.Count; i++)
		{
			uint num = uint.Parse(code.Substring(position, 2));
			if (num < 1 || num > _metadata.AnalogButtonLevelResolution)
			{
				throw new ArgumentException();
			}
			_analogButtons[i].ActuationPoint = (int)num;
			position += 2;
		}
		return position;
	}

	private int ParseRapidTriggerSensitivity(string code, int position)
	{
		for (int i = 0; i < _analogButtons.Count; i++)
		{
			uint num = uint.Parse(code.Substring(position, 2));
			if (num < 1 || num > _metadata.RapidTriggerSensitivityResolution)
			{
				throw new ArgumentException();
			}
			_analogButtons[i].RapidTriggerSensitivity = (int)num;
			position += 2;
		}
		return position;
	}

	private int ParseRapidTriggerState(string code, int position)
	{
		for (int i = 0; i < _analogButtons.Count; i++)
		{
			string text = code.Substring(position, 1);
			if (text != "0" && text != "1")
			{
				throw new ArgumentException();
			}
			bool isRapidTriggerEnabled = text == "1";
			_analogButtons[i].IsRapidTriggerEnabled = isRapidTriggerEnabled;
			position++;
		}
		return position;
	}

	private int ParseHapticLevel(string code, int position)
	{
		for (int i = 0; i < _analogButtons.Count; i++)
		{
			uint num = uint.Parse(code.Substring(position, 2));
			if (num < 0 || num > _metadata.HapticsResolution)
			{
				throw new ArgumentException();
			}
			_analogButtons[i].HapticLevel = (int)num;
			position += 2;
		}
		return position;
	}
}
