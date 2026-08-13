using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using Microsoft.Win32;
using OnboardMemoryManager.Models;
using logi.hidppio;
using logi.hidppio.errors;

namespace OnboardMemoryManager.Controllers;

public sealed class DevicesController : ObservableCollection<Device>, IDisposable
{
	public class OnProfileModifiedStateChangedEventArgs : EventArgs
	{
		public bool IsModified { get; set; }
	}

	private readonly Dispatcher dispatcher;

	private readonly HidppDeviceProvider deviceProviderInstance = new HidppDeviceProvider();

	private readonly CancellationTokenSource _cancellation_token_source = new CancellationTokenSource();

	private bool _started;

	private List<HIDDevice> _registeredDevices = new List<HIDDevice>();

	private object _sequentialRemovalLock = new object();

	public event EventHandler<OnProfileModifiedStateChangedEventArgs> OnProfileModifiedStateChanged;

	public DevicesController(Dispatcher dispatcher)
	{
		//IL_0001: Unknown result type (might be due to invalid IL or missing references)
		//IL_000b: Expected O, but got Unknown
		this.dispatcher = dispatcher;
		deviceProviderInstance.DeviceAdded += OnDeviceAdded;
		deviceProviderInstance.DeviceRemoved += OnDeviceRemoved;
	}

	public void Start()
	{
		if (!_started)
		{
			deviceProviderInstance.Start();
			SystemEvents.PowerModeChanged += onPowerChanged;
			SystemEvents.SessionSwitch += onSessionSwitch;
			_started = true;
		}
	}

	public void Dispose()
	{
		deviceProviderInstance.DeviceAdded -= OnDeviceAdded;
		deviceProviderInstance.DeviceRemoved -= OnDeviceRemoved;
		SystemEvents.PowerModeChanged -= onPowerChanged;
		((Disposable)deviceProviderInstance).Dispose();
		_cancellation_token_source.Dispose();
		GC.SuppressFinalize(this);
	}

	public void Add(HIDDevice deviceInstance)
	{
		dispatcher.Invoke(delegate
		{
			Device item = deviceInstance;
			if (!Contains(item))
			{
				Add(item);
			}
		}, DispatcherPriority.Normal, _cancellation_token_source.Token);
	}

	public void Remove(HIDDevice deviceInstance)
	{
		dispatcher.Invoke(delegate
		{
			_ = deviceInstance;
			Remove((Device)deviceInstance);
		}, DispatcherPriority.Normal, _cancellation_token_source.Token);
	}

	private void onPowerChanged(object sender, PowerModeChangedEventArgs e)
	{
		if (e.Mode != PowerModes.Resume)
		{
			return;
		}
		foreach (HIDDevice registeredDevice in _registeredDevices)
		{
			HIDMouse hidMouse = registeredDevice as HIDMouse;
			if (hidMouse != null)
			{
				Task.Run(async delegate
				{
					await hidMouse.RefreshActiveState();
				});
			}
		}
	}

	private void onSessionSwitch(object sender, SessionSwitchEventArgs e)
	{
		if (e.Reason != SessionSwitchReason.SessionUnlock)
		{
			return;
		}
		foreach (HIDDevice registeredDevice in _registeredDevices)
		{
			HIDMouse hidMouse = registeredDevice as HIDMouse;
			if (hidMouse != null)
			{
				Task.Run(async delegate
				{
					await hidMouse.RefreshActiveState();
				});
			}
		}
	}

	private void OnDeviceAdded(DeviceBase hidppDevice)
	{
		//IL_0003: Unknown result type (might be due to invalid IL or missing references)
		//IL_0008: Unknown result type (might be due to invalid IL or missing references)
		//IL_0009: Unknown result type (might be due to invalid IL or missing references)
		//IL_000b: Invalid comparison between Unknown and I4
		//IL_01e3: Expected O, but got Unknown
		//IL_0021: Unknown result type (might be due to invalid IL or missing references)
		//IL_0027: Invalid comparison between Unknown and I4
		//IL_000e: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_003e: Unknown result type (might be due to invalid IL or missing references)
		//IL_004e: Expected O, but got Unknown
		//IL_002a: Unknown result type (might be due to invalid IL or missing references)
		//IL_003a: Expected O, but got Unknown
		//IL_0074: Unknown result type (might be due to invalid IL or missing references)
		//IL_007a: Invalid comparison between Unknown and I4
		//IL_0162: Unknown result type (might be due to invalid IL or missing references)
		//IL_016c: Invalid comparison between Unknown and I4
		try
		{
			HIDDevice hIDDevice = null;
			BaseDeviceType deviceType = hidppDevice.DeviceType;
			hIDDevice = (((int)deviceType == 2) ? new HIDMouse((HidppDevice)hidppDevice, _cancellation_token_source) : (((int)deviceType != 255) ? new HIDDevice((HidppDevice)hidppDevice, _cancellation_token_source) : new HIDReceiver((HidppDevice)hidppDevice, _cancellation_token_source)));
			if (hIDDevice == null)
			{
				return;
			}
			lock (_registeredDevices)
			{
				_registeredDevices.Add(hIDDevice);
				if ((int)deviceType == 255)
				{
					foreach (HIDDevice registeredDevice in _registeredDevices)
					{
						DeviceBase parent = ((DeviceBase)registeredDevice.HidppDeviceHandle).Parent;
						if (parent != null && hIDDevice.Id.Equals(parent.Id) && hIDDevice.IsWireless)
						{
							registeredDevice.Parent = hIDDevice;
							HIDReceiver hIDReceiver = hIDDevice as HIDReceiver;
							hIDReceiver.AddPairedDevice(registeredDevice);
							recheckReceiver(hIDReceiver);
							return;
						}
					}
				}
				else
				{
					DeviceBase parent2 = ((DeviceBase)hIDDevice.HidppDeviceHandle).Parent;
					if (parent2 != null && hIDDevice.IsWireless)
					{
						foreach (HIDDevice registeredDevice2 in _registeredDevices)
						{
							if (registeredDevice2.Id.Equals(parent2.Id))
							{
								hIDDevice.Parent = registeredDevice2;
								if ((int)((DeviceBase)registeredDevice2.HidppDeviceHandle).DeviceType == 255)
								{
									HIDReceiver hIDReceiver2 = registeredDevice2 as HIDReceiver;
									hIDReceiver2.AddPairedDevice(hIDDevice);
									recheckReceiver(hIDReceiver2);
								}
								else
								{
									Remove(registeredDevice2);
								}
							}
						}
					}
				}
			}
			hIDDevice.ConnectionChanged += OnDeviceConnectionChanged;
			OnDeviceConnectionChanged(hIDDevice, hIDDevice.IsConnected);
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in on device added, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			dispatcher.Invoke(delegate
			{
				MessageBox.Show($"A connected device raised an exception during device added event: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		catch (Exception arg)
		{
			Console.WriteLine("Exception caught in on device added, {0}", arg);
		}
	}

	private void OnDeviceRemoved(DeviceBase hidppDevice)
	{
		//IL_011d: Expected O, but got Unknown
		try
		{
			lock (_sequentialRemovalLock)
			{
				HIDDevice hIDDevice = null;
				lock (_registeredDevices)
				{
					foreach (HIDDevice registeredDevice in _registeredDevices)
					{
						if (registeredDevice.Id.Equals(hidppDevice.Id))
						{
							hIDDevice = registeredDevice;
							break;
						}
					}
					if (hIDDevice == null)
					{
						return;
					}
					_registeredDevices.Remove(hIDDevice);
					Remove(hIDDevice);
					hIDDevice.ConnectionChanged -= OnDeviceConnectionChanged;
					if (hIDDevice.Parent != null && hIDDevice.Parent.GetType() == typeof(HIDReceiver))
					{
						HIDReceiver hIDReceiver = hIDDevice.Parent as HIDReceiver;
						hIDReceiver.RemovePairedDevice(hIDDevice);
						if (hIDReceiver.IsConnected)
						{
							recheckReceiver(hIDReceiver);
						}
					}
					hIDDevice.CancellationTokenSrc.Cancel();
					hIDDevice.Dispose();
				}
			}
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in on device removed, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			dispatcher.Invoke(delegate
			{
				MessageBox.Show($"A connected device raised an exception during device removal event: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		catch (Exception arg)
		{
			Console.WriteLine("Exception caught in on device removed, {0}", arg);
		}
	}

	private async void OnDeviceConnectionChanged(HIDDevice sender, bool is_connected)
	{
		_ = 5;
		try
		{
			HIDReceiver parentDevice = sender.Parent as HIDReceiver;
			if (!is_connected)
			{
				bool flag = parentDevice != null;
				if (flag)
				{
					flag = await parentDevice.IsCompatible();
				}
				if (flag)
				{
					Add(parentDevice);
				}
				Remove(sender);
			}
			else if (sender.GetType() == typeof(HIDMouse))
			{
				HIDMouse mouseDevice = sender as HIDMouse;
				if (!(await mouseDevice.IsCompatible()))
				{
					bool flag = parentDevice != null;
					if (flag)
					{
						flag = await parentDevice.IsCompatible();
					}
					if (flag)
					{
						Add(parentDevice);
					}
					Remove(sender);
					return;
				}
				Add(sender);
				if (parentDevice != null)
				{
					Remove(parentDevice);
				}
				await mouseDevice.InitAsync();
				mouseDevice.OnProfileModifiedStateChanged += delegate(object o, HIDMouse.OnProfileModifiedStateChangedEventArgs a)
				{
					EventHandler<OnProfileModifiedStateChangedEventArgs> eventHandler = this.OnProfileModifiedStateChanged;
					OnProfileModifiedStateChangedEventArgs e2 = new OnProfileModifiedStateChangedEventArgs
					{
						IsModified = a.IsModified
					};
					eventHandler?.Invoke(this, e2);
				};
			}
			else if (sender.GetType() == typeof(HIDReceiver))
			{
				HIDReceiver receiverDevice = sender as HIDReceiver;
				if (!(await receiverDevice.IsCompatible()))
				{
					Remove(sender);
					return;
				}
				Add(receiverDevice);
				await receiverDevice.InitAsync();
			}
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in on device connection changed, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			dispatcher.Invoke(delegate
			{
				MessageBox.Show($"A connected device raised an exception during device connection changed event: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		catch (Exception arg)
		{
			Console.WriteLine("Exception caught in on device connection changed, {0}", arg);
		}
	}

	private void recheckReceiver(HIDReceiver receiver)
	{
		if (receiver == null)
		{
			return;
		}
		try
		{
			Task<bool> task = receiver.IsCompatible();
			try
			{
				task.Wait(receiver.CancellationTokenSrc.Token);
			}
			catch (TaskCanceledException)
			{
				return;
			}
			if (task.Result)
			{
				Add(receiver);
			}
			else
			{
				Remove(receiver);
			}
		}
		catch (Exception arg)
		{
			Console.WriteLine("Exception caught, receiver probably unplugged. {0}", arg);
		}
	}
}
