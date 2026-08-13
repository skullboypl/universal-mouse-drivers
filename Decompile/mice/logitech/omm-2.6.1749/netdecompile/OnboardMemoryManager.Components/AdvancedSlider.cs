using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager.Components;

public class AdvancedSlider : Slider
{
	public static readonly DependencyProperty HasToggleableStateProperty = DependencyProperty.Register("HasToggleableState", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(true));

	public static readonly DependencyProperty ToggleableStateProperty = DependencyProperty.Register("ToggleableState", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(true));

	public static readonly DependencyProperty HasGaugeProperty = DependencyProperty.Register("HasGauge", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(true));

	public static readonly DependencyProperty GaugeValueProperty = DependencyProperty.Register("GaugeValue", typeof(double), typeof(AdvancedSlider), new PropertyMetadata(0.0));

	public static readonly DependencyProperty AreTicksRampingUpProperty = DependencyProperty.Register("AreTicksRampingUp", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(false));

	public static readonly DependencyProperty IsRangeLabeledProperty = DependencyProperty.Register("IsRangeLabeled", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(true));

	public static readonly DependencyProperty SliderLabelProperty = DependencyProperty.Register("SliderLabel", typeof(string), typeof(AdvancedSlider), new PropertyMetadata("Element Name"));

	public static readonly DependencyProperty MinimumLabelProperty = DependencyProperty.Register("MinimumLabel", typeof(string), typeof(AdvancedSlider), new PropertyMetadata("Min"));

	public static readonly DependencyProperty MaximumLabelProperty = DependencyProperty.Register("MaximumLabel", typeof(string), typeof(AdvancedSlider), new PropertyMetadata("Max"));

	public static readonly DependencyProperty MinimumValueDisplayOverrideProperty = DependencyProperty.Register("MinimumValueDisplayOverride", typeof(string), typeof(AdvancedSlider), new PropertyMetadata(""));

	public static readonly DependencyProperty IsAdvancedProperty = DependencyProperty.Register("IsAdvanced", typeof(bool), typeof(AdvancedSlider), new PropertyMetadata(OnIsAdvancedPropertyChanged));

	public bool HasToggleableState
	{
		get
		{
			return (bool)GetValue(HasToggleableStateProperty);
		}
		set
		{
			SetValue(HasToggleableStateProperty, value);
		}
	}

	public bool ToggleableState
	{
		get
		{
			return (bool)GetValue(ToggleableStateProperty);
		}
		set
		{
			SetValue(ToggleableStateProperty, value);
		}
	}

	public bool HasGauge
	{
		get
		{
			return (bool)GetValue(HasGaugeProperty);
		}
		set
		{
			SetValue(HasGaugeProperty, value);
		}
	}

	public double GaugeValue
	{
		get
		{
			return (double)GetValue(GaugeValueProperty);
		}
		set
		{
			SetValue(GaugeValueProperty, value);
		}
	}

	public bool AreTicksRampingUp
	{
		get
		{
			return (bool)GetValue(AreTicksRampingUpProperty);
		}
		set
		{
			SetValue(AreTicksRampingUpProperty, value);
		}
	}

	public bool IsRangeLabeled
	{
		get
		{
			return (bool)GetValue(IsRangeLabeledProperty);
		}
		set
		{
			SetValue(IsRangeLabeledProperty, value);
		}
	}

	public string SliderLabel
	{
		get
		{
			return (string)GetValue(SliderLabelProperty);
		}
		set
		{
			SetValue(SliderLabelProperty, value);
		}
	}

	public string MinimumLabel
	{
		get
		{
			return (string)GetValue(MinimumLabelProperty);
		}
		set
		{
			SetValue(MinimumLabelProperty, value);
		}
	}

	public string MinimumValueDisplayOverride
	{
		get
		{
			return (string)GetValue(MinimumValueDisplayOverrideProperty);
		}
		set
		{
			SetValue(MinimumValueDisplayOverrideProperty, value);
		}
	}

	public string MaximumLabel
	{
		get
		{
			return (string)GetValue(MaximumLabelProperty);
		}
		set
		{
			SetValue(MaximumLabelProperty, value);
		}
	}

	public bool IsAdvanced
	{
		get
		{
			return (bool)GetValue(IsAdvancedProperty);
		}
		set
		{
			SetValue(IsAdvancedProperty, value);
		}
	}

	public override void OnApplyTemplate()
	{
		base.OnApplyTemplate();
		MinimumValueDisplayOverrideConverter converter = new MinimumValueDisplayOverrideConverter();
		MultiBinding multiBinding = new MultiBinding
		{
			Converter = converter,
			Mode = BindingMode.TwoWay
		};
		multiBinding.Bindings.Add(new Binding("MinimumValueDisplayOverride")
		{
			Source = this
		});
		multiBinding.Bindings.Add(new Binding("Minimum")
		{
			Source = this
		});
		multiBinding.Bindings.Add(new Binding("Value")
		{
			Source = this
		});
		if (GetTemplateChild("CustomSliderPercentageTextBox") is TextBox textBox)
		{
			textBox.SetBinding(TextBox.TextProperty, multiBinding);
		}
	}

	private static void OnIsAdvancedPropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		(sender as AdvancedSlider).IsAdvanced = (bool)e.NewValue;
	}
}
