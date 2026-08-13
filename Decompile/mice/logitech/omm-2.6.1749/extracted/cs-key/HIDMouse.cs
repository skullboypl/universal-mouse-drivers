using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using Logitech.ComponentModel;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Helpers;
using logi.hidppio;
using logi.hidppio.onboard_profiles;

namespace OnboardMemoryManager.Models;

public class HIDMouse : HIDDevice
{
	public class OnProfileModifiedStateChangedEventArgs : EventArgs
	{
		public bool IsModified { get; set; }
	}

	private readonly HidppDevice hidppDevice;

	protected Battery _batteryController;

	protected Lighting _lightingController;

	private OnboardMemoryManager.Controllers.ProfileDirectory _profileDirectory;

	private OnboardProfilesInfo _onboard_profiles_info;

	private TimeSpan HostModePollDelay = new TimeSpan(0, 0, 0, 3);

	private DispatcherTimer _host_mode_poll_timer;

	private const byte _monitoring_timeout_seconds = 60;

	private const byte _framerate_limit = 60;

	private DispatcherTimer _analog_buttons_monitoring_refresher;

	private bool _isLoaded;

	private int _currentDPIIndex;

	private List<OnboardProfileDirectoryEntry> _device_profiles_directory;

	private int _sensor_index = -1;

	private int _sensor_count;

	private bool _has_oob_profiles;

	private TaskSingleShot<string> _device_name_task;

	public bool IsLoaded
	{
		get
		{
			return _isLoaded;
		}
		set
		{
			if (value != _isLoaded)
			{
				_isLoaded = value;
				OnPropertyChanged("IsLoaded");
			}
		}
	}

	public int CurrentDPIIndex
	{
		get
		{
			if (base.ActiveProfile is HIDProfile hIDProfile)
			{
				foreach (DPI dPI in hIDProfile.DPIs)
				{
					if (dPI.Enabled && dPI.Selected)
					{
						return dPI.Order;
					}
				}
			}
			return -1;
		}
		private set
		{
			if (_currentDPIIndex != value)
			{
				_currentDPIIndex = value;
				Console.WriteLine("Current DPI is {0}", _currentDPIIndex);
				OnPropertyChanged("CurrentDPIIndex");
			}
		}
	}

	public List<OnboardProfileDirectoryEntry> DeviceProfilesDirectory
	{
		get
		{
			return _device_profiles_directory;
		}
		set
		{
			if (value != _device_profiles_directory)
			{
				_device_profiles_directory = value;
				OnPropertyChanged("DeviceProfilesDirectory");
			}
		}
	}

	public OnboardProfilesInfo OnboardProfilesInfo
	{
		get
		{
			return _onboard_profiles_info;
		}
		set
		{
			if (value != _onboard_profiles_info)
			{
				_onboard_profiles_info = value;
				OnPropertyChanged("OnboardProfilesInfo");
			}
		}
	}

	public int SensorIndex => _sensor_index;

	public int SensorCount => _sensor_count;

	public bool HasOOBProfiles => _has_oob_profiles;

	public Lighting LightingController => _lightingController;

	public new bool IsInHostMode
	{
		get
		{
			return base.IsInHostMode;
		}
		protected set
		{
			if (value != IsInHostMode)
			{
				base.IsInHostMode = value;
				Task.Run(async delegate
				{
					await RefreshActiveState();
				});
			}
		}
	}

	public bool IsFormatSupported { get; private set; }

	public event EventHandler<OnProfileModifiedStateChangedEventArgs> OnProfileModifiedStateChanged;

	public event EventHandler Loaded;

	public HIDMouse(HidppDevice hidppDevice, CancellationTokenSource cancellation_token_origin = null)
		: base(hidppDevice, cancellation_token_origin)
	{
		this.hidppDevice = hidppDevice;
		_device_name_task = new TaskSingleShot<string>(getDeviceName, DeviceName);
		Application current = Application.Current;
		if (current != null)
		{
			_host_mode_poll_timer = new DispatcherTimer(DispatcherPriority.Normal, current.Dispatcher);
			_host_mode_poll_timer.Tick += onHostModePollTick;
			_host_mode_poll_timer.Interval = HostModePollDelay;
			_analog_buttons_monitoring_refresher = new DispatcherTimer(DispatcherPriority.Normal, current.Dispatcher);
			_analog_buttons_monitoring_refresher.Interval = TimeSpan.FromSeconds(54.0);
			_analog_buttons_monitoring_refresher.Tick += onAnalogButtonsMonitoringTick;
		}
	}

	public override async Task InitAsync()
	{
		await base.InitAsync();
		IsFormatSupported = true;
		OnboardProfilesInfo onboard_profiles_info = await GetOnboardProfilesInfo();
		if (onboard_profiles_info == null)
		{
			return;
		}
		_profileDirectory = new OnboardMemoryManager.Controllers.ProfileDirectory(this);
		_has_oob_profiles = onboard_profiles_info.profile_count_oob > 0;
		await ObservableObject.Dispatcher.InvokeAsync(delegate
		{
			Profiles.Clear();
		}, DispatcherPriority.Normal, base.CancellationTokenSrc.Token);
		List<Task<HIDProfile>> profileTasks = new List<Task<HIDProfile>>();
		foreach (OnboardProfileDirectoryEntry profileDirectoryEntry in _profileDirectory.Entries)
		{
			Task<HIDProfile> item = Task.Run(async delegate
			{
				OnboardProfile val = null;
				int sector = profileDirectoryEntry.Sector;
				try
				{
					if (!profileDirectoryEntry.Virtual && sector > 0 && sector < onboard_profiles_info.sector_count)
					{
						val = GetOnboardProfile(profileDirectoryEntry.Sector);
					}
				}
				catch (NotSupportedException)
				{
					IsFormatSupported = false;
					return (HIDProfile)null;
				}
				catch (Exception ex2)
				{
					if (!ex2.Message.Contains("CRC Checksum Failed"))
					{
						throw ex2;
					}
				}
				if (val == null)
				{
					if (_has_oob_profiles)
					{
						try
						{
							int num = ((onboard_profiles_info.profile_count_oob < sector) ? 1 : sector);
							val = GetOnboardProfile(num + 256);
						}
						catch (NotSupportedException)
						{
							IsFormatSupported = false;
							return (HIDProfile)null;
						}
					}
					else
					{
						try
						{
							val = ((DeviceBase)hidppDevice).GetFeature<Feature8100>().GetDefaultProfile();
						}
						catch (NotSupportedException)
						{
							IsFormatSupported = false;
							return (HIDProfile)null;
						}
					}
				}
				HIDProfile profile = new HIDProfile(this, profileDirectoryEntry, val);
				profile.OnModifiedStateChanged += delegate(object o, HIDProfile.OnModifiedStateChangedEventArgs a)
				{
					EventHandler<OnProfileModifiedStateChangedEventArgs> eventHandler = this.OnProfileModifiedStateChanged;
					OnProfileModifiedStateChangedEventArgs e = new OnProfileModifiedStateChangedEventArgs
					{
						IsModified = a.IsModified
					};
					eventHandler?.Invoke(this, e);
				};
				await profile.InitAsync();
				return profile;
			}, base.CancellationTokenSrc.Token);
			profileTasks.Add(item);
		}
		Task.Factory.StartNew(delegate
		{
			_batteryController = new Battery(this);
			_batteryController.OnBatteryStatus += delegate(object o, Battery.OnBatteryStatusEventArgs a)
			{
				Console.WriteLine("Battery Status Received");
				Console.WriteLine("Level: {0}", a.Level.ToString());
				Console.WriteLine("State: {0}", a.State.ToString());
				Console.WriteLine("Percent: {0}", a.Percent.ToString());
				base.BatteryLevel = a.Level;
				base.ChargeState = a.State;
				base.Percent = a.Percent;
				base.IsBatteryRemoved = a.IsBatteryRemoved;
			};
		}, base.CancellationTokenSrc.Token).Wait(base.CancellationTokenSrc.Token);
		await Task.WhenAll(profileTasks);
		if (!IsFormatSupported)
		{
			IsLoaded = true;
			this.Loaded?.Invoke(this, EventArgs.Empty);
			return;
		}
		await Task.Factory.StartNew(delegate
		{
			IOrderedEnumerable<Task<HIDProfile>> sortedTasks = profileTasks.OrderBy((Task<HIDProfile> profileTask) => profileTask.Result.OnboardProfileDirectoryEntry.Index);
			ObservableObject.Dispatcher.Invoke(delegate
			{
				foreach (Task<HIDProfile> item2 in sortedTasks)
				{
					if (item2.Result != null)
					{
						Profiles.Add(item2.Result);
					}
				}
			}, DispatcherPriority.Normal, base.CancellationTokenSrc.Token);
		}, base.CancellationTokenSrc.Token);
		await Task.Factory.StartNew((Func<Task>)async delegate
		{
			int sensor_count;
			if (await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2201_003E.FeatureId))
			{
				Feature2201 f2201 = ((DeviceBase)hidppDevice).GetFeature<Feature2201>();
				if (f2201 != null && ((Feature)f2201).Descr.Version > 0)
				{
					sensor_count = await f2201.GetSensorCount();
					_sensor_count = sensor_count;
					if (SensorCount > 0)
					{
						_sensor_index = 0;
						DPIResolution val = await f2201.GetSensorDPI((ValueType)SensorIndex);
						CurrentDPIIndex = val.dpi;
					}
					else
					{
						_sensor_index = -1;
					}
				}
			}
			if (await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2202_003E.FeatureId))
			{
				Feature2202 f2202 = ((DeviceBase)hidppDevice).GetFeature<Feature2202>();
				if (f2202 != null)
				{
					sensor_count = await f2202.GetSensorCount();
					_sensor_count = sensor_count;
					if (SensorCount > 0)
					{
						_sensor_index = 0;
						DPIResolution val2 = await f2202.GetSensorDPI((ValueType)SensorIndex);
						CurrentDPIIndex = val2.dpi;
					}
					else
					{
						_sensor_index = -1;
					}
				}
			}
			Feature8100 f8100 = ((DeviceBase)hidppDevice).GetFeature<Feature8100>();
			bool isInHostMode = (int)(await f8100.GetOnboardMode()) == 2;
			base.IsInHostMode = isInHostMode;
			_host_mode_poll_timer.Start();
			if (await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_1b0c_003E.FeatureId))
			{
				_analog_buttons_monitoring_refresher.Start();
				((DeviceBase)hidppDevice).GetFeature<Feature1B0C>().SetMonitoringMode(true, (byte)60, (short)60);
			}
			sensor_count = await f8100.GetActiveProfile();
			base.ActiveProfile = getProfileForSector(sensor_count);
			f8100.OnProfileActivateBroadcast += onProfileActivated;
			f8100.OnActiveResolutionChangeBroadcast += onActiveResolutionChanged;
			base.ConnectionChanged += OnConnectionChanged;
		}, base.CancellationTokenSrc.Token);
		(await Task.Factory.StartNew((Func<Task>)async delegate
		{
			_lightingController = new Lighting(this);
			await _lightingController.Init();
			base.LightingOptions = _lightingController.Options;
		}, base.CancellationTokenSrc.Token)).Wait(base.CancellationTokenSrc.Token);
		IsLoaded = true;
		this.Loaded?.Invoke(this, EventArgs.Empty);
	}

	protected override void Dispose(bool disposing)
	{
		if (!disposing)
		{
			return;
		}
		_host_mode_poll_timer.Stop();
		if (_analog_buttons_monitoring_refresher.IsEnabled)
		{
			_analog_buttons_monitoring_refresher.Stop();
		}
		foreach (Profile profile in Profiles)
		{
			profile.Dispose();
		}
		Profiles.Clear();
	}

	public async Task SetActiveProfile(int profile)
	{
		await ((DeviceBase)hidppDevice).GetFeature<Feature8100>().SetActiveProfile(profile);
		onProfileActivated(profile);
	}

	public async Task SetCurrentDPI(int dpi_level)
	{
		if (dpi_level < 1)
		{
			return;
		}
		await ((DeviceBase)hidppDevice).GetFeature<Feature8100>().SetActiveProfileResolution(dpi_level - 1);
		if (!(base.ActiveProfile is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			dPI.Selected = dPI.Order == dpi_level - 1;
		}
	}

	private bool SensorIndexValid()
	{
		if (SensorIndex >= 0)
		{
			return SensorIndex < SensorCount;
		}
		return false;
	}

	private async Task<string> getDeviceName()
	{
		if (DeviceName == "")
		{
			long product_id = await GetProductID();
			if (product_id != 0L)
			{
				string deviceNameOverride = GetDeviceNameOverride(product_id, await GetExtendedModelID());
				if (deviceNameOverride != "")
				{
					DeviceName = deviceNameOverride;
				}
			}
		}
		if (DeviceName == "")
		{
			DeviceName = await base.GetDeviceName();
		}
		return DeviceName;
	}

	public override Task<string> GetDeviceName()
	{
		if (!((DeviceBase)hidppDevice).IsConnected)
		{
			throw new Exception("Device not connected");
		}
		return _device_name_task.Get();
	}

	private async Task<OnboardProfilesInfo> GetOnboardProfilesInfo()
	{
		if (OnboardProfilesInfo == null)
		{
			OnboardProfilesInfo = await ((DeviceBase)hidppDevice).GetFeature<Feature8100>().GetOnboardProfilesInfo();
		}
		return OnboardProfilesInfo;
	}

	public OnboardProfile GetOnboardProfile(int index)
	{
		return ((DeviceBase)hidppDevice).GetFeature<Feature8100>().GetProfile(index);
	}

	public async Task<ONBOARD_MODE> IsInOnboardMode()
	{
		return await ((DeviceBase)hidppDevice).GetFeature<Feature8100>().GetOnboardMode();
	}

	public void ToggleProfileEnabled(HIDProfile profile)
	{
		profile.Enabled = !profile.Enabled;
	}

	public async Task RefreshActiveProfile()
	{
		onProfileActivated(await ((DeviceBase)base.HidppDeviceHandle).GetFeature<Feature8100>().GetActiveProfile());
	}

	private Profile getProfileForSector(int sector)
	{
		IEnumerable<Profile> source = Profiles.Where((Profile profile) => profile is HIDProfile hIDProfile && hIDProfile.Sector == sector);
		if (source.Count() <= 0)
		{
			return null;
		}
		return source.First();
	}

	public async Task EnableHostMode()
	{
		Feature8100 feature = ((DeviceBase)hidppDevice).GetFeature<Feature8100>();
		if (feature != null)
		{
			await feature.SetOnboardMode((ONBOARD_MODE)2);
			IsInHostMode = false;
		}
	}

	public async Task DisableHostMode()
	{
		Feature8100 feature = ((DeviceBase)hidppDevice).GetFeature<Feature8100>();
		if (feature != null)
		{
			await feature.SetOnboardMode((ONBOARD_MODE)1);
			IsInHostMode = false;
		}
	}

	public async Task RefreshActiveState()
	{
		Feature8100 feature = ((DeviceBase)hidppDevice).GetFeature<Feature8100>();
		if (feature == null)
		{
			return;
		}
		if (IsInHostMode)
		{
			onProfileActivated(0);
			return;
		}
		onProfileActivated(await feature.GetActiveProfile());
		if (await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2201_003E.FeatureId))
		{
			Feature2201 f2201 = ((DeviceBase)hidppDevice).GetFeature<Feature2201>();
			if (f2201 != null)
			{
				_sensor_count = await f2201.GetSensorCount();
				if (SensorCount > 0)
				{
					_sensor_index = 0;
					CurrentDPIIndex = (await f2201.GetSensorDPI((ValueType)SensorIndex)).dpi;
				}
				else
				{
					_sensor_index = -1;
				}
				if (base.ActiveProfile is HIDProfile hIDProfile)
				{
					hIDProfile.SetKnownDPI(CurrentDPIIndex);
				}
			}
		}
		if (!(await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2202_003E.FeatureId)))
		{
			return;
		}
		Feature2202 f2202 = ((DeviceBase)hidppDevice).GetFeature<Feature2202>();
		if (f2202 != null)
		{
			_sensor_count = await f2202.GetSensorCount();
			if (SensorCount > 0)
			{
				_sensor_index = 0;
				CurrentDPIIndex = (await f2202.GetSensorDPI((ValueType)SensorIndex)).dpi;
			}
			else
			{
				_sensor_index = -1;
			}
			if (base.ActiveProfile is HIDProfile hIDProfile2)
			{
				hIDProfile2.SetKnownDPI(CurrentDPIIndex);
			}
		}
	}

	private void onProfileActivated(int sector)
	{
		if (sector == 0)
		{
			ObservableObject.Dispatcher.Invoke(delegate
			{
				base.ActiveProfile = null;
			});
			return;
		}
		ObservableObject.Dispatcher.Invoke(delegate
		{
			base.ActiveProfile = getProfileForSector(sector);
			if (base.ActiveProfile is HIDProfile { SavedDefaultDPI: not null } hIDProfile)
			{
				CurrentDPIIndex = hIDProfile.SavedDefaultDPI.SavedValue;
			}
		}, DispatcherPriority.Normal, base.CancellationTokenSrc.Token);
	}

	private void onActiveResolutionChanged(int index)
	{
		if (base.ActiveProfile is HIDProfile hIDProfile)
		{
			CurrentDPIIndex = hIDProfile.DPIs[index].SavedValue;
		}
	}

	private void OnConnectionChanged(HIDDevice device, bool is_connected)
	{
		if (!is_connected && _analog_buttons_monitoring_refresher.IsEnabled)
		{
			_analog_buttons_monitoring_refresher.Stop();
		}
	}

	private async void onHostModePollTick(object sender, EventArgs e)
	{
		try
		{
			Feature8100 feature = ((DeviceBase)hidppDevice).GetFeature<Feature8100>();
			if (feature != null)
			{
				bool isInHostMode = (int)(await feature.GetOnboardMode()) == 2;
				IsInHostMode = isInHostMode;
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine("Exception in host mode poll tick {0}", ex.ToString());
		}
	}

	private void onAnalogButtonsMonitoringTick(object sender, EventArgs e)
	{
		Feature1B0C feature = ((DeviceBase)hidppDevice).GetFeature<Feature1B0C>();
		if (feature != null)
		{
			feature.SetMonitoringMode(true, (byte)60, (short)60);
		}
	}

	protected static string GetDeviceNameOverride(long ProductId, long ExtendedModelID)
	{
		string result = "";
		switch ((ulong)ProductId)
		{
		case 4642302164515946496uL:
			result = "G603";
			break;
		case 12692340589811728384uL:
			result = "G604";
			break;
		case 4647644983573086208uL:
		case 4647645052292562944uL:
			result = "G502";
			break;
		case 13870523902347706368uL:
			result = "G402";
			break;
		case 13870805377324417024uL:
			result = "G302";
			break;
		case 13871086852301127680uL:
			result = "G303";
			break;
		case 4644337115725824000uL:
			result = "G305";
			break;
		case 13871368327277838336uL:
			result = "G900";
			break;
		case 13871649802254548992uL:
			result = "G403 Wireless";
			break;
		case 13871931277231259648uL:
			result = "G403";
			break;
		case 13872212752207970304uL:
		case 13876153401881919488uL:
			result = "G102 / G203";
			break;
		case 13872494227184680960uL:
			result = "Pro Mouse";
			break;
		case 4649896869286117376uL:
			result = "G903";
			break;
		case 13873057177138102272uL:
			result = "G703";
			break;
		case 4645956180957462528uL:
			result = "Pro Wireless";
			break;
		case 13874183077044944896uL:
			result = "G502 Hero";
			break;
		case 14065304586231480320uL:
			result = "G502 Spectrum";
			break;
		case 13874746026998366208uL:
			result = "G502 Wireless";
			break;
		case 13875027501975076864uL:
			result = "MX518";
			break;
		case 13875308976951787520uL:
			result = "G403 Wireless";
			break;
		case 4649615390014439424uL:
			result = "G703";
			break;
		case 12695155442658099350uL:
			result = "G705";
			break;
		case 13875871926905208832uL:
			result = "G900";
			break;
		case 13872775702161391616uL:
			result = "G903 SE";
			break;
		case 4656370819520266240uL:
			result = "G303 SHROUD";
			break;
		case 4659467061443952640uL:
			if (ExtendedModelID == 0L || ExtendedModelID == 1 || ExtendedModelID == 2)
			{
				result = "PRO X SUPERLIGHT 2";
			}
			break;
		case 12699096178231345152uL:
			result = "G309 LIGHTSPEED";
			break;
		}
		return result;
	}

	public override async Task<bool> IsCompatible()
	{
		if (!base.IsConnected)
		{
			return false;
		}
		if ((await hidppDevice.ProtocolVersion).Major == 1)
		{
			return false;
		}
		if ((int)base.DeviceType != 2)
		{
			return false;
		}
		if (!(await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_0003_003E.FeatureId)))
		{
			return false;
		}
		if (!(await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_0005_003E.FeatureId)))
		{
			return false;
		}
		bool has_feature_2201 = await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2201_003E.FeatureId);
		bool flag = await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2202_003E.FeatureId);
		if (!has_feature_2201 && !flag)
		{
			return false;
		}
		if (!(await ((DeviceBase)hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_8100_003E.FeatureId)))
		{
			return false;
		}
		return true;
	}
}
