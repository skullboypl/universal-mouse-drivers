using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;

namespace OnboardMemoryManager.Components;

public class AlignableWrapPanel : Panel
{
	public static readonly DependencyProperty HorizontalContentAlignmentProperty = DependencyProperty.Register("HorizontalContentAlignment", typeof(HorizontalAlignment), typeof(AlignableWrapPanel), new FrameworkPropertyMetadata(HorizontalAlignment.Left, FrameworkPropertyMetadataOptions.AffectsArrange));

	public HorizontalAlignment HorizontalContentAlignment
	{
		get
		{
			return (HorizontalAlignment)GetValue(HorizontalContentAlignmentProperty);
		}
		set
		{
			SetValue(HorizontalContentAlignmentProperty, value);
		}
	}

	protected override Size MeasureOverride(Size constraint)
	{
		Size size = default(Size);
		Size result = default(Size);
		UIElementCollection internalChildren = base.InternalChildren;
		for (int i = 0; i < internalChildren.Count; i++)
		{
			UIElement uIElement = internalChildren[i];
			uIElement.Measure(constraint);
			Size desiredSize = uIElement.DesiredSize;
			if (size.Width + desiredSize.Width > constraint.Width)
			{
				result.Width = Math.Max(size.Width, result.Width);
				result.Height += size.Height;
				size = desiredSize;
				if (desiredSize.Width > constraint.Width)
				{
					result.Width = Math.Max(desiredSize.Width, result.Width);
					result.Height += desiredSize.Height;
					size = default(Size);
				}
			}
			else
			{
				size.Width += desiredSize.Width;
				size.Height = Math.Max(desiredSize.Height, size.Height);
			}
		}
		result.Width = Math.Max(size.Width, result.Width);
		result.Height += size.Height;
		return result;
	}

	protected override Size ArrangeOverride(Size arrangeBounds)
	{
		int num = 0;
		Size lineSize = default(Size);
		double num2 = 0.0;
		UIElementCollection internalChildren = base.InternalChildren;
		for (int i = 0; i < internalChildren.Count; i++)
		{
			Size desiredSize = internalChildren[i].DesiredSize;
			if (lineSize.Width + desiredSize.Width > arrangeBounds.Width)
			{
				ArrangeLine(num2, lineSize, arrangeBounds.Width, num, i);
				num2 += lineSize.Height;
				lineSize = desiredSize;
				if (desiredSize.Width > arrangeBounds.Width)
				{
					ArrangeLine(num2, desiredSize, arrangeBounds.Width, i, ++i);
					num2 += desiredSize.Height;
					lineSize = default(Size);
				}
				num = i;
			}
			else
			{
				lineSize.Width += desiredSize.Width;
				lineSize.Height = Math.Max(desiredSize.Height, lineSize.Height);
			}
		}
		if (num < internalChildren.Count)
		{
			ArrangeLine(num2, lineSize, arrangeBounds.Width, num, internalChildren.Count);
		}
		return arrangeBounds;
	}

	private void ArrangeLine(double y, Size lineSize, double boundsWidth, int start, int end)
	{
		UIElementCollection internalChildren = base.InternalChildren;
		Dictionary<HorizontalAlignment, List<UIElement>> dictionary = new Dictionary<HorizontalAlignment, List<UIElement>>
		{
			{
				HorizontalAlignment.Left,
				new List<UIElement>()
			},
			{
				HorizontalAlignment.Center,
				new List<UIElement>()
			},
			{
				HorizontalAlignment.Right,
				new List<UIElement>()
			}
		};
		for (int i = start; i < end; i++)
		{
			UIElement uIElement = internalChildren[i];
			HorizontalAlignment horizontalAlignment = HorizontalContentAlignment;
			if (uIElement is FrameworkElement frameworkElement)
			{
				horizontalAlignment = frameworkElement.HorizontalAlignment;
			}
			if (horizontalAlignment == HorizontalAlignment.Stretch)
			{
				throw new InvalidOperationException(HorizontalAlignment.Stretch.ToString() + " horizontal alignment isn't supported.");
			}
			dictionary[horizontalAlignment].Add(uIElement);
		}
		double num = (boundsWidth - lineSize.Width) / 2.0;
		double num2 = 0.0;
		HorizontalAlignment[] array = new HorizontalAlignment[3]
		{
			HorizontalAlignment.Left,
			HorizontalAlignment.Center,
			HorizontalAlignment.Right
		};
		foreach (HorizontalAlignment key in array)
		{
			foreach (UIElement item in dictionary[key])
			{
				item.Arrange(new Rect(num2, y, item.DesiredSize.Width, lineSize.Height));
				num2 += item.DesiredSize.Width;
			}
			num2 += num;
		}
	}
}
