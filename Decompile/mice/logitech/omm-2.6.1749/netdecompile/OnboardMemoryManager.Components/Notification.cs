using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace OnboardMemoryManager.Components;

public class Notification : UserControl, IComponentConnector
{
	public enum ICON_ANIMATIONS
	{
		NONE,
		ROTATE,
		JAZZYROTATE
	}

	private DispatcherTimer _animationCycleTimer;

	public static DependencyProperty IconAnimationProperty = DependencyProperty.Register("IconAnimation", typeof(ICON_ANIMATIONS), typeof(Notification), new PropertyMetadata(onIconAnimationPropertyChanged));

	public static DependencyProperty IconProperty = DependencyProperty.Register("Icon", typeof(Uri), typeof(Notification), new PropertyMetadata(onIconPropertyChanged));

	public static DependencyProperty ContentBeforeProperty = DependencyProperty.Register("ContentBefore", typeof(FrameworkElement), typeof(Notification), new PropertyMetadata(onContentBeforePropertyChanged));

	public static DependencyProperty ContentAfterProperty = DependencyProperty.Register("ContentAfter", typeof(FrameworkElement), typeof(Notification), new PropertyMetadata(onContentAfterPropertyChanged));

	public static DependencyProperty TitleProperty = DependencyProperty.Register("Title", typeof(string), typeof(Notification), new PropertyMetadata("", onTitlePropertyChanged));

	public static DependencyProperty TitleForegroundProperty = DependencyProperty.Register("TitleForeground", typeof(Brush), typeof(Notification), new PropertyMetadata(new SolidColorBrush(Colors.White), onTitleForegroundPropertyChanged));

	public static DependencyProperty TextContentProperty = DependencyProperty.Register("TextContent", typeof(string), typeof(Notification), new PropertyMetadata("", onTextContentPropertyChanged));

	public static DependencyProperty TextForegroundProperty = DependencyProperty.Register("TextForeground", typeof(Brush), typeof(Notification), new PropertyMetadata(new SolidColorBrush(Colors.White), onTextForegroundPropertyChanged));

	private const float osciallationMax = 1f;

	private const float osciallationMin = 0f;

	private const float osciallationStep = 0.025f;

	private float oscillationDirection = 1f;

	private float oscillationValue;

	internal Image IconControl;

	internal TextBlock TextContentControl;

	private bool _contentLoaded;

	public ICON_ANIMATIONS IconAnimation
	{
		get
		{
			return (ICON_ANIMATIONS)GetValue(IconAnimationProperty);
		}
		set
		{
			SetValue(IconAnimationProperty, value);
			if (_animationCycleTimer == null)
			{
				return;
			}
			if (value == ICON_ANIMATIONS.NONE)
			{
				_animationCycleTimer.Stop();
				base.Dispatcher.Invoke(delegate
				{
					IconControl.RenderTransform = null;
				});
			}
			else
			{
				_animationCycleTimer.Start();
			}
		}
	}

	public Uri Icon
	{
		get
		{
			return (Uri)GetValue(IconProperty);
		}
		set
		{
			SetValue(IconProperty, value);
			if (value != null)
			{
				IconControl.Source = new BitmapImage(value);
			}
		}
	}

	public FrameworkElement ContentBefore
	{
		get
		{
			return (FrameworkElement)GetValue(ContentBeforeProperty);
		}
		set
		{
			SetValue(ContentBeforeProperty, value);
		}
	}

	public FrameworkElement ContentAfter
	{
		get
		{
			return (FrameworkElement)GetValue(ContentAfterProperty);
		}
		set
		{
			SetValue(ContentAfterProperty, value);
		}
	}

	public string Title
	{
		get
		{
			return (string)GetValue(TitleProperty);
		}
		set
		{
			SetValue(TitleProperty, value);
		}
	}

	public Brush TitleForeground
	{
		get
		{
			return (Brush)GetValue(TitleForegroundProperty);
		}
		set
		{
			SetValue(TitleForegroundProperty, value);
		}
	}

	public string TextContent
	{
		get
		{
			return (string)GetValue(TextContentProperty);
		}
		set
		{
			SetValue(TextContentProperty, value);
		}
	}

	public Brush TextForeground
	{
		get
		{
			return (Brush)GetValue(TextForegroundProperty);
		}
		set
		{
			SetValue(TextForegroundProperty, value);
		}
	}

	private static void onIconAnimationPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).IconAnimation = (ICON_ANIMATIONS)e.NewValue;
	}

	private static void onIconPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).Icon = e.NewValue as Uri;
	}

	private static void onContentBeforePropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).ContentBefore = e.NewValue as FrameworkElement;
	}

	private static void onContentAfterPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).ContentAfter = e.NewValue as FrameworkElement;
	}

	private static void onTitlePropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).Title = e.NewValue as string;
	}

	private static void onTitleForegroundPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).TitleForeground = e.NewValue as Brush;
	}

	private static void onTextContentPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).TextContent = e.NewValue as string;
	}

	private static void onTextForegroundPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Notification).TextForeground = e.NewValue as Brush;
	}

	public Notification()
	{
		InitializeComponent();
		base.Loaded += OnNotificationLoaded;
	}

	private void OnNotificationLoaded(object sender, RoutedEventArgs e)
	{
		_animationCycleTimer = new DispatcherTimer(DispatcherPriority.Render, Application.Current.Dispatcher);
		_animationCycleTimer.Tick += animationCycleTick;
		_animationCycleTimer.Interval = new TimeSpan(0, 0, 0, 0, 33);
		if (IconAnimation != ICON_ANIMATIONS.NONE)
		{
			_animationCycleTimer.Start();
		}
		Binding binding = new Binding("TextContent");
		binding.RelativeSource = new RelativeSource(RelativeSourceMode.FindAncestor, typeof(Notification), 1);
		TextContentControl.SetBinding(TextBlock.TextProperty, binding);
	}

	private void animationCycleTick(object sender, EventArgs e)
	{
		oscillationValue += oscillationDirection * 0.025f;
		ICON_ANIMATIONS iconAnimation = IconAnimation;
		if ((uint)(iconAnimation - 1) <= 1u)
		{
			if (oscillationValue >= 1f)
			{
				oscillationValue = 0f;
			}
			oscillationDirection = 1f;
			double angle = ((IconAnimation == ICON_ANIMATIONS.JAZZYROTATE) ? ((Math.Abs(Math.Cos((double)oscillationValue * Math.PI)) * 360.0 + (double)(oscillationValue * 180f)) % 360.0) : ((double)(oscillationValue * 360f)));
			IconControl.RenderTransform = new RotateTransform(angle, IconControl.ActualWidth / 2.0, IconControl.ActualHeight / 2.0);
		}
		else if (oscillationValue >= 1f)
		{
			oscillationDirection = -1f;
		}
		else if (oscillationValue <= 0f)
		{
			oscillationDirection = 1f;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/notification.xaml", UriKind.Relative);
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
			IconControl = (Image)target;
			break;
		case 2:
			TextContentControl = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
