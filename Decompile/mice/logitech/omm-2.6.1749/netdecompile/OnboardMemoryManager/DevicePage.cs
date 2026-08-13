using System;
using System.CodeDom.Compiler;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Navigation;
using MahApps.Metro.Controls;
using OnboardMemoryManager.Components;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager;

public class DevicePage : Page, INotifyPropertyChanged, IComponentConnector, IStyleConnector
{
	private Device _lastDevice;

	private Device _selectedDevice;

	private OnboardMemoryManager.Models.Profile _selectedProfile;

	private bool _shouldRespondToReceiverArrival;

	private bool _showGHUBWarning;

	private bool _shouldRespondToDeviceArrival;

	private readonly CancellationTokenSource _cancellation_token_source = new CancellationTokenSource();

	public static readonly DependencyProperty SelectedDeviceProperty = DependencyProperty.Register("SelectedDevice", typeof(Device), typeof(DevicePage), new PropertyMetadata(OnSelectedDevicePropertyChanged));

	public static readonly DependencyProperty SelectedProfileProperty = DependencyProperty.Register("SelectedProfile", typeof(OnboardMemoryManager.Models.Profile), typeof(DevicePage), new PropertyMetadata(OnSelectedProfilePropertyChanged));

	public static readonly DependencyProperty ProfilesToggleVisibleProperty = DependencyProperty.Register("ProfilesToggleVisible", typeof(bool), typeof(DevicePage), new PropertyMetadata(true));

	private static readonly DependencyProperty IsInterfaceUnlockedProperty = DependencyProperty.Register("IsInterfaceUnlocked", typeof(bool), typeof(DevicePage), new PropertyMetadata(true));

	private static readonly DependencyProperty IsDeviceConfigurationVisibleProperty = DependencyProperty.Register("IsDeviceConfigurationVisible", typeof(bool), typeof(DevicePage), new PropertyMetadata(true));

	internal Grid DevicesView;

	internal Image GLogoMain;

	internal ComboSelect DeviceCombo;

	internal ComboSelect ProfileCombo;

	internal Button Reset_Btn;

	internal Button Save_Btn;

	internal MaskedButton Settings_Link;

	internal StackPanel DeviceStatusControl;

	internal TextBlock BatteryStatusPercentage;

	internal BatteryStatus BatteryStatusControl;

	internal ConnectionStatus ConnectionStatusControl;

	internal StackPanel PairingLinkControl;

	internal Button PairingLink;

	internal StackPanel Restore_Btn;

	internal Button RestoreLink;

	internal StackPanel Advanced_Toggle;

	internal CheckBox AdvancedCheckBox;

	internal Grid DeviceConfigurationView;

	internal OnboardMemoryManager.Components.Profile ProfileUI;

	internal Border HostModeWarning;

	internal StackPanel DeviceNotificationsView;

	internal Notification NoDevicesView;

	internal Pairing PairingControl;

	internal Notification ProfileLoadingErrorView;

	internal Notification DeviceLoadingView;

	private bool _contentLoaded;

	public Device SelectedDevice
	{
		get
		{
			return _selectedDevice;
		}
		set
		{
			if (_selectedDevice == value)
			{
				return;
			}
			if (_selectedDevice is HIDDevice)
			{
				_selectedDevice.PropertyChanged -= onDevicePropertyChanged;
				(_selectedDevice as HIDDevice).PropertyChanged -= onDevicePropertyChanged;
				if (typeof(HIDMouse).IsInstanceOfType(_selectedDevice))
				{
					(_selectedDevice as HIDMouse).Profiles.CollectionChanged -= onProfileListChanged;
					(_selectedDevice as HIDMouse).Loaded -= onDeviceProfilesLoaded;
				}
			}
			_selectedDevice = value;
			SetValue(SelectedDeviceProperty, value);
			HIDDevice obj = _selectedDevice as HIDDevice;
			OnPropertyChanged("SelectedDevice");
			if (obj != null)
			{
				onDeviceSelected();
				if (typeof(HIDMouse).IsInstanceOfType(_selectedDevice))
				{
					(_selectedDevice as HIDMouse).Profiles.CollectionChanged += onProfileListChanged;
					(_selectedDevice as HIDMouse).Loaded += onDeviceProfilesLoaded;
				}
				_selectedDevice.PropertyChanged += onDevicePropertyChanged;
				(_selectedDevice as HIDDevice).PropertyChanged += onDevicePropertyChanged;
			}
		}
	}

	public OnboardMemoryManager.Models.Profile SelectedProfile
	{
		get
		{
			return (OnboardMemoryManager.Models.Profile)GetValue(SelectedProfileProperty);
		}
		set
		{
			if (_selectedProfile == value)
			{
				return;
			}
			if (value is HIDProfile { Device: not null } hIDProfile)
			{
				if (hIDProfile.Device is HIDMouse { IsLoaded: false })
				{
					return;
				}
				Binding binding = new Binding("Advanced");
				binding.Source = hIDProfile;
				AdvancedCheckBox.SetBinding(ToggleButton.IsCheckedProperty, binding);
			}
			else
			{
				BindingOperations.ClearBinding(AdvancedCheckBox, ToggleButton.IsCheckedProperty);
				AdvancedCheckBox.IsChecked = false;
			}
			SetValue(SelectedProfileProperty, value);
			_selectedProfile = value;
			OnPropertyChanged("SelectedProfile");
		}
	}

	public bool ProfilesToggleVisible
	{
		get
		{
			return (bool)GetValue(ProfilesToggleVisibleProperty);
		}
		set
		{
			if (value != ProfilesToggleVisible)
			{
				SetValue(ProfilesToggleVisibleProperty, value);
				OnPropertyChanged("ProfilesToggleVisible");
			}
		}
	}

	private bool IsInterfaceUnlocked
	{
		get
		{
			return (bool)GetValue(IsInterfaceUnlockedProperty);
		}
		set
		{
			if (value != IsInterfaceUnlocked)
			{
				SetValue(IsInterfaceUnlockedProperty, value);
				OnPropertyChanged("IsInterfaceUnlocked");
			}
		}
	}

	private bool IsDeviceConfigurationVisible
	{
		get
		{
			return (bool)GetValue(IsDeviceConfigurationVisibleProperty);
		}
		set
		{
			if (value != IsDeviceConfigurationVisible)
			{
				SetValue(IsDeviceConfigurationVisibleProperty, value);
				OnPropertyChanged("IsInterfaceUnlocked");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	private static void OnSelectedDevicePropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		(sender as DevicePage).SelectedDevice = (Device)e.NewValue;
	}

	private static void OnSelectedProfilePropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		(sender as DevicePage).SelectedProfile = (OnboardMemoryManager.Models.Profile)e.NewValue;
	}

	public void Dispose()
	{
		_cancellation_token_source.Dispose();
		GC.SuppressFinalize(this);
	}

	public DevicePage()
	{
		InitializeComponent();
		base.Dispatcher.Invoke(delegate
		{
			Hyperlink hyperlink = new Hyperlink(new Run(OnboardMemoryManager.Properties.Resources.Settings_Update_Check));
			hyperlink.NavigateUri = SettingsPage.UpdateURI;
			hyperlink.RequestNavigate += Hyperlink_RequestNavigate;
			Brush foreground = (Brush)Application.Current.Resources["ColorBrush.Primary"];
			hyperlink.Foreground = foreground;
			hyperlink.Cursor = Cursors.Hand;
			hyperlink.TextDecorations = TextDecorations.Underline;
			ProfileLoadingErrorView.TextContentControl.Inlines.Add(hyperlink);
			ProfileLoadingErrorView.TextContentControl = new TextBlock
			{
				Text = ""
			};
		});
		base.Loaded += OnPageLoaded;
		AddHandler(MainWindow.OnInterfaceShouldLockEvent, new RoutedEventHandler(onInterfaceShouldLock));
		AddHandler(MainWindow.OnInterfaceShouldUnlockEvent, new RoutedEventHandler(onInterfaceShouldUnlock));
	}

	private void onInterfaceShouldLock(object sender, RoutedEventArgs e)
	{
		IsInterfaceUnlocked = false;
		Save_Btn.IsEnabled = false;
		Reset_Btn.IsEnabled = false;
	}

	private void onInterfaceShouldUnlock(object sender, RoutedEventArgs e)
	{
		IsInterfaceUnlocked = true;
		refreshSaveResetButtons();
	}

	private void OnPageLoaded(object sender, RoutedEventArgs e)
	{
		DevicesController devicesControllerInstance = (Application.Current as App).DevicesControllerInstance;
		string currentSelection = DevicePageSingleton.Instance.CurrentSelection;
		DeviceCombo.ItemsSource = devicesControllerInstance;
		_shouldRespondToDeviceArrival = false;
		devicesControllerInstance.CollectionChanged += OnDeviceListChanged;
		devicesControllerInstance.OnProfileModifiedStateChanged += onProfileModifiedStateChanged;
		PairingControl.OnFinish += delegate
		{
			WindowHelpers.CloseAllPopups();
			setDeviceConfigurationVisibility(Visibility.Visible);
			PairingControl.Visibility = Visibility.Collapsed;
		};
		devicesControllerInstance.Start();
		Device device = null;
		if (devicesControllerInstance.Count() > 0)
		{
			foreach (Device item in devicesControllerInstance)
			{
				if (item is HIDDevice hIDDevice && hIDDevice.Id == currentSelection)
				{
					device = item;
				}
			}
			if (device != null)
			{
				SelectedDevice = device;
			}
			else
			{
				selectPreferredDevice();
			}
		}
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			await Task.Delay(1000);
			_shouldRespondToDeviceArrival = true;
			if (SelectedDevice == null)
			{
				selectPreferredDevice();
			}
		});
		setPanelVisibility();
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			await Task.Delay(1000);
			_shouldRespondToReceiverArrival = true;
			if (typeof(HIDReceiver).IsInstanceOfType(_selectedDevice))
			{
				base.Dispatcher.Invoke(delegate
				{
					WindowHelpers.CloseAllPopups();
					setDeviceConfigurationVisibility(Visibility.Collapsed);
					PairingControl.Visibility = Visibility.Visible;
				});
			}
		});
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	private void OnDeviceSelected(object sender, SelectionChangedEventArgs e)
	{
		HIDDevice hIDDevice = SelectedDevice as HIDDevice;
		DevicePageSingleton.Instance.CurrentSelection = hIDDevice?.Id;
	}

	private void OnDeviceListChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.NewItems != null && e.NewItems.Count > 0)
		{
			if (_shouldRespondToDeviceArrival)
			{
				HIDDevice selectedDevice = (HIDDevice)(_lastDevice = e.NewItems[0] as HIDDevice);
				if (DeviceCombo.IsEnabled || SelectedDevice == null)
				{
					if (_shouldRespondToDeviceArrival)
					{
						SelectedDevice = selectedDevice;
					}
					else
					{
						selectPreferredDevice();
					}
				}
			}
		}
		else
		{
			DevicesController devicesControllerInstance = (Application.Current as App).DevicesControllerInstance;
			if (devicesControllerInstance.Count > 0)
			{
				if (_lastDevice != null && devicesControllerInstance.Contains(_lastDevice))
				{
					SelectedDevice = _lastDevice;
				}
				else
				{
					selectPreferredDevice();
				}
			}
		}
		setPanelVisibility();
	}

	private void selectPreferredDevice()
	{
		DevicesController devicesControllerInstance = (Application.Current as App).DevicesControllerInstance;
		foreach (Device device in devicesControllerInstance)
		{
			if (device is HIDMouse)
			{
				base.Dispatcher.Invoke(delegate
				{
					SelectedDevice = device;
				});
				return;
			}
		}
		foreach (Device device2 in devicesControllerInstance)
		{
			if (device2 is HIDReceiver)
			{
				base.Dispatcher.Invoke(delegate
				{
					SelectedDevice = device2;
				});
				break;
			}
		}
	}

	private void OnToggleProfileEnabled(object sender, RoutedEventArgs e)
	{
		if (!(sender is Button child))
		{
			return;
		}
		ComboBoxItem comboBoxItem = ComponentTreeTraversers.FindParent<ComboBoxItem>(child);
		if (comboBoxItem == null)
		{
			return;
		}
		HIDProfile profile = comboBoxItem.Content as HIDProfile;
		if (profile == null)
		{
			return;
		}
		HIDMouse mouseDevice = _selectedDevice as HIDMouse;
		if (mouseDevice == null || (mouseDevice.Profiles.Where((OnboardMemoryManager.Models.Profile p) => p.Enabled).Count() == 1 && profile.Enabled))
		{
			return;
		}
		bool isSelected = profile == ProfileCombo.SelectedItem as HIDProfile;
		profile.Enabled = !profile.Enabled;
		Task.Run(async delegate
		{
			await profile.OnboardProfileDirectoryEntry.Controller.Write();
			if (isSelected)
			{
				if (!profile.Enabled)
				{
					await mouseDevice.RefreshActiveProfile();
				}
				else if (!mouseDevice.IsInHostMode)
				{
					await mouseDevice.SetActiveProfile(profile.ProfileID);
				}
			}
			recheckProfileCycleWarnings();
		}, mouseDevice.CancellationTokenSrc.Token);
	}

	private void OnProfileSelected(object sender, SelectionChangedEventArgs e)
	{
		ProfileUI.ProfileModel = ProfileCombo.SelectedItem as OnboardMemoryManager.Models.Profile;
		HIDMouse mouseDevice = SelectedDevice as HIDMouse;
		if (mouseDevice == null || ProfileUI.ProfileModel == null)
		{
			return;
		}
		int profileId = 0;
		base.Dispatcher.Invoke(delegate
		{
			profileId = ProfileUI.ProfileModel.ProfileID;
		});
		if (mouseDevice.IsInHostMode)
		{
			return;
		}
		int num = 0;
		if (mouseDevice.ActiveProfile != null)
		{
			num = mouseDevice.ActiveProfile.ProfileID;
		}
		if (num != profileId)
		{
			Task.Run(async delegate
			{
				await mouseDevice.SetActiveProfile(profileId);
			});
		}
	}

	private void onDevicePropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "BatteryLevel" || e.PropertyName == "ChargeState" || e.PropertyName == "Percent" || e.PropertyName == "IsBatteryRemoved")
		{
			HIDMouse device = SelectedDevice as HIDMouse;
			if (device != null)
			{
				BatteryStatusControl.BatteryLevel = device.BatteryLevel;
				BatteryStatusControl.ChargeState = device.ChargeState;
				BatteryStatusControl.Percent = device.Percent;
				BatteryStatusControl.Percent = device.Percent;
				BatteryStatusControl.IsBatteryRemoved = device.IsBatteryRemoved;
				BatteryStatusPercentage.Visibility = (BatteryStatusControl.IsBatteryRemoved ? Visibility.Collapsed : Visibility.Visible);
				base.Dispatcher.Invoke(delegate
				{
					if (device.BatteryLevel == Battery.BATTERY_LEVEL.UNDEFINED)
					{
						BatteryStatusControl.Visibility = Visibility.Collapsed;
					}
					else
					{
						BatteryStatusControl.Visibility = Visibility.Visible;
					}
				});
			}
		}
		if (e.PropertyName == "ActiveProfile")
		{
			selectActiveProfile();
		}
		if (e.PropertyName == "IsConnected" && !(SelectedDevice is HIDMouse { IsConnected: not false }))
		{
			SelectedProfile = null;
		}
	}

	private void onProfileListChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (_selectedDevice is HIDMouse hIDMouse && _selectedProfile == null)
		{
			if (hIDMouse.IsLoaded && hIDMouse.ActiveProfile != null)
			{
				SelectedProfile = hIDMouse.ActiveProfile;
			}
			else if (hIDMouse.Profiles.Count() > 0)
			{
				SelectedProfile = hIDMouse.Profiles[0];
			}
		}
	}

	private void selectActiveProfile()
	{
		HIDMouse mouseDevice = _selectedDevice as HIDMouse;
		if (mouseDevice == null || !mouseDevice.IsLoaded || !mouseDevice.IsFormatSupported)
		{
			return;
		}
		base.Dispatcher.Invoke(delegate
		{
			ProfileCombo.ItemsSource = mouseDevice.Profiles;
			if (mouseDevice.Profiles.Count() > 0)
			{
				SelectedProfile = mouseDevice.ActiveProfile ?? mouseDevice.Profiles[0];
			}
			ProfilesToggleVisible = mouseDevice.Profiles.Count() != 1;
		});
	}

	private void Settings_Link_Clicked(object sender, RoutedEventArgs e)
	{
		(Application.Current.MainWindow as MainWindow).DisplaySettingsPage();
	}

	private void Reset_Click(object sender, RoutedEventArgs e)
	{
		if (ProfileUI.ProfileModel is HIDProfile hIDProfile && hIDProfile.Device is HIDDevice && hIDProfile.Dirty)
		{
			hIDProfile.Reset();
			recheckProfileCycleWarnings();
		}
	}

	private void Restore_Click(object sender, RoutedEventArgs e)
	{
		CustomConfirmationDialogPage confirmationDialog = new CustomConfirmationDialogPage();
		confirmationDialog.CancelButton.Click += delegate
		{
			((Window)confirmationDialog.Parent).Close();
		};
		confirmationDialog.RestoreButton.Click += delegate
		{
			HIDProfile profile = ProfileUI.ProfileModel as HIDProfile;
			if (profile != null && profile.Device is HIDDevice hIDDevice)
			{
				Task.Run(async delegate
				{
					if (profile.Dirty)
					{
						profile.Reset();
						recheckProfileCycleWarnings();
					}
					await profile.LoadOOBProfile();
					profile.ResetBunnyHoppingTimeoutCache();
				}, hIDDevice.CancellationTokenSrc.Token);
				((Window)confirmationDialog.Parent).Close();
			}
		};
		base.Opacity = 0.2;
		MainWindow obj = new MainWindow
		{
			Content = confirmationDialog,
			WindowStartupLocation = WindowStartupLocation.CenterScreen,
			ResizeMode = ResizeMode.NoResize
		};
		((MetroWindow)obj).ShowCloseButton = false;
		((Window)(object)obj).ShowDialog();
		base.Opacity = 1.0;
	}

	private void Save_Click(object sender, RoutedEventArgs e)
	{
		_ = (Application.Current as App).DevicesControllerInstance;
		if (!(SelectedDevice is HIDMouse hIDMouse))
		{
			return;
		}
		foreach (OnboardMemoryManager.Models.Profile profile in hIDMouse.Profiles)
		{
			if (profile is HIDProfile { Dirty: not false })
			{
				string text = ProfileUI.LocalStateValid();
				if (text != "")
				{
					MessageBox.Show(text, OnboardMemoryManager.Properties.Resources.Profile_Invalid, MessageBoxButton.OK, MessageBoxImage.Exclamation);
					return;
				}
			}
		}
		foreach (OnboardMemoryManager.Models.Profile profile2 in hIDMouse.Profiles)
		{
			HIDProfile hidProfile = profile2 as HIDProfile;
			if (hidProfile != null && hidProfile.Dirty)
			{
				Task.Run(async delegate
				{
					await hidProfile.Write();
				}, hIDMouse.CancellationTokenSrc.Token);
			}
		}
	}

	private void onProfileModifiedStateChanged(object sender, DevicesController.OnProfileModifiedStateChangedEventArgs e)
	{
		refreshSaveResetButtons();
	}

	private void onDeviceProfilesLoaded(object sender, EventArgs e)
	{
		setVisibiltyForDevice(_selectedDevice);
		selectActiveProfile();
	}

	private void onDeviceSelected()
	{
		if (typeof(HIDReceiver).IsInstanceOfType(_selectedDevice))
		{
			base.Dispatcher.Invoke(delegate
			{
				PairingControl.Receiver = _selectedDevice as HIDReceiver;
				PairingControl.PairedDevice = null;
			});
			if (_shouldRespondToReceiverArrival)
			{
				base.Dispatcher.Invoke(delegate
				{
					WindowHelpers.CloseAllPopups();
					setDeviceConfigurationVisibility(Visibility.Collapsed);
					PairingControl.Visibility = Visibility.Visible;
				});
			}
		}
		else
		{
			if (!typeof(HIDMouse).IsInstanceOfType(_selectedDevice))
			{
				return;
			}
			_ = Application.Current;
			HIDMouse mouseDevice = _selectedDevice as HIDMouse;
			HIDReceiver receiver = mouseDevice.Parent as HIDReceiver;
			if (receiver != null)
			{
				Task.Run(async delegate
				{
					if (!(await receiver.IsCompatible(skip_child_mouse_device_check: true)))
					{
						receiver = null;
					}
				}, mouseDevice.CancellationTokenSrc.Token).Wait();
			}
			base.Dispatcher.Invoke(delegate
			{
				SelectedProfile = null;
				PairingControl.Receiver = receiver;
				PairingControl.PairedDevice = mouseDevice;
			});
			if (mouseDevice == null)
			{
				return;
			}
			setVisibiltyForDevice(mouseDevice);
			base.Dispatcher.Invoke(delegate
			{
				ProfileCombo.ItemsSource = mouseDevice.Profiles;
				if (mouseDevice.IsLoaded)
				{
					selectActiveProfile();
				}
				BatteryStatusControl.BatteryLevel = _selectedDevice.BatteryLevel;
				BatteryStatusControl.ChargeState = _selectedDevice.ChargeState;
				BatteryStatusControl.Percent = _selectedDevice.Percent;
				BatteryStatusControl.IsBatteryRemoved = _selectedDevice.IsBatteryRemoved;
				BatteryStatusPercentage.Visibility = (BatteryStatusControl.IsBatteryRemoved ? Visibility.Collapsed : Visibility.Visible);
				ConnectionStatusControl.ActiveConnectionType = (_selectedDevice as HIDDevice).ActiveConnectionType;
			});
		}
	}

	private void Pair_Click(object sender, RoutedEventArgs e)
	{
		Keyboard.ClearFocus();
		WindowHelpers.CloseAllPopups();
		setDeviceConfigurationVisibility(Visibility.Collapsed);
		PairingControl.Visibility = Visibility.Visible;
	}

	private void Hyperlink_RequestNavigate(object sender, RequestNavigateEventArgs e)
	{
		Process.Start(new ProcessStartInfo(e.Uri.AbsoluteUri));
		e.Handled = true;
	}

	private void recheckProfileCycleWarnings()
	{
		if (!(_selectedDevice is HIDMouse hIDMouse) || hIDMouse.Profiles.Count == 0)
		{
			return;
		}
		HIDProfile hIDProfile = hIDMouse.Profiles.Where((OnboardMemoryManager.Models.Profile p) => p.Enabled).First() as HIDProfile;
		foreach (OnboardMemoryManager.Controllers.Assignment assignment in hIDProfile.Assignments)
		{
			assignment.CheckProfileCycleWarning();
		}
		foreach (OnboardMemoryManager.Controllers.Assignment gShiftAssignment in hIDProfile.GShiftAssignments)
		{
			gShiftAssignment.CheckProfileCycleWarning();
		}
	}

	private void refreshSaveResetButtons()
	{
		if (SelectedDevice == null || !(SelectedDevice is HIDMouse hIDMouse))
		{
			return;
		}
		int num = 0;
		foreach (OnboardMemoryManager.Models.Profile profile in hIDMouse.Profiles)
		{
			if (profile is HIDProfile { Dirty: not false })
			{
				num++;
			}
		}
		Restore_Btn.Visibility = ((!hIDMouse.HasOOBProfiles) ? Visibility.Collapsed : Visibility.Visible);
		Button save_Btn = Save_Btn;
		bool isEnabled = (Reset_Btn.IsEnabled = num > 0);
		save_Btn.IsEnabled = isEnabled;
		TextBlock textBlock = ComponentTreeTraversers.FindVisualChild<TextBlock>(Save_Btn);
		Binding binding = new Binding
		{
			Source = ((num > 1) ? OnboardMemoryManager.Properties.Resources.Save_n_profiles.Replace("{0}", num.ToString()) : OnboardMemoryManager.Properties.Resources.Save),
			Converter = new StringToUpperConverter()
		};
		textBlock?.SetBinding(TextBlock.TextProperty, binding);
	}

	private void setVisibiltyForDevice(Device device)
	{
		if (!typeof(HIDMouse).IsInstanceOfType(device))
		{
			return;
		}
		base.Dispatcher.Invoke((Func<Task>)async delegate
		{
			HIDMouse hIDMouse = device as HIDMouse;
			if (!hIDMouse.IsLoaded)
			{
				WindowHelpers.CloseAllPopups();
				showLoadingNotification();
			}
			else if (!hIDMouse.IsFormatSupported)
			{
				WindowHelpers.CloseAllPopups();
				showDeviceNotSupportedNotification();
			}
			else
			{
				ProfileLoadingErrorView.Visibility = Visibility.Collapsed;
				DeviceLoadingView.Visibility = Visibility.Collapsed;
				if (PairingControl.PairingStatus == Pairing.PAIRINGSTATE.INACTIVE)
				{
					WindowHelpers.CloseAllPopups();
					setDeviceConfigurationVisibility(Visibility.Visible);
					PairingControl.Visibility = Visibility.Collapsed;
				}
				if (_selectedDevice.BatteryLevel == Battery.BATTERY_LEVEL.UNDEFINED)
				{
					BatteryStatusControl.Visibility = Visibility.Collapsed;
				}
				else
				{
					BatteryStatusControl.Visibility = Visibility.Visible;
				}
			}
		});
	}

	private void setPanelVisibility()
	{
		bool flag = DeviceCombo.Items.Count > 0;
		bool flag2 = !flag;
		if (_showGHUBWarning)
		{
			flag = false;
			flag2 = false;
		}
		else if (_selectedDevice is HIDReceiver)
		{
			setDeviceConfigurationVisibility(Visibility.Collapsed);
			showPairingControl();
			return;
		}
		setDeviceConfigurationVisibility((!flag) ? Visibility.Collapsed : Visibility.Visible);
		NoDevicesView.Visibility = ((!flag2) ? Visibility.Collapsed : Visibility.Visible);
	}

	private void setDeviceConfigurationVisibility(Visibility visibility)
	{
		IsDeviceConfigurationVisible = visibility == Visibility.Visible;
		PairingControl.Visibility = visibility;
		Restore_Btn.Visibility = visibility;
		if (_selectedDevice != null)
		{
			if (_selectedDevice.BatteryLevel == Battery.BATTERY_LEVEL.UNDEFINED)
			{
				DeviceStatusControl.Visibility = Visibility.Collapsed;
			}
			else
			{
				DeviceStatusControl.Visibility = Visibility.Visible;
			}
		}
		else
		{
			DeviceStatusControl.Visibility = Visibility.Collapsed;
		}
	}

	private void showPairingControl()
	{
		PairingControl.Visibility = Visibility.Visible;
		NoDevicesView.Visibility = Visibility.Collapsed;
		ProfileLoadingErrorView.Visibility = Visibility.Collapsed;
		DeviceLoadingView.Visibility = Visibility.Collapsed;
	}

	private void showLoadingNotification()
	{
		PairingControl.Visibility = Visibility.Collapsed;
		NoDevicesView.Visibility = Visibility.Collapsed;
		ProfileLoadingErrorView.Visibility = Visibility.Collapsed;
		DeviceLoadingView.Visibility = Visibility.Visible;
		setDeviceConfigurationVisibility(Visibility.Collapsed);
	}

	private void showDeviceNotSupportedNotification()
	{
		PairingControl.Visibility = Visibility.Collapsed;
		NoDevicesView.Visibility = Visibility.Collapsed;
		ProfileLoadingErrorView.Visibility = Visibility.Visible;
		DeviceLoadingView.Visibility = Visibility.Collapsed;
		setDeviceConfigurationVisibility(Visibility.Collapsed);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/pages/mainpage.xaml", UriKind.Relative);
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
			DevicesView = (Grid)target;
			break;
		case 2:
			GLogoMain = (Image)target;
			break;
		case 3:
			DeviceCombo = (ComboSelect)target;
			break;
		case 5:
			ProfileCombo = (ComboSelect)target;
			break;
		case 6:
			Reset_Btn = (Button)target;
			Reset_Btn.Click += Reset_Click;
			break;
		case 7:
			Save_Btn = (Button)target;
			Save_Btn.Click += Save_Click;
			break;
		case 8:
			Settings_Link = (MaskedButton)target;
			break;
		case 9:
			DeviceStatusControl = (StackPanel)target;
			break;
		case 10:
			BatteryStatusPercentage = (TextBlock)target;
			break;
		case 11:
			BatteryStatusControl = (BatteryStatus)target;
			break;
		case 12:
			ConnectionStatusControl = (ConnectionStatus)target;
			break;
		case 13:
			PairingLinkControl = (StackPanel)target;
			break;
		case 14:
			PairingLink = (Button)target;
			PairingLink.Click += Pair_Click;
			break;
		case 15:
			Restore_Btn = (StackPanel)target;
			break;
		case 16:
			RestoreLink = (Button)target;
			RestoreLink.Click += Restore_Click;
			break;
		case 17:
			Advanced_Toggle = (StackPanel)target;
			break;
		case 18:
			AdvancedCheckBox = (CheckBox)target;
			break;
		case 19:
			DeviceConfigurationView = (Grid)target;
			break;
		case 20:
			ProfileUI = (OnboardMemoryManager.Components.Profile)target;
			break;
		case 21:
			HostModeWarning = (Border)target;
			break;
		case 22:
			((Hyperlink)target).RequestNavigate += Hyperlink_RequestNavigate;
			break;
		case 23:
			DeviceNotificationsView = (StackPanel)target;
			break;
		case 24:
			NoDevicesView = (Notification)target;
			break;
		case 25:
			PairingControl = (Pairing)target;
			break;
		case 26:
			ProfileLoadingErrorView = (Notification)target;
			break;
		case 27:
			DeviceLoadingView = (Notification)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		if (connectionId == 4)
		{
			((Button)target).Click += OnToggleProfileEnabled;
		}
	}
}
