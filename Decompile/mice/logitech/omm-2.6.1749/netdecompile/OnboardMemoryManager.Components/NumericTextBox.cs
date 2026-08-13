using System.Linq;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Components;

public class NumericTextBox : BaseTextBox
{
	public static readonly DependencyProperty MinimumProperty = DependencyProperty.Register("Minimum", typeof(uint), typeof(NumericTextBox), new PropertyMetadata(0u));

	public static readonly DependencyProperty MaximumProperty = DependencyProperty.Register("Maximum", typeof(uint), typeof(NumericTextBox), new PropertyMetadata(uint.MaxValue));

	public static readonly DependencyProperty RoundToNearestHundredProperty = DependencyProperty.Register("RoundToNearestHundred", typeof(bool), typeof(NumericTextBox), new PropertyMetadata(false));

	public uint Minimum
	{
		get
		{
			return (uint)GetValue(MinimumProperty);
		}
		set
		{
			SetValue(MinimumProperty, value);
		}
	}

	public uint Maximum
	{
		get
		{
			return (uint)GetValue(MaximumProperty);
		}
		set
		{
			SetValue(MaximumProperty, value);
		}
	}

	public bool RoundToNearestHundred
	{
		get
		{
			return (bool)GetValue(RoundToNearestHundredProperty);
		}
		set
		{
			SetValue(RoundToNearestHundredProperty, value);
		}
	}

	protected override void HandleUserInput(object element)
	{
		if (!(element is TextBox { Text: var text } textBox))
		{
			return;
		}
		bool flag = text.Trim() == "" || text.Trim() == OnboardMemoryManager.Properties.Resources.Empty;
		uint result;
		bool flag2 = uint.TryParse(text, out result);
		bool num = text.Any(char.IsLetter);
		bool flag3 = Regex.IsMatch(text, "[^a-zA-Z0-9\\s]");
		if (num || flag3 || flag)
		{
			textBox.Text = base.CachedLastSetValue;
		}
		else if (flag2)
		{
			result = result.Clamp(Minimum, Maximum);
			uint result3;
			if (RoundToNearestHundred)
			{
				int num2 = BunnyHoppingHelper.RoundToNearestHundred(result);
				if (uint.TryParse(base.CachedLastSetValue, out var result2))
				{
					if (num2 != result2)
					{
						base.CachedLastSetValue = num2.ToString();
						textBox.Text = base.CachedLastSetValue;
					}
					else
					{
						textBox.Text = base.CachedLastSetValue;
					}
				}
				else
				{
					base.CachedLastSetValue = num2.ToString();
					textBox.Text = base.CachedLastSetValue;
				}
			}
			else if (uint.TryParse(base.CachedLastSetValue, out result3))
			{
				if (result != result3)
				{
					base.CachedLastSetValue = result.ToString();
					textBox.Text = base.CachedLastSetValue;
				}
				else
				{
					textBox.Text = base.CachedLastSetValue;
				}
			}
			else
			{
				base.CachedLastSetValue = result.ToString();
				textBox.Text = base.CachedLastSetValue;
			}
		}
		else
		{
			textBox.Text = base.CachedLastSetValue;
		}
	}
}
