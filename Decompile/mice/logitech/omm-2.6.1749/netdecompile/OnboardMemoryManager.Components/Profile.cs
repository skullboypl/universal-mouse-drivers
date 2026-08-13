using System;
using System.CodeDom.Compiler;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Threading;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Components;

public class Profile : UserControl, IComponentConnector
{
	private OnboardMemoryManager.Models.Profile _profileModel;

	public static DependencyProperty ProfileModelProperty = DependencyProperty.Register("ProfileModel", typeof(OnboardMemoryManager.Models.Profile), typeof(Profile), new PropertyMetadata(null, onProfileModelPropertyChanged));

	public static DependencyProperty LightingOptionsProperty = DependencyProperty.Register("LightingOptions", typeof(ObservableCollection<Lighting.LightingOption>), typeof(Profile), new PropertyMetadata(onLightingOptionsPropertyChanged));

	private DispatcherTimer _popupClosedTimer;

	private bool _popupJustClosed;

	internal StackPanel DPI_Panel;

	internal Label DPI_Header;

	internal DPITable DPITable;

	internal StackPanel Assignments_Panel;

	internal Label Assignments_Header;

	internal Assignments Assignments_Control;

	internal Button FindButtonPosition;

	internal TextBlock FindButtonPositionTextBlock;

	internal ToggleButton GShiftToggle;

	internal StackPanel ReportRate_Panel;

	internal Label ReportRate_Header;

	internal ComboSelect ReportRateList;

	internal StackPanel ReportRateExtended_Panel;

	internal Label ReportRateWired_Header;

	internal ComboSelect ReportRateWiredList;

	internal Label ReportRateWireless_Header;

	internal ComboSelect ReportRateWirelessList;

	internal StackPanel ReportRate_Tooltip;

	internal Label LightingEnable_Header;

	internal ComboSelect LightingMode;

	internal Button LaunchColorPicker;

	internal Popup ColorPickerPopup;

	internal ColorPicker ColorPicker;

	internal StackPanel BunnyHopping_Panel;

	internal Label BunnyHopping_Header;

	internal CheckBox BunnyHoppingCheckBox;

	internal NumericTextBox BunnyHoppingTimeoutTextBox;

	internal StackPanel Analog_Panel;

	internal Button HITSShareButton;

	internal TabControl AnalogTabControl;

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
			bool num = (value != null && _profileModel != null && value.Device != _profileModel.Device) || value == null || _profileModel == null;
			SetValue(ProfileModelProperty, value);
			if (ColorPickerPopup.IsOpen)
			{
				ColorPickerPopup.IsOpen = false;
			}
			if (num)
			{
				stopMouseButtonSpy();
			}
			_profileModel = value;
			if (_profileModel is HIDProfile hIDProfile)
			{
				ReportRateList.ItemsSource = hIDProfile.ReportRateItems;
				ReportRateWiredList.ItemsSource = hIDProfile.ReportRateWiredItems;
				ReportRateWirelessList.ItemsSource = hIDProfile.ReportRateWirelessItems;
				LightingOptions = hIDProfile.Device.LightingOptions;
				if (hIDProfile.Device is HIDMouse hIDMouse)
				{
					hIDMouse.LightingController.OnPropertyChanged("IsSupported");
				}
				OnPropertyChanged("LightingOptions");
			}
			OnPropertyChanged("ProfileModel");
		}
	}

	public ObservableCollection<Lighting.LightingOption> LightingOptions
	{
		get
		{
			return (ObservableCollection<Lighting.LightingOption>)GetValue(LightingOptionsProperty);
		}
		set
		{
			if (value != LightingOptions)
			{
				SetValue(LightingOptionsProperty, value);
				OnPropertyChanged("LightingEffect");
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
		((d as Profile).ProfileModel = e.NewValue as OnboardMemoryManager.Models.Profile)?.Device?.Profiles.OfType<HIDProfile>().FirstOrDefault((HIDProfile p) => p.Enabled).Assignments.ToList().ForEach(delegate(OnboardMemoryManager.Controllers.Assignment a)
		{
			a.CheckProfileCycleWarning();
		});
	}

	private static void onLightingOptionsPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Profile).LightingOptions = e.NewValue as ObservableCollection<Lighting.LightingOption>;
	}

	public Profile()
	{
		InitializeComponent();
		base.Loaded += OnProfileLoaded;
		AddHandler(MainWindow.OnInterfaceShouldLockEvent, new RoutedEventHandler(onInterfaceShouldLock));
		AddHandler(MainWindow.OnInterfaceShouldUnlockEvent, new RoutedEventHandler(onInterfaceShouldUnlock));
	}

	private void onInterfaceShouldLock(object sender, RoutedEventArgs e)
	{
		FindButtonPosition.IsEnabled = false;
		ReportRateList.IsEnabled = false;
		ReportRateWiredList.IsEnabled = false;
		ReportRateWirelessList.IsEnabled = false;
		DPITable.IsEnabled = false;
		GShiftToggle.IsEnabled = false;
	}

	private void onInterfaceShouldUnlock(object sender, RoutedEventArgs e)
	{
		FindButtonPosition.IsEnabled = true;
		ReportRateList.IsEnabled = true;
		ReportRateWiredList.IsEnabled = true;
		ReportRateWirelessList.IsEnabled = true;
		DPITable.IsEnabled = true;
		GShiftToggle.IsEnabled = true;
	}

	private void OnProfileLoaded(object sender, RoutedEventArgs e)
	{
		if (!(Application.Current is App app))
		{
			return;
		}
		Assignments_Control.PropertyChanged += delegate(object _sender, PropertyChangedEventArgs _e)
		{
			if (_e.PropertyName == "MouseButtonSpyActive" && !(_sender as Assignments).MouseButtonSpyActive)
			{
				stopMouseButtonSpy();
			}
		};
		_popupClosedTimer = new DispatcherTimer(DispatcherPriority.Render, app.Dispatcher);
		_popupClosedTimer.Interval = new TimeSpan(0, 0, 0, 0, 100);
		ColorPickerPopup.Closed += delegate
		{
			_popupJustClosed = true;
			_popupClosedTimer.Start();
		};
		_popupClosedTimer.Tick += delegate
		{
			_popupJustClosed = false;
			_popupClosedTimer.Stop();
		};
	}

	private void onLaunchColorPickerClick(object sender, RoutedEventArgs e)
	{
		if (!_popupJustClosed && !ColorPickerPopup.IsOpen)
		{
			ColorPickerPopup.IsOpen = true;
		}
	}

	public string LocalStateValid()
	{
		string text = DPITable.Validate();
		if (text != "")
		{
			return text;
		}
		return "";
	}

	public void OnPreviewMouseWheel(object sender, MouseWheelEventArgs e)
	{
		if (sender is ScrollViewer { ContentVerticalOffset: var contentVerticalOffset } scrollViewer && ((contentVerticalOffset == scrollViewer.ScrollableHeight && e.Delta < 0) || (contentVerticalOffset == 0.0 && e.Delta > 0)))
		{
			ScrollViewer scrollViewer2 = ComponentTreeTraversers.FindParent<ScrollViewer>(scrollViewer);
			if (scrollViewer2 != null)
			{
				MouseWheelEventArgs e2 = new MouseWheelEventArgs(e.MouseDevice, e.Timestamp, e.Delta);
				e2.RoutedEvent = UIElement.MouseWheelEvent;
				scrollViewer2.RaiseEvent(e2);
			}
		}
	}

	private void Find_Button_Position_Clicked(object sender, RoutedEventArgs e)
	{
		if (!Assignments_Control.MouseButtonSpyActive)
		{
			Task.Factory.StartNew((Func<Task>)async delegate
			{
				await mouseButtonSpyStartTimeout();
				await mouseButtonSpyTimeout();
			});
			FindButtonPositionTextBlock.Text = OnboardMemoryManager.Properties.Resources.Find_Button_Position_Active.ToUpper();
			SolidColorBrush foreground = (SolidColorBrush)Application.Current.Resources["Color.RedBrush"];
			FindButtonPositionTextBlock.Foreground = foreground;
		}
	}

	public async Task mouseButtonSpyStartTimeout()
	{
		await Task.Delay(125);
		Assignments_Control.MouseButtonSpyActive = true;
		base.Dispatcher.Invoke(delegate
		{
			RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldLockEvent));
		});
	}

	public async Task mouseButtonSpyTimeout()
	{
		await Task.Delay(5000);
		stopMouseButtonSpy();
	}

	private void stopMouseButtonSpy()
	{
		base.Dispatcher.Invoke(delegate
		{
			FindButtonPositionTextBlock.Text = OnboardMemoryManager.Properties.Resources.Find_Button_Position.ToUpper();
			SolidColorBrush foreground = (SolidColorBrush)Application.Current.Resources["ColorBrush.OnSurface"];
			FindButtonPositionTextBlock.Foreground = foreground;
		});
		Assignments_Control.MouseButtonSpyActive = false;
		base.Dispatcher.Invoke(delegate
		{
			RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
		});
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/profile.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	internal Delegate _CreateDelegate(Type delegateType, string handler)
	{
		return Delegate.CreateDelegate(delegateType, this, handler);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			DPI_Panel = (StackPanel)target;
			break;
		case 2:
			DPI_Header = (Label)target;
			break;
		case 3:
			DPITable = (DPITable)target;
			break;
		case 4:
			Assignments_Panel = (StackPanel)target;
			break;
		case 5:
			Assignments_Header = (Label)target;
			break;
		case 6:
			((ScrollViewer)target).PreviewMouseWheel += OnPreviewMouseWheel;
			break;
		case 7:
			Assignments_Control = (Assignments)target;
			break;
		case 8:
			FindButtonPosition = (Button)target;
			FindButtonPosition.Click += Find_Button_Position_Clicked;
			break;
		case 9:
			FindButtonPositionTextBlock = (TextBlock)target;
			break;
		case 10:
			GShiftToggle = (ToggleButton)target;
			break;
		case 11:
			ReportRate_Panel = (StackPanel)target;
			break;
		case 12:
			ReportRate_Header = (Label)target;
			break;
		case 13:
			ReportRateList = (ComboSelect)target;
			break;
		case 14:
			ReportRateExtended_Panel = (StackPanel)target;
			break;
		case 15:
			ReportRateWired_Header = (Label)target;
			break;
		case 16:
			ReportRateWiredList = (ComboSelect)target;
			break;
		case 17:
			ReportRateWireless_Header = (Label)target;
			break;
		case 18:
			ReportRateWirelessList = (ComboSelect)target;
			break;
		case 19:
			ReportRate_Tooltip = (StackPanel)target;
			break;
		case 20:
			LightingEnable_Header = (Label)target;
			break;
		case 21:
			LightingMode = (ComboSelect)target;
			break;
		case 22:
			LaunchColorPicker = (Button)target;
			LaunchColorPicker.Click += onLaunchColorPickerClick;
			break;
		case 23:
			ColorPickerPopup = (Popup)target;
			break;
		case 24:
			ColorPicker = (ColorPicker)target;
			break;
		case 25:
			BunnyHopping_Panel = (StackPanel)target;
			break;
		case 26:
			BunnyHopping_Header = (Label)target;
			break;
		case 27:
			BunnyHoppingCheckBox = (CheckBox)target;
			break;
		case 28:
			BunnyHoppingTimeoutTextBox = (NumericTextBox)target;
			break;
		case 29:
			Analog_Panel = (StackPanel)target;
			break;
		case 30:
			HITSShareButton = (Button)target;
			break;
		case 31:
			AnalogTabControl = (TabControl)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
