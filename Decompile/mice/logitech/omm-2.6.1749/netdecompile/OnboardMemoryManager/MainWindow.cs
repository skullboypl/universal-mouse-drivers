using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media.Animation;
using System.Windows.Navigation;
using MahApps.Metro.Controls;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager;

public class MainWindow : MetroWindow, IComponentConnector
{
	private bool _navigationEnabled = true;

	public static readonly RoutedEvent OnInterfaceShouldLockEvent = EventManager.RegisterRoutedEvent("OnInterfaceShouldLock", RoutingStrategy.Bubble, typeof(RoutedEventHandler), typeof(MainWindow));

	public static readonly RoutedEvent OnInterfaceShouldUnlockEvent = EventManager.RegisterRoutedEvent("OnInterfaceShouldUnlock", RoutingStrategy.Bubble, typeof(RoutedEventHandler), typeof(MainWindow));

	private const string baze = "24242626232523254544";

	private string foo;

	internal Frame Navigation_Frame;

	private bool _contentLoaded;

	public event RoutedEventHandler OnInterfaceShouldLock
	{
		add
		{
			((UIElement)this).AddHandler(OnInterfaceShouldLockEvent, (Delegate)value);
		}
		remove
		{
			((UIElement)this).RemoveHandler(OnInterfaceShouldLockEvent, (Delegate)value);
		}
	}

	public event RoutedEventHandler OnInterfaceShouldUnlock
	{
		add
		{
			((UIElement)this).AddHandler(OnInterfaceShouldUnlockEvent, (Delegate)value);
		}
		remove
		{
			((UIElement)this).RemoveHandler(OnInterfaceShouldUnlockEvent, (Delegate)value);
		}
	}

	public MainWindow()
	{
		InitializeComponent();
		((UIElement)this).CommandBindings.Add(new CommandBinding(SystemCommands.CloseWindowCommand, OnCloseWindow));
		((UIElement)this).CommandBindings.Add(new CommandBinding(SystemCommands.MaximizeWindowCommand, OnMaximizeWindow, OnCanResizeWindow));
		((UIElement)this).CommandBindings.Add(new CommandBinding(SystemCommands.MinimizeWindowCommand, OnMinimizeWindow, OnCanMinimizeWindow));
		((UIElement)this).CommandBindings.Add(new CommandBinding(SystemCommands.RestoreWindowCommand, OnRestoreWindow, OnCanResizeWindow));
		((UIElement)this).AddHandler(OnInterfaceShouldLockEvent, (Delegate)new RoutedEventHandler(onInterfaceShouldLock));
		((UIElement)this).AddHandler(OnInterfaceShouldUnlockEvent, (Delegate)new RoutedEventHandler(onInterfaceShouldUnlock));
		((UIElement)this).KeyDown += Keypress_Handler;
	}

	private void onInterfaceShouldLock(object sender, RoutedEventArgs e)
	{
		_navigationEnabled = false;
	}

	private void onInterfaceShouldUnlock(object sender, RoutedEventArgs e)
	{
		_navigationEnabled = true;
	}

	private void Frame_Navigating(object sender, NavigatingCancelEventArgs e)
	{
		if (!_navigationEnabled)
		{
			e.Cancel = true;
			return;
		}
		ThicknessAnimation thicknessAnimation = new ThicknessAnimation();
		thicknessAnimation.Duration = TimeSpan.FromSeconds(0.3);
		thicknessAnimation.DecelerationRatio = 0.7;
		thicknessAnimation.To = new Thickness(0.0, 0.0, 0.0, 0.0);
		if (e.NavigationMode == NavigationMode.New)
		{
			thicknessAnimation.From = new Thickness(500.0, 0.0, 0.0, 0.0);
		}
		else if (e.NavigationMode == NavigationMode.Back)
		{
			thicknessAnimation.From = new Thickness(0.0, 0.0, 500.0, 0.0);
		}
		if (e.Content != null)
		{
			(e.Content as Page).BeginAnimation(FrameworkElement.MarginProperty, thicknessAnimation);
		}
	}

	private void Keypress_Handler(object sender, KeyEventArgs e)
	{
		BazeHandler(e);
	}

	private void BrowseBackCommandBinding_Executed(object sender, ExecutedRoutedEventArgs e)
	{
		if (Navigation_Frame.CanGoBack)
		{
			Navigation_Frame.GoBack();
		}
	}

	private void BrowseForwardCommandBinding_Executed(object sender, ExecutedRoutedEventArgs e)
	{
		if (Navigation_Frame.CanGoForward)
		{
			Navigation_Frame.GoForward();
		}
	}

	private void BazeHandler(KeyEventArgs e)
	{
		foo += (int)e.Key;
		if ("24242626232523254544" == foo)
		{
			OnBaze();
		}
		else if (!"24242626232523254544".StartsWith(foo))
		{
			foo = "";
		}
	}

	public void DisplaySettingsPage()
	{
		if (Navigation_Frame.Content is SettingsPage)
		{
			return;
		}
		if (Navigation_Frame.BackStack != null)
		{
			foreach (object item in Navigation_Frame.BackStack)
			{
				if (item is SettingsPage)
				{
					return;
				}
			}
		}
		Navigation_Frame.Navigate(new SettingsPage());
	}

	public void NavigateBack()
	{
		if (Navigation_Frame.CanGoBack)
		{
			Navigation_Frame.GoBack();
		}
	}

	private void OnBaze()
	{
		Image value = UIHelper.FindChild<Image>(Application.Current.MainWindow, "GLogoMain");
		Storyboard storyboard = new Storyboard();
		storyboard.Duration = new Duration(TimeSpan.FromSeconds(0.5));
		DoubleAnimation doubleAnimation = new DoubleAnimation
		{
			From = 0.0,
			To = 360.0,
			Duration = storyboard.Duration
		};
		Storyboard.SetTarget(doubleAnimation, value);
		Storyboard.SetTargetProperty(doubleAnimation, new PropertyPath("(UIElement.RenderTransform).(RotateTransform.Angle)"));
		storyboard.Children.Add(doubleAnimation);
		storyboard.Begin();
		foo = "";
	}

	private void OnCanResizeWindow(object sender, CanExecuteRoutedEventArgs e)
	{
		e.CanExecute = ((Window)this).ResizeMode == ResizeMode.CanResize || ((Window)this).ResizeMode == ResizeMode.CanResizeWithGrip;
	}

	private void OnCanMinimizeWindow(object sender, CanExecuteRoutedEventArgs e)
	{
		e.CanExecute = ((Window)this).ResizeMode != ResizeMode.NoResize;
	}

	private void OnCloseWindow(object target, ExecutedRoutedEventArgs e)
	{
		SystemCommands.CloseWindow((Window)(object)this);
	}

	private void OnMaximizeWindow(object target, ExecutedRoutedEventArgs e)
	{
		SystemCommands.MaximizeWindow((Window)(object)this);
	}

	private void OnMinimizeWindow(object target, ExecutedRoutedEventArgs e)
	{
		SystemCommands.MinimizeWindow((Window)(object)this);
	}

	private void OnRestoreWindow(object target, ExecutedRoutedEventArgs e)
	{
		SystemCommands.RestoreWindow((Window)(object)this);
	}

	private void Navigation_Frame_Navigated(object sender, NavigationEventArgs e)
	{
	}

	private void Application_MouseDown(object sender, MouseButtonEventArgs e)
	{
		if (e.ChangedButton == MouseButton.Left)
		{
			((Window)this).DragMove();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/mainwindow.xaml", UriKind.Relative);
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
			((UIElement)(object)(MainWindow)target).MouseDown += Application_MouseDown;
			break;
		case 2:
			((CommandBinding)target).Executed += BrowseBackCommandBinding_Executed;
			break;
		case 3:
			((CommandBinding)target).Executed += BrowseForwardCommandBinding_Executed;
			break;
		case 4:
			Navigation_Frame = (Frame)target;
			Navigation_Frame.Navigating += Frame_Navigating;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
