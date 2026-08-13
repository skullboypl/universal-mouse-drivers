using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using OnboardMemoryManager.Properties;
using logi.hidppio;

namespace OnboardMemoryManager.Components;

public class Pairing : UserControl, IDisposable, INotifyPropertyChanged, IComponentConnector
{
	public enum PAIRINGSTATE
	{
		INACTIVE,
		PAIRING,
		UNPAIRING
	}

	private bool _hasInterfaceLock;

	private HIDReceiver _pairingReceiver;

	private PAIRINGSTATE _state;

	private bool disposed;

	public static DependencyProperty ReceiverProperty = DependencyProperty.Register("Receiver", typeof(HIDReceiver), typeof(Pairing), new PropertyMetadata(null, onReceiverPropertyChanged));

	public static DependencyProperty PairedDeviceProperty = DependencyProperty.Register("PairedDevice", typeof(HIDDevice), typeof(Pairing), new PropertyMetadata(null, onPairedDevicePropertyChanged));

	internal Notification PairingNotification;

	private bool _contentLoaded;

	public HIDReceiver Receiver
	{
		get
		{
			return (HIDReceiver)GetValue(ReceiverProperty);
		}
		set
		{
			HIDReceiver hIDReceiver = (HIDReceiver)GetValue(ReceiverProperty);
			if (value != hIDReceiver || value == null)
			{
				SetValue(ReceiverProperty, value);
				onReceiverChanged(hIDReceiver, value);
				OnPropertyChanged("Receiver");
			}
		}
	}

	public HIDDevice PairedDevice
	{
		get
		{
			return (HIDDevice)GetValue(PairedDeviceProperty);
		}
		set
		{
			HIDDevice hIDDevice = (HIDDevice)GetValue(PairedDeviceProperty);
			if (value != hIDDevice)
			{
				SetValue(PairedDeviceProperty, value);
				if (_state == PAIRINGSTATE.PAIRING)
				{
					_state = PAIRINGSTATE.INACTIVE;
					setDefaultState();
				}
				else if (_state == PAIRINGSTATE.UNPAIRING)
				{
					setUnpairSuccessState();
				}
				else
				{
					setDefaultState();
				}
				setCancelEnable(value != null);
				OnPropertyChanged("PairedDevice");
			}
		}
	}

	public PAIRINGSTATE PairingStatus => _state;

	public event PropertyChangedEventHandler PropertyChanged;

	public event EventHandler OnFinish;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public Pairing()
	{
		InitializeComponent();
		base.Loaded += onPairingLoaded;
	}

	~Pairing()
	{
		Dispose(disposing: false);
	}

	public void Dispose()
	{
		Dispose(disposing: true);
		GC.SuppressFinalize(this);
	}

	protected virtual void Dispose(bool disposing)
	{
		if (!disposed)
		{
			cancelPairing(appClosing: true);
			if (_hasInterfaceLock)
			{
				RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
			}
			disposed = true;
		}
	}

	private void onReceiverChanged(HIDReceiver oldReceiver, HIDReceiver newReceiver)
	{
		if (oldReceiver != null)
		{
			oldReceiver.PairedDeviceAdded -= onPairedDeviceAdded;
			oldReceiver.PairedDeviceRemoved -= onPairedDeviceRemoved;
		}
		if (newReceiver != null)
		{
			newReceiver.PairedDeviceAdded += onPairedDeviceAdded;
			newReceiver.PairedDeviceRemoved += onPairedDeviceRemoved;
		}
		if (_state == PAIRINGSTATE.INACTIVE && !_hasInterfaceLock)
		{
			setDefaultState();
		}
	}

	private async void onPairedDeviceAdded(HIDReceiver receiver, HIDDevice newDevice)
	{
		HIDMouse hIDMouse = newDevice as HIDMouse;
		if (_state == PAIRINGSTATE.PAIRING && hIDMouse != null && await hIDMouse.IsCompatible())
		{
			base.Dispatcher.Invoke(delegate
			{
				PairedDevice = newDevice;
			});
		}
	}

	private void onPairedDeviceRemoved(HIDReceiver receiver, HIDDevice newDevice)
	{
		_ = newDevice;
		base.Dispatcher.Invoke(delegate
		{
			if (PairedDevice == newDevice)
			{
				PairedDevice = null;
			}
		});
	}

	private void onPairingLoaded(object sender, RoutedEventArgs e)
	{
		setDefaultState();
		setCancelEnable(PairedDevice != null);
	}

	private void startPairing(HIDReceiver receiver = null)
	{
		if (receiver == null)
		{
			receiver = (HIDReceiver)GetValue(ReceiverProperty);
		}
		if (receiver == null)
		{
			Console.WriteLine("Cannot start pairing, no receiver set!");
			return;
		}
		_pairingReceiver = receiver;
		lock (_pairingReceiver)
		{
			if (_state == PAIRINGSTATE.PAIRING)
			{
				return;
			}
			_hasInterfaceLock = true;
			RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldLockEvent));
			bool raisedError = false;
			Task.Factory.StartNew((Func<Task>)async delegate
			{
				_ = 1;
				try
				{
					HIDDevice hIDDevice = _pairingReceiver.PairedDevices.Where((HIDDevice device) => (int)device.DeviceType == 2).FirstOrDefault();
					if (hIDDevice != null)
					{
						setActivityState(OnboardMemoryManager.Properties.Resources.Unpair_Activity);
						await _pairingReceiver.Unpair(hIDDevice.Index);
						setUnpairSuccessState();
						Thread.Sleep(1000);
					}
					_state = PAIRINGSTATE.PAIRING;
					setActivityState(OnboardMemoryManager.Properties.Resources.Pair_Continuation_Prompt);
					await _pairingReceiver.Pair();
					setPairSuccessState();
					Thread.Sleep(1500);
				}
				catch (Exception ex)
				{
					raisedError = true;
					if (!ex.Message.Contains("timeout"))
					{
						throw ex;
					}
					setErrorState(OnboardMemoryManager.Properties.Resources.Pair_Timeout);
				}
				base.Dispatcher.Invoke(delegate
				{
					RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
				});
				_hasInterfaceLock = false;
				_state = PAIRINGSTATE.INACTIVE;
				_pairingReceiver = null;
				if (!raisedError)
				{
					base.Dispatcher.Invoke(delegate
					{
						onFinish();
					});
					setDefaultState();
				}
			});
		}
	}

	private void startUnpairing(HIDReceiver receiver = null)
	{
		//IL_0082: Unknown result type (might be due to invalid IL or missing references)
		//IL_0087: Unknown result type (might be due to invalid IL or missing references)
		if (receiver == null)
		{
			receiver = (HIDReceiver)GetValue(ReceiverProperty);
		}
		if (receiver == null)
		{
			Console.WriteLine("Cannot start unpairing, no receiver set!");
			return;
		}
		setActivityState(OnboardMemoryManager.Properties.Resources.Unpair_Activity);
		_pairingReceiver = receiver;
		lock (_pairingReceiver)
		{
			if (_state != PAIRINGSTATE.INACTIVE)
			{
				return;
			}
			_state = PAIRINGSTATE.UNPAIRING;
			_hasInterfaceLock = true;
			RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldLockEvent));
			HidppDeviceIndex index = PairedDevice.Index;
			Task.Factory.StartNew((Func<Task>)async delegate
			{
				try
				{
					await _pairingReceiver.Unpair(index);
				}
				catch (Exception ex)
				{
					if (ex.Message == "timeout")
					{
						setErrorState(OnboardMemoryManager.Properties.Resources.Unpair_Timeout);
						base.Dispatcher.Invoke(delegate
						{
							RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
						});
						_hasInterfaceLock = false;
						_state = PAIRINGSTATE.INACTIVE;
						return;
					}
					throw ex;
				}
			});
			base.Dispatcher.Invoke(delegate
			{
				RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
			});
			_hasInterfaceLock = false;
			_state = PAIRINGSTATE.INACTIVE;
			_pairingReceiver = null;
		}
	}

	private void cancelPairing(bool appClosing = false)
	{
		if (_state != PAIRINGSTATE.PAIRING)
		{
			return;
		}
		_pairingReceiver = null;
		_state = PAIRINGSTATE.INACTIVE;
		if (!appClosing)
		{
			base.Dispatcher.Invoke(delegate
			{
				RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
			});
		}
		_hasInterfaceLock = false;
	}

	private void cancelUnpairing()
	{
		if (_state == PAIRINGSTATE.UNPAIRING)
		{
			_pairingReceiver = null;
			_state = PAIRINGSTATE.INACTIVE;
			RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
			_hasInterfaceLock = false;
		}
	}

	private static void onReceiverPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Pairing).Receiver = e.NewValue as HIDReceiver;
	}

	private static void onPairedDevicePropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Pairing).PairedDevice = e.NewValue as HIDDevice;
	}

	private async void setDefaultState()
	{
		resetIcon();
		bool isPaired = false;
		string titleText = OnboardMemoryManager.Properties.Resources.Pair_Title;
		string statusText = OnboardMemoryManager.Properties.Resources.Pair_Intro;
		await base.Dispatcher.Invoke((Func<Task>)async delegate
		{
			HIDReceiver hIDReceiver = (HIDReceiver)GetValue(ReceiverProperty);
			if (PairedDevice != null)
			{
				if (PairedDevice.IsConnected)
				{
					string newValue = await PairedDevice.GetDeviceName();
					titleText = OnboardMemoryManager.Properties.Resources.Unpair_Title.Replace("{0}", newValue);
					statusText = OnboardMemoryManager.Properties.Resources.Unpair_Intro_Connected;
					isPaired = true;
				}
				else
				{
					titleText = OnboardMemoryManager.Properties.Resources.Paired_Device;
					statusText = OnboardMemoryManager.Properties.Resources.Unpair_Intro;
					isPaired = true;
				}
			}
			else if (hIDReceiver != null && hIDReceiver.PairedDevices.Where((HIDDevice device) => (int)device.DeviceType == 2).FirstOrDefault() != null)
			{
				titleText = OnboardMemoryManager.Properties.Resources.Paired_Device;
				statusText = OnboardMemoryManager.Properties.Resources.Unpair_Intro;
				isPaired = true;
			}
			setStatusTitle(titleText);
			setStatusText(statusText);
		});
		setActionEnable(enabled: true);
		setActionText(isPaired ? OnboardMemoryManager.Properties.Resources.Unpair_Device.ToUpper() : OnboardMemoryManager.Properties.Resources.Begin_Pairing.ToUpper());
	}

	private void setActivityState(string text)
	{
		resetIcon();
		setIconAnimation(Notification.ICON_ANIMATIONS.JAZZYROTATE);
		setStatusText(text);
		setActionEnable(enabled: false);
	}

	private void setErrorState(string text)
	{
		setStatusText(text);
		setIconAnimation(Notification.ICON_ANIMATIONS.NONE);
		setIcon(new Uri("pack://application:,,,/OnboardMemoryManager;component/Resources/error.png"));
		setActionEnable(enabled: true);
		setActionText((_state == PAIRINGSTATE.PAIRING) ? OnboardMemoryManager.Properties.Resources.Pair_Retry.ToUpper() : OnboardMemoryManager.Properties.Resources.Unpair_Retry.ToUpper());
	}

	private void setPairSuccessState()
	{
		setStatusText(OnboardMemoryManager.Properties.Resources.Pair_Succeeded);
		setIconAnimation(Notification.ICON_ANIMATIONS.NONE);
		setIcon(new Uri("pack://application:,,,/OnboardMemoryManager;component/Resources/success.png"));
		setActionEnable(enabled: false);
	}

	private void setUnpairSuccessState()
	{
		setStatusText(OnboardMemoryManager.Properties.Resources.Unpair_Succeeded);
		setIconAnimation(Notification.ICON_ANIMATIONS.NONE);
		setIcon(new Uri("pack://application:,,,/OnboardMemoryManager;component/Resources/success.png"));
		setActionEnable(enabled: false);
	}

	private void onFinish()
	{
		this.OnFinish?.Invoke(this, null);
	}

	private void onActionButtonClick(object sender, RoutedEventArgs e)
	{
		startPairing();
	}

	private void onCancelClick(object sender, RoutedEventArgs e)
	{
		if (_state == PAIRINGSTATE.PAIRING)
		{
			cancelPairing();
			setDefaultState();
		}
		else if (_state == PAIRINGSTATE.UNPAIRING)
		{
			cancelUnpairing();
			setDefaultState();
		}
		else
		{
			onFinish();
		}
	}

	private void resetIcon()
	{
		base.Dispatcher.Invoke(delegate
		{
			PairingNotification.Icon = new Uri("pack://application:,,,/OnboardMemoryManager;component/Resources/spinner.png");
			PairingNotification.IconAnimation = Notification.ICON_ANIMATIONS.NONE;
		});
	}

	private void setStatusTitle(string text)
	{
		base.Dispatcher.Invoke(delegate
		{
			PairingNotification.Title = text;
		});
	}

	private void setStatusText(string text)
	{
		base.Dispatcher.Invoke(delegate
		{
			PairingNotification.TextContent = text;
		});
	}

	private void setCancelEnable(bool enabled)
	{
		base.Dispatcher.Invoke(delegate
		{
			ComponentTreeTraversers.FindVisualChildren<Button>(PairingNotification.ContentAfter)[0].IsEnabled = enabled;
		});
	}

	private void setActionEnable(bool enabled)
	{
		base.Dispatcher.Invoke(delegate
		{
			ComponentTreeTraversers.FindVisualChildren<Button>(PairingNotification.ContentAfter)[1].IsEnabled = enabled;
		});
	}

	private void setActionText(string text)
	{
		base.Dispatcher.Invoke(delegate
		{
			(ComponentTreeTraversers.FindVisualChildren<Button>(PairingNotification.ContentAfter)[1].Content as TextBlock).Text = text;
		});
	}

	private void setIcon(Uri icon)
	{
		base.Dispatcher.Invoke(delegate
		{
			PairingNotification.Icon = icon;
		});
	}

	private void setIconAnimation(Notification.ICON_ANIMATIONS animation)
	{
		base.Dispatcher.Invoke(delegate
		{
			PairingNotification.IconAnimation = animation;
		});
	}

	private async Task delayedNavigation()
	{
		await Task.Delay(1250);
		onFinish();
		setDefaultState();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/pairing.xaml", UriKind.Relative);
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
			PairingNotification = (Notification)target;
			break;
		case 2:
			((Button)target).Click += onCancelClick;
			break;
		case 3:
			((Button)target).Click += onActionButtonClick;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
