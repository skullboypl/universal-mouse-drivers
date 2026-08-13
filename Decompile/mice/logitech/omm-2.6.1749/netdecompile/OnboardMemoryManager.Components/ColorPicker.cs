using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Shapes;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager.Components;

public class ColorPicker : UserControl, IComponentConnector
{
	private LinearGradientBrush _linearGradientBrush;

	private int _lastSelectedHue;

	public static DependencyProperty SelectedColorProperty = DependencyProperty.Register("SelectedColor", typeof(Color), typeof(ColorPicker), new PropertyMetadata(onSelectedColorPropertyChanged));

	internal Grid LayoutRoot;

	internal Border background;

	internal Border ColorPickerUnit;

	internal Grid colorPicker;

	internal Canvas BaseColor;

	internal Canvas WhiteUnit;

	internal Canvas BlackUnit;

	internal Border colorPickerCliping;

	internal Canvas PickerStylus;

	internal Border ColorSelectorUnit;

	internal Grid colorSelector;

	internal Path stylus;

	internal Canvas colorSelectorCliping;

	internal Grid ColorBarUnit;

	private bool _contentLoaded;

	public Color SelectedColor
	{
		get
		{
			return (Color)GetValue(SelectedColorProperty);
		}
		set
		{
			if (value != SelectedColor)
			{
				setSelectedColor(value);
				setStylus(value);
				setPicker(value);
				_lastSelectedHue = ColorHelpers.ColortoHSV(value).H;
			}
		}
	}

	public ColorPicker()
	{
		InitializeComponent();
		base.Loaded += OnDPIControlLoaded;
	}

	private void OnDPIControlLoaded(object sender, RoutedEventArgs e)
	{
		AddColorSelectorGradient();
		setStylus(SelectedColor);
		setSelectedColor(SelectedColor);
		setPicker(SelectedColor);
		_lastSelectedHue = ColorHelpers.ColortoHSV(SelectedColor).H;
	}

	private void AddColorSelectorGradient()
	{
		_linearGradientBrush = new LinearGradientBrush();
		_linearGradientBrush.StartPoint = new Point(0.5, 0.0);
		_linearGradientBrush.EndPoint = new Point(0.5, 1.0);
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, byte.MaxValue, 0, 0), 0.02));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, byte.MaxValue, byte.MaxValue, 0), 0.167));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, 0, byte.MaxValue, 0), 0.334));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, 0, byte.MaxValue, byte.MaxValue), 0.501));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, 0, 0, byte.MaxValue), 0.668));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, byte.MaxValue, 0, byte.MaxValue), 0.835));
		_linearGradientBrush.GradientStops.Add(new GradientStop(Color.FromArgb(byte.MaxValue, byte.MaxValue, 0, 0), 0.975));
		colorSelector.Background = _linearGradientBrush;
	}

	private void ColorSelectorUnit_MouseMove(object sender, MouseEventArgs e)
	{
		if (e.LeftButton == MouseButtonState.Pressed)
		{
			_ = (UIElement)sender;
			Point position = e.GetPosition(ColorSelectorUnit);
			double actualHeight = ColorSelectorUnit.ActualHeight;
			double val = position.Y.Clamp(0.0, actualHeight) / actualHeight;
			val = val.Clamp(0.02, 0.975);
			Color relativeColor = ColorHelpers.GetRelativeColor(_linearGradientBrush.GradientStops, val);
			ColorHelpers.HSV hSV = ColorHelpers.ColortoHSV(SelectedColor);
			_lastSelectedHue = (hSV.H = ColorHelpers.ColortoHSV(relativeColor).H);
			Color selectedColor = ColorHelpers.HSVtoColor(hSV);
			setSelectedColor(selectedColor);
			setStylus(selectedColor);
		}
	}

	private void ColorSelectorUnit_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
	{
		((UIElement)sender).CaptureMouse();
	}

	private void ColorSelectorUnit_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
	{
		((UIElement)sender).ReleaseMouseCapture();
	}

	private void ColorPickerUnit_MouseMove(object sender, MouseEventArgs e)
	{
		if (e.LeftButton == MouseButtonState.Pressed)
		{
			_ = (UIElement)sender;
			Point position = e.GetPosition(ColorPickerUnit);
			double actualWidth = ColorPickerUnit.ActualWidth;
			double actualHeight = ColorPickerUnit.ActualHeight;
			double num = position.X.Clamp(0.0, actualWidth) / actualWidth;
			double num2 = position.Y.Clamp(0.0, actualHeight) / actualHeight;
			ColorHelpers.HSV hSV = new ColorHelpers.HSV();
			hSV.H = _lastSelectedHue;
			hSV.S = (float)num;
			hSV.V = 1f - (float)num2;
			setSelectedColor(ColorHelpers.HSVtoColor(hSV));
			PickerStylus.Margin = new Thickness(num * actualWidth - 8.0, num2 * actualHeight - 8.0, 0.0, 0.0);
		}
	}

	private void ColorPickerUnit_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
	{
		((UIElement)sender).CaptureMouse();
	}

	private void ColorPickerUnit_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
	{
		((UIElement)sender).ReleaseMouseCapture();
	}

	private static void onSelectedColorPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as ColorPicker).SelectedColor = (Color)e.NewValue;
	}

	private void setSelectedColor(Color value)
	{
		SetValue(SelectedColorProperty, value);
		ColorBarUnit.Background = new SolidColorBrush(value);
	}

	private void setStylus(Color value)
	{
		double actualHeight = ColorSelectorUnit.ActualHeight;
		int h = ColorHelpers.ColortoHSV(value).H;
		double num = (double)((float)h / 360f) * actualHeight;
		stylus.Margin = new Thickness(0.0, num - 4.0, 0.0, 0.0);
		Color color = ColorHelpers.HSVtoColor(new ColorHelpers.HSV(h, 1.0, 1.0));
		BaseColor.Background = new SolidColorBrush(color);
	}

	private void setPicker(Color value)
	{
		double actualWidth = ColorPickerUnit.ActualWidth;
		double actualHeight = ColorPickerUnit.ActualHeight;
		ColorHelpers.HSV hSV = ColorHelpers.ColortoHSV(value);
		PickerStylus.Margin = new Thickness(hSV.S * actualWidth - 8.0, (1.0 - hSV.V) * actualHeight - 8.0, 0.0, 0.0);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/colorpicker.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			LayoutRoot = (Grid)target;
			break;
		case 2:
			background = (Border)target;
			break;
		case 3:
			ColorPickerUnit = (Border)target;
			ColorPickerUnit.MouseMove += ColorPickerUnit_MouseMove;
			ColorPickerUnit.PreviewMouseLeftButtonDown += ColorPickerUnit_PreviewMouseLeftButtonDown;
			ColorPickerUnit.PreviewMouseLeftButtonUp += ColorPickerUnit_PreviewMouseLeftButtonUp;
			break;
		case 4:
			colorPicker = (Grid)target;
			break;
		case 5:
			BaseColor = (Canvas)target;
			break;
		case 6:
			WhiteUnit = (Canvas)target;
			break;
		case 7:
			BlackUnit = (Canvas)target;
			break;
		case 8:
			colorPickerCliping = (Border)target;
			break;
		case 9:
			PickerStylus = (Canvas)target;
			break;
		case 10:
			ColorSelectorUnit = (Border)target;
			ColorSelectorUnit.MouseMove += ColorSelectorUnit_MouseMove;
			ColorSelectorUnit.PreviewMouseLeftButtonDown += ColorSelectorUnit_PreviewMouseLeftButtonDown;
			ColorSelectorUnit.PreviewMouseLeftButtonUp += ColorSelectorUnit_PreviewMouseLeftButtonUp;
			break;
		case 11:
			colorSelector = (Grid)target;
			break;
		case 12:
			stylus = (Path)target;
			break;
		case 13:
			colorSelectorCliping = (Canvas)target;
			break;
		case 14:
			ColorBarUnit = (Grid)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
