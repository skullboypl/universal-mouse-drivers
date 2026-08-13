using System;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;

namespace OnboardMemoryManager.Components;

public class AdvancedTickSlider : Slider
{
	public static readonly DependencyProperty IsAdditionalThumbVisibleProperty = DependencyProperty.Register("IsAdditionalThumbVisible", typeof(bool), typeof(AdvancedTickSlider), new PropertyMetadata(true));

	public static readonly DependencyProperty AreTicksRampingUpProperty = DependencyProperty.Register("AreTicksRampingUp", typeof(bool), typeof(AdvancedTickSlider), new PropertyMetadata(false));

	public ObservableCollection<TickViewmodel> CustomTicks { get; private set; }

	public bool IsAdditionalThumbVisible
	{
		get
		{
			return (bool)GetValue(IsAdditionalThumbVisibleProperty);
		}
		set
		{
			SetValue(IsAdditionalThumbVisibleProperty, value);
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

	public AdvancedTickSlider()
	{
		CustomTicks = new ObservableCollection<TickViewmodel>();
		base.Loaded += delegate
		{
			CreateTicks();
		};
	}

	protected override void OnPropertyChanged(DependencyPropertyChangedEventArgs e)
	{
		base.OnPropertyChanged(e);
		if (base.IsLoaded && (e.Property == Slider.TickFrequencyProperty || e.Property == RangeBase.MinimumProperty || e.Property == RangeBase.MaximumProperty))
		{
			CreateTicks();
		}
	}

	protected void CreateTicks()
	{
		double minimum = base.Minimum;
		double maximum = base.Maximum;
		double num = ((base.TickFrequency > 0.0) ? base.TickFrequency : 1.0);
		int num2 = (int)Math.Round((maximum - minimum) / num);
		if (CustomTicks.Count != num2)
		{
			CustomTicks.Clear();
			for (int i = 0; i < num2; i++)
			{
				double representedValue = minimum + (double)(i + 1) * num;
				CustomTicks.Add(new TickViewmodel
				{
					RepresentedValue = representedValue
				});
			}
		}
	}
}
