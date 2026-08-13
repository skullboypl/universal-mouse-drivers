using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using logi.hidppio;

namespace OnboardMemoryManager.Components;

public class Assignments : UserControl, IComponentConnector, IStyleConnector
{
	private DispatcherTimer _animationCycleTimer;

	private bool _mouseButtonSpyActive;

	private Feature8110 _f8110;

	private OnboardMemoryManager.Models.Profile _profileModel;

	public static DependencyProperty ProfileModelProperty = DependencyProperty.Register("ProfileModel", typeof(OnboardMemoryManager.Models.Profile), typeof(Assignments), new PropertyMetadata(null, onProfileModelPropertyChanged));

	public static DependencyProperty GShiftProperty = DependencyProperty.Register("GShift", typeof(bool), typeof(Assignments), new PropertyMetadata(onGShiftPropertyChanged));

	private const float osciallationMax = 1f;

	private const float osciallationMin = 0f;

	private const float osciallationStep = 0.05f;

	private float oscillationDirection = 1f;

	private float oscillationValue;

	private int _highlightedMouseButton;

	private Popup _currentPopup;

	private DispatcherTimer _popupOpenTimer;

	private DispatcherTimer _popupClosedTimer;

	internal ItemsControl Assignments_List;

	private bool _contentLoaded;

	public OnboardMemoryManager.Models.Profile ProfileModel
	{
		get
		{
			return GetValue(ProfileModelProperty) as OnboardMemoryManager.Models.Profile;
		}
		set
		{
			if (value == _profileModel)
			{
				return;
			}
			SetValue(ProfileModelProperty, value);
			stopMouseButtonSpy();
			if (_profileModel != null)
			{
				if (_profileModel is HIDProfile hIDProfile)
				{
					hIDProfile.AssignmentActionListChanged -= onAssignmentActionListChanged;
				}
				if (_f8110 != null)
				{
					_f8110.OnMouseButtonUp -= onMouseButtonSpyButtonUp;
				}
			}
			_f8110 = null;
			_profileModel = value;
			if (_profileModel is HIDProfile source)
			{
				Binding binding = new Binding(GShift ? "GShiftAssignments" : "Assignments");
				binding.Mode = BindingMode.TwoWay;
				binding.Source = source;
				Assignments_List.SetBinding(ItemsControl.ItemsSourceProperty, binding);
				(_profileModel as HIDProfile).AssignmentActionListChanged += onAssignmentActionListChanged;
				if (_profileModel.Device is HIDDevice { IsConnected: not false } hIDDevice)
				{
					(_f8110 = ((DeviceBase)hIDDevice.HidppDeviceHandle).GetFeature<Feature8110>()).OnMouseButtonUp += onMouseButtonSpyButtonUp;
				}
			}
			OnPropertyChanged("ProfileModel");
		}
	}

	public bool GShift
	{
		get
		{
			return (bool)GetValue(GShiftProperty);
		}
		set
		{
			SetValue(GShiftProperty, value);
			if (_profileModel is HIDProfile source)
			{
				Binding binding = new Binding(GShift ? "GShiftAssignments" : "Assignments");
				binding.Mode = BindingMode.TwoWay;
				binding.Source = source;
				Assignments_List.SetBinding(ItemsControl.ItemsSourceProperty, binding);
			}
		}
	}

	public bool MouseButtonSpyActive
	{
		get
		{
			return _mouseButtonSpyActive;
		}
		set
		{
			if (value)
			{
				startMouseButtonSpy();
			}
			else
			{
				stopMouseButtonSpy();
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	private static void onProfileModelPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Assignments).ProfileModel = e.NewValue as OnboardMemoryManager.Models.Profile;
	}

	private void onAssignmentActionListChanged(object sender, OnboardMemoryManager.Controllers.Assignment.AssignmentActionListChangedEventArgs e)
	{
		int index = (sender as OnboardMemoryManager.Controllers.Assignment).VisibleIndex - 1;
		Assignment assignment = ComponentTreeTraversers.FindVisualChild<Assignment>(Assignments_List.ItemContainerGenerator.ContainerFromIndex(index));
		if (assignment != null)
		{
			assignment.SelectedValue = e.Action;
			assignment.IsRecording = e.IsRecording;
			OnPropertyChanged("ProfileCycleWarning");
		}
	}

	private static void onGShiftPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Assignments).GShift = (bool)e.NewValue;
	}

	public Assignments()
	{
		InitializeComponent();
		base.Loaded += onAssignmentsLoaded;
		AddHandler(MainWindow.OnInterfaceShouldLockEvent, new RoutedEventHandler(onInterfaceShouldLock));
		AddHandler(MainWindow.OnInterfaceShouldUnlockEvent, new RoutedEventHandler(onInterfaceShouldUnlock));
	}

	~Assignments()
	{
		if (_mouseButtonSpyActive)
		{
			stopMouseButtonSpy();
		}
	}

	private void onInterfaceShouldLock(object sender, RoutedEventArgs e)
	{
		base.Dispatcher.Invoke(delegate
		{
			for (int i = 0; i < Assignments_List.Items.Count; i++)
			{
				if (Assignments_List.ItemContainerGenerator.ContainerFromIndex(i) is ContentPresenter contentPresenter && ComponentTreeTraversers.FindVisualChild<Assignment>(contentPresenter) != e.OriginalSource)
				{
					contentPresenter.IsEnabled = false;
				}
			}
		});
	}

	private void onInterfaceShouldUnlock(object sender, RoutedEventArgs e)
	{
		base.Dispatcher.Invoke(delegate
		{
			for (int i = 0; i < Assignments_List.Items.Count; i++)
			{
				if (Assignments_List.ItemContainerGenerator.ContainerFromIndex(i) is ContentPresenter contentPresenter)
				{
					contentPresenter.IsEnabled = true;
				}
			}
		});
	}

	private void onAssignmentsLoaded(object sender, RoutedEventArgs e)
	{
		if (Application.Current is App app)
		{
			_animationCycleTimer = new DispatcherTimer(DispatcherPriority.Render, app.Dispatcher);
			_animationCycleTimer.Tick += animationCycleTick;
			_animationCycleTimer.Interval = new TimeSpan(0, 0, 0, 0, 66);
		}
	}

	private void animationCycleTick(object sender, EventArgs e)
	{
		oscillationValue += 0.05f * oscillationDirection;
		if (oscillationValue >= 1f)
		{
			oscillationDirection = -1f;
		}
		else if (oscillationValue <= 0f)
		{
			oscillationDirection = 1f;
		}
		Color color = (Color)Application.Current.Resources["Color.Primary.500"];
		Color highlightedMouseButtonColor = Color.FromArgb((byte)(256.0 * Math.Sin((double)oscillationValue * Math.PI)), color.R, color.G, color.B);
		setHighlightedMouseButtonColor(highlightedMouseButtonColor);
	}

	private void stopAnimation()
	{
		_animationCycleTimer.Stop();
		base.Dispatcher.Invoke(delegate
		{
			setHighlightedMouseButtonColor(Colors.Transparent);
		});
		_highlightedMouseButton = 0;
		oscillationValue = 0f;
		oscillationDirection = 1f;
	}

	private void setHighlightedMouseButtonColor(Color color)
	{
		if (_highlightedMouseButton > 0 && Assignments_List.ItemContainerGenerator.ContainerFromIndex(_highlightedMouseButton - 1) is ContentPresenter obj)
		{
			Grid grid = ComponentTreeTraversers.FindVisualChild<Grid>(obj);
			if (grid != null)
			{
				grid.Background = new SolidColorBrush(color);
			}
		}
	}

	public async Task animationTimeout()
	{
		await Task.Delay(1320);
		stopAnimation();
	}

	public void startMouseButtonSpy()
	{
		if (_profileModel != null && !_mouseButtonSpyActive && _profileModel.Device is HIDDevice { IsConnected: not false } && _f8110 != null)
		{
			_f8110.StartSpy();
			_mouseButtonSpyActive = true;
			OnPropertyChanged("MouseButtonSpyActive");
		}
	}

	private void stopMouseButtonSpy()
	{
		if (_profileModel != null && _mouseButtonSpyActive && _profileModel.Device is HIDDevice { IsConnected: not false } && _f8110 != null)
		{
			_f8110.StopSpy();
			_mouseButtonSpyActive = false;
			OnPropertyChanged("MouseButtonSpyActive");
		}
	}

	private void onMouseButtonSpyButtonUp(int button)
	{
		if (!_mouseButtonSpyActive)
		{
			return;
		}
		stopAnimation();
		_highlightedMouseButton = button;
		_animationCycleTimer.Start();
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			await animationTimeout();
		});
		stopMouseButtonSpy();
		base.Dispatcher.Invoke(delegate
		{
			if (Assignments_List.ItemContainerGenerator.ContainerFromIndex(button - 1) is ContentPresenter contentPresenter)
			{
				contentPresenter.BringIntoView();
			}
		});
	}

	private void onLaunchCycleProfileWarning(object sender, RoutedEventArgs e)
	{
		if (!(Application.Current is App app))
		{
			return;
		}
		if (_popupOpenTimer != null)
		{
			_popupOpenTimer.Stop();
		}
		_popupOpenTimer = new DispatcherTimer(DispatcherPriority.Render, app.Dispatcher);
		_popupOpenTimer.Interval = new TimeSpan(0, 0, 0, 0, 200);
		_popupOpenTimer.Tick += delegate
		{
			openPopup(sender);
			if (_popupOpenTimer != null)
			{
				_popupOpenTimer.Stop();
				_popupOpenTimer = null;
			}
		};
		_popupOpenTimer.Start();
	}

	private void onCycleProfileWarningMouseLeave(object sender, RoutedEventArgs e)
	{
		if (_popupOpenTimer != null)
		{
			_popupOpenTimer.Stop();
			_popupOpenTimer = null;
		}
	}

	private void openPopup(object sender)
	{
		ContentPresenter contentPresenter = ComponentTreeTraversers.FindParent<ContentPresenter>(sender as DependencyObject);
		if (contentPresenter == null)
		{
			return;
		}
		if (_currentPopup != null)
		{
			_currentPopup.IsOpen = false;
			_currentPopup = null;
		}
		_currentPopup = ComponentTreeTraversers.FindVisualChild<Popup>(contentPresenter);
		if (_currentPopup == null)
		{
			return;
		}
		if (_popupClosedTimer != null)
		{
			_popupClosedTimer.Stop();
			_popupClosedTimer = null;
		}
		if (_currentPopup.IsOpen)
		{
			return;
		}
		_currentPopup.StaysOpen = false;
		_currentPopup.IsOpen = true;
		FrameworkElement obj = LogicalTreeHelper.FindLogicalNode(_currentPopup, "popupContent") as FrameworkElement;
		obj.MouseEnter += delegate
		{
			if (_popupClosedTimer != null)
			{
				_popupClosedTimer.Stop();
				_popupClosedTimer = null;
			}
		};
		obj.MouseLeave += delegate
		{
			ContentPresenter contentPresenter2 = ComponentTreeTraversers.FindParent<ContentPresenter>(_currentPopup);
			if (contentPresenter2 != null)
			{
				Rectangle rectangle = ComponentTreeTraversers.FindVisualChild<Rectangle>(contentPresenter2);
				if (rectangle != null && !rectangle.IsMouseOver)
				{
					startPopupCloseTimer();
				}
			}
		};
		_currentPopup.Closed += delegate
		{
			if (_popupClosedTimer != null)
			{
				_popupClosedTimer.Stop();
				_popupClosedTimer = null;
			}
		};
	}

	private void onCloseCycleProfileWarningPopupMouseEnter(object sender, RoutedEventArgs e)
	{
		if (_popupClosedTimer != null)
		{
			_popupClosedTimer.Stop();
			_popupClosedTimer = null;
		}
	}

	private void startPopupCloseTimer()
	{
		if (!(Application.Current is App app))
		{
			return;
		}
		if (_popupClosedTimer != null)
		{
			_popupClosedTimer.Stop();
		}
		_popupClosedTimer = new DispatcherTimer(DispatcherPriority.Render, app.Dispatcher);
		_popupClosedTimer.Interval = new TimeSpan(0, 0, 0, 0, 500);
		_popupClosedTimer.Tick += delegate
		{
			if (_currentPopup != null)
			{
				_currentPopup.IsOpen = false;
				_currentPopup = null;
			}
			_popupClosedTimer.Stop();
			_popupClosedTimer = null;
		};
		_popupClosedTimer.Start();
	}

	private void onCycleProfileWarningActionClick(object sender, RoutedEventArgs e)
	{
		if (sender is FrameworkContentElement { DataContext: OnboardMemoryManager.Controllers.Assignment dataContext })
		{
			dataContext.FixProfileCycleWarning();
			if (_currentPopup != null)
			{
				_currentPopup.IsOpen = false;
				_currentPopup = null;
			}
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/assignments.xaml", UriKind.Relative);
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
			Assignments_List = (ItemsControl)target;
		}
		else
		{
			_contentLoaded = true;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 2:
			((Image)target).MouseEnter += onLaunchCycleProfileWarning;
			((Image)target).MouseLeave += onCycleProfileWarningMouseLeave;
			break;
		case 3:
			((Popup)target).MouseEnter += onCloseCycleProfileWarningPopupMouseEnter;
			break;
		case 4:
			((Hyperlink)target).Click += onCycleProfileWarningActionClick;
			break;
		}
	}
}
