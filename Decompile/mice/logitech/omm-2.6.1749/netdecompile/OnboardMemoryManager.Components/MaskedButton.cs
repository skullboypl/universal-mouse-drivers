using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;

namespace OnboardMemoryManager.Components;

public class MaskedButton : UserControl, IComponentConnector
{
	public static readonly DependencyProperty ImageProperty = DependencyProperty.Register("ImageSource", typeof(ImageSource), typeof(MaskedButton));

	internal Button button;

	private bool _contentLoaded;

	public ImageSource ImageSource
	{
		get
		{
			return (ImageSource)GetValue(ImageProperty);
		}
		set
		{
			SetValue(ImageProperty, value);
		}
	}

	public event RoutedEventHandler Click
	{
		add
		{
			button.Click += value;
		}
		remove
		{
			button.Click -= value;
		}
	}

	public MaskedButton()
	{
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/maskedbutton.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		if (connectionId == 1)
		{
			button = (Button)target;
		}
		else
		{
			_contentLoaded = true;
		}
	}
}
