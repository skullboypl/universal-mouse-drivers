using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Logitech.ComponentModel;
using OnboardMemoryManager.Controllers;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class Device : ObservableObject, IDisposable
{
	private long _product_id;

	private long _extended_model_id;

	private string _device_name = "";

	private BaseDeviceType _device_type;

	private Battery.BATTERY_LEVEL _battery_level;

	private Battery.CHARGE_STATE _charge_state;

	private int _percent = 50;

	private bool _is_battery_removed;

	private Profile _active_profile;

	private bool _is_in_host_mode;

	private ObservableCollection<Lighting.LightingOption> _lightingOptions;

	public readonly ObservableCollection<Profile> Profiles = new ObservableCollection<Profile>();

	public long ProductID
	{
		get
		{
			return _product_id;
		}
		set
		{
			if (value != _product_id)
			{
				_product_id = value;
				OnPropertyChanged("ProductID");
			}
		}
	}

	public long ExtendedModelID
	{
		get
		{
			return _extended_model_id;
		}
		set
		{
			if (value != _extended_model_id)
			{
				_extended_model_id = value;
				OnPropertyChanged("ExtendedModelID");
			}
		}
	}

	public BaseDeviceType DeviceType
	{
		get
		{
			//IL_0001: Unknown result type (might be due to invalid IL or missing references)
			return _device_type;
		}
		set
		{
			//IL_0000: Unknown result type (might be due to invalid IL or missing references)
			//IL_0002: Unknown result type (might be due to invalid IL or missing references)
			//IL_000a: Unknown result type (might be due to invalid IL or missing references)
			//IL_000b: Unknown result type (might be due to invalid IL or missing references)
			if (value != _device_type)
			{
				_device_type = value;
				OnPropertyChanged("DeviceType");
			}
		}
	}

	public virtual string DeviceName
	{
		get
		{
			return _device_name;
		}
		set
		{
			if (value != _device_name)
			{
				_device_name = value;
				OnPropertyChanged("DeviceName");
			}
		}
	}

	public Battery.BATTERY_LEVEL BatteryLevel
	{
		get
		{
			return _battery_level;
		}
		set
		{
			if (value != _battery_level)
			{
				_battery_level = value;
				OnPropertyChanged("BatteryLevel");
			}
		}
	}

	public Battery.CHARGE_STATE ChargeState
	{
		get
		{
			return _charge_state;
		}
		set
		{
			if (value != _charge_state)
			{
				_charge_state = value;
				OnPropertyChanged("ChargeState");
			}
		}
	}

	public int Percent
	{
		get
		{
			return _percent;
		}
		set
		{
			if (value != _percent)
			{
				_percent = value;
				OnPropertyChanged("Percent");
			}
		}
	}

	public bool IsBatteryRemoved
	{
		get
		{
			return _is_battery_removed;
		}
		set
		{
			if (value != _is_battery_removed)
			{
				_is_battery_removed = value;
				OnPropertyChanged("IsBatteryRemoved");
			}
		}
	}

	public Profile ActiveProfile
	{
		get
		{
			return _active_profile;
		}
		set
		{
			if (value == _active_profile)
			{
				return;
			}
			_active_profile = value;
			OnPropertyChanged("ActiveProfile");
			foreach (Profile profile in Profiles)
			{
				profile.Active = profile == ActiveProfile;
			}
		}
	}

	public bool IsInHostMode
	{
		get
		{
			return _is_in_host_mode;
		}
		protected set
		{
			if (value != _is_in_host_mode)
			{
				_is_in_host_mode = value;
				OnPropertyChanged("IsInHostMode");
			}
		}
	}

	public ObservableCollection<Lighting.LightingOption> LightingOptions
	{
		get
		{
			return _lightingOptions;
		}
		protected set
		{
			if (value != _lightingOptions)
			{
				_lightingOptions = value;
				OnPropertyChanged("LightingOptions");
			}
		}
	}

	protected internal Device()
	{
	}

	public Device(int product_id, BaseDeviceType device_type, string device_name, Battery.BATTERY_LEVEL battery_level)
	{
		//IL_002d: Unknown result type (might be due to invalid IL or missing references)
		//IL_002e: Unknown result type (might be due to invalid IL or missing references)
		_product_id = product_id;
		_device_type = device_type;
		_device_name = device_name;
		_battery_level = battery_level;
	}

	public void Dispose()
	{
		GC.SuppressFinalize(this);
		Dispose(disposing: true);
	}

	~Device()
	{
		Dispose(disposing: false);
	}

	protected virtual void Dispose(bool disposing)
	{
	}

	public virtual Task<bool> IsCompatible()
	{
		return Task.FromResult(result: true);
	}
}
