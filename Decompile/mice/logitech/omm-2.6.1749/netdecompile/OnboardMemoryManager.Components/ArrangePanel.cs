using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager.Components;

public class ArrangePanel : Panel
{
	private UIElement _draggingObject;

	private Vector _delta;

	private Point _startPosition;

	private readonly ILayoutStrategy _strategy = new TableLayoutStrategy();

	public static readonly DependencyProperty DraggableProperty;

	public static readonly DependencyProperty OrderProperty;

	public static readonly DependencyProperty PositionProperty;

	public static readonly DependencyProperty DesiredPositionProperty;

	private Size[] _measures;

	public bool Draggable
	{
		get
		{
			return (bool)GetValue(DraggableProperty);
		}
		set
		{
			SetValue(DraggableProperty, value);
		}
	}

	protected override void OnPreviewMouseLeftButtonDown(MouseButtonEventArgs e)
	{
		if (Draggable)
		{
			StartReordering(e);
		}
	}

	protected override void OnMouseLeftButtonUp(MouseButtonEventArgs e)
	{
		StopReordering();
	}

	protected override void OnMouseMove(MouseEventArgs e)
	{
		if (_draggingObject != null)
		{
			if (e.LeftButton == MouseButtonState.Released)
			{
				StopReordering();
			}
			else
			{
				DoReordering(e);
			}
		}
	}

	protected override void OnMouseLeave(MouseEventArgs e)
	{
		StopReordering();
		base.OnMouseLeave(e);
	}

	private void StartReordering(MouseEventArgs e)
	{
		_startPosition = e.GetPosition(this);
		_draggingObject = GetMyChildOfUiElement((UIElement)e.OriginalSource);
		_draggingObject.SetValue(Panel.ZIndexProperty, 100);
		Rect position = GetPosition(_draggingObject);
		_delta = position.TopLeft - _startPosition;
		_draggingObject.BeginAnimation(PositionProperty, null);
		SetPosition(_draggingObject, position);
	}

	private void DoReordering(MouseEventArgs e)
	{
		e.Handled = true;
		Point position = e.GetPosition(this);
		int index = _strategy.GetIndex(position);
		SetOrder(_draggingObject, index);
		Point location = position + _delta;
		Rect value = new Rect(location, GetPosition(_draggingObject).Size);
		SetPosition(_draggingObject, value);
	}

	private void StopReordering()
	{
		if (_draggingObject != null)
		{
			_draggingObject.ClearValue(Panel.ZIndexProperty);
			InvalidateMeasure();
			AnimateToPosition(_draggingObject, GetDesiredPosition(_draggingObject));
			_draggingObject = null;
		}
	}

	private UIElement GetMyChildOfUiElement(UIElement e)
	{
		UIElement uIElement = e;
		UIElement uIElement2 = (UIElement)VisualTreeHelper.GetParent(uIElement);
		while (uIElement2 != null && uIElement2 != this)
		{
			uIElement = uIElement2;
			uIElement2 = (UIElement)VisualTreeHelper.GetParent(uIElement);
		}
		return uIElement;
	}

	protected override Size MeasureOverride(Size availableSize)
	{
		InitializeEmptyOrder();
		if (_draggingObject != null)
		{
			ReorderOthers();
		}
		Size[] sizes = MeasureChildren();
		_strategy.Calculate(availableSize, sizes);
		int num = -1;
		foreach (UIElement item in base.Children.OfType<UIElement>().OrderBy(GetOrder))
		{
			num++;
			if (item != _draggingObject)
			{
				SetDesiredPosition(item, _strategy.GetPosition(num));
			}
		}
		return _strategy.ResultSize;
	}

	protected override Size ArrangeOverride(Size finalSize)
	{
		foreach (UIElement item in base.Children.OfType<UIElement>().OrderBy(GetOrder))
		{
			Rect finalRect = GetPosition(item);
			if (double.IsNaN(finalRect.Top))
			{
				finalRect = GetDesiredPosition(item);
			}
			item.Arrange(finalRect);
		}
		return _strategy.ResultSize;
	}

	private Size[] MeasureChildren()
	{
		if (_measures == null || base.Children.Count != _measures.Length)
		{
			_measures = new Size[base.Children.Count];
			Size availableSize = new Size(double.PositiveInfinity, double.PositiveInfinity);
			foreach (UIElement child in base.Children)
			{
				child.Measure(availableSize);
			}
			int num = 0;
			foreach (Size item in from ch in base.Children.OfType<UIElement>().OrderBy(GetOrder)
				select ch.DesiredSize)
			{
				_measures[num] = item;
				num++;
			}
		}
		return _measures;
	}

	private void ReorderOthers()
	{
		int order = GetOrder(_draggingObject);
		int num = 0;
		foreach (UIElement item in base.Children.OfType<UIElement>().OrderBy(GetOrder))
		{
			if (num == order)
			{
				num++;
			}
			if (item != _draggingObject)
			{
				int order2 = GetOrder(item);
				if (num != order2)
				{
					SetOrder(item, num);
				}
				num++;
			}
		}
	}

	private void InitializeEmptyOrder()
	{
		if (base.Children.Count <= 0)
		{
			return;
		}
		int num = base.Children.OfType<UIElement>().Max((UIElement ch) => GetOrder(ch)) + 1;
		foreach (UIElement item in from child in base.Children.OfType<UIElement>()
			where GetOrder(child) == -1
			select child)
		{
			SetOrder(item, num);
			num++;
		}
	}

	static ArrangePanel()
	{
		DraggableProperty = DependencyProperty.Register("Draggable", typeof(bool), typeof(ArrangePanel), new PropertyMetadata(true));
		PositionProperty = DependencyProperty.RegisterAttached("Position", typeof(Rect), typeof(ArrangePanel), new FrameworkPropertyMetadata(new Rect(double.NaN, double.NaN, double.NaN, double.NaN), FrameworkPropertyMetadataOptions.AffectsParentArrange));
		DesiredPositionProperty = DependencyProperty.RegisterAttached("DesiredPosition", typeof(Rect), typeof(ArrangePanel), new FrameworkPropertyMetadata(new Rect(double.NaN, double.NaN, double.NaN, double.NaN), OnDesiredPositionChanged));
		OrderProperty = DependencyProperty.RegisterAttached("Order", typeof(int), typeof(ArrangePanel), new FrameworkPropertyMetadata(-1, FrameworkPropertyMetadataOptions.AffectsParentMeasure));
	}

	private static void OnDesiredPositionChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		Rect desiredPosition = (Rect)e.NewValue;
		AnimateToPosition(d, desiredPosition);
	}

	private static void AnimateToPosition(DependencyObject d, Rect desiredPosition)
	{
		Rect position = GetPosition(d);
		if (double.IsNaN(position.X))
		{
			SetPosition(d, desiredPosition);
			return;
		}
		TimeSpan timeSpan = TimeSpan.FromMilliseconds(Math.Max((desiredPosition.TopLeft - position.TopLeft).Length, (desiredPosition.BottomRight - position.BottomRight).Length) * 2.0);
		RectAnimation rectAnimation = new RectAnimation(position, desiredPosition, new Duration(timeSpan));
		rectAnimation.DecelerationRatio = 1.0;
		((UIElement)d).BeginAnimation(PositionProperty, rectAnimation);
	}

	public static int GetOrder(DependencyObject obj)
	{
		return (int)obj.GetValue(OrderProperty);
	}

	public static void SetOrder(DependencyObject obj, int value)
	{
		obj.SetValue(OrderProperty, value);
	}

	public static Rect GetPosition(DependencyObject obj)
	{
		return (Rect)obj.GetValue(PositionProperty);
	}

	public static void SetPosition(DependencyObject obj, Rect value)
	{
		obj.SetValue(PositionProperty, value);
	}

	public static Rect GetDesiredPosition(DependencyObject obj)
	{
		return (Rect)obj.GetValue(DesiredPositionProperty);
	}

	public static void SetDesiredPosition(DependencyObject obj, Rect value)
	{
		obj.SetValue(DesiredPositionProperty, value);
	}
}
