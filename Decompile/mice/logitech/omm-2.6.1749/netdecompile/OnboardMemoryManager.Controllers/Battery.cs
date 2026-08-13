using System;
using System.Threading.Tasks;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using logi.hidppio;

namespace OnboardMemoryManager.Controllers;

public class Battery
{
	public enum BATTERY_LEVEL
	{
		UNDEFINED,
		EMPTY,
		LOW,
		MEDIUM,
		HIGH,
		FULL
	}

	public enum CHARGE_STATE
	{
		DISCHARGING,
		CHARGING
	}

	public class OnBatteryStatusEventArgs : EventArgs
	{
		public BATTERY_LEVEL Level { get; set; }

		public CHARGE_STATE State { get; set; }

		public int Percent { get; set; }

		public bool IsBatteryRemoved { get; set; }
	}

	protected HIDDevice _device;

	protected HidppDevice _hidppDevice;

	protected BATTERY_LEVEL _level;

	protected CHARGE_STATE _state;

	protected int _percent = 50;

	protected bool _is_battery_removed;

	protected bool _battery_removed_support;

	public BATTERY_LEVEL Level
	{
		get
		{
			return _level;
		}
		set
		{
			if (value != _level)
			{
				_level = value;
				emitBatteryStatusEvent();
			}
		}
	}

	public CHARGE_STATE State
	{
		get
		{
			return _state;
		}
		set
		{
			if (value != _state)
			{
				_state = value;
				emitBatteryStatusEvent();
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
				emitBatteryStatusEvent();
			}
		}
	}

	public bool IsBatteryRemoved
	{
		get
		{
			return _is_battery_removed & _battery_removed_support;
		}
		set
		{
			if (value != _is_battery_removed)
			{
				_is_battery_removed = value;
				emitBatteryStatusEvent();
			}
		}
	}

	public event EventHandler<OnBatteryStatusEventArgs> OnBatteryStatus;

	public Battery(HIDDevice device)
	{
		_device = device;
		_hidppDevice = device.HidppDeviceHandle;
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			await init();
		});
	}

	private async Task init()
	{
		if (await ((DeviceBase)_hidppDevice).HasFeature(4100))
		{
			Feature1004 feature = ((DeviceBase)_hidppDevice).GetFeature<Feature1004>();
			feature.BatteryStatusBroadcast += OnF1004Broadcast;
			_battery_removed_support = feature.GetCapabilities().removable_battery_cap;
			BatteryStatus status = feature.GetStatus();
			OnF1004Broadcast(status);
		}
		else if (await ((DeviceBase)_hidppDevice).HasFeature(4097))
		{
			Feature1001 feature2 = ((DeviceBase)_hidppDevice).GetFeature<Feature1001>();
			feature2.BatteryInfoBroadcast += OnF1001Broadcast;
			BatteryInfo batteryInfo = feature2.GetBatteryInfo();
			OnF1001Broadcast(batteryInfo);
		}
		else if (await ((DeviceBase)_hidppDevice).HasFeature(4096))
		{
			Feature1000 feature3 = ((DeviceBase)_hidppDevice).GetFeature<Feature1000>();
			feature3.BatteryLevelStatusBroadcast += OnF1000Broadcast;
			BatteryLevelStatus batteryLevelStatus = feature3.GetBatteryLevelStatus();
			OnF1000Broadcast(batteryLevelStatus);
		}
	}

	private void OnF1004Broadcast(BatteryStatus info)
	{
		//IL_0002: Unknown result type (might be due to invalid IL or missing references)
		State = (((int)info.charging_status != 0) ? CHARGE_STATE.CHARGING : CHARGE_STATE.DISCHARGING);
		int num = (Percent = info.state_of_charge);
		if (num < 15)
		{
			Level = BATTERY_LEVEL.EMPTY;
		}
		else if (num < 30)
		{
			Level = BATTERY_LEVEL.LOW;
		}
		else if (num < 50)
		{
			Level = BATTERY_LEVEL.MEDIUM;
		}
		else if (num < 90)
		{
			Level = BATTERY_LEVEL.HIGH;
		}
		else
		{
			Level = BATTERY_LEVEL.FULL;
		}
		IsBatteryRemoved = info.is_battery_removed;
		emitBatteryStatusEvent();
	}

	private void OnF1001Broadcast(BatteryInfo info)
	{
		//IL_0013: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Invalid comparison between Unknown and I4
		State = (info.ext_power ? CHARGE_STATE.CHARGING : CHARGE_STATE.DISCHARGING);
		if ((int)info.charge_status == 1)
		{
			Level = BATTERY_LEVEL.FULL;
			Percent = 100;
			return;
		}
		if (info.critical && State == CHARGE_STATE.DISCHARGING)
		{
			Level = BATTERY_LEVEL.EMPTY;
			Percent = 1;
			return;
		}
		float num;
		float num2;
		float num3;
		float num4;
		float num5;
		float num6;
		float num7;
		float num8;
		float num9;
		float num10;
		switch ((ulong)_device.ProductID)
		{
		case 16511uL:
		case 49281uL:
		case 49282uL:
		case 49287uL:
		case 4649896869286117376uL:
			num = 3.632f;
			num2 = 2837.09f;
			num3 = -2738.1084f;
			num4 = 26431.285f;
			num5 = -85045.12f;
			num6 = 94026.48f;
			num7 = -18016.254f;
			num8 = 219290.1f;
			num9 = -2804122f / (float)Math.PI;
			num10 = 1215175.9f;
			break;
		default:
			num = 3.655f;
			num2 = 902.34f;
			num3 = -15695.751f;
			num4 = 166612.55f;
			num5 = (float)Math.PI * -187707f;
			num6 = 696795.9f;
			num7 = 8350.133f;
			num8 = -95306.16f;
			num9 = 360382.25f;
			num10 = -1225683f / (float)Math.E;
			break;
		}
		float num11 = (float)info.battery_voltage / 1000f;
		float num12 = ((num11 < num) ? num3 : num7);
		float num13 = ((num11 < num) ? num4 : num8);
		float num14 = ((num11 < num) ? num5 : num9);
		float num15 = ((num11 < num) ? num6 : num10);
		float num16 = num12 * (float)Math.Pow(num11, 3.0) + num13 * (float)Math.Pow(num11, 2.0) + num14 * num11 + num15;
		float num17 = num2 - num16;
		int num18 = (Percent = (int)(100f * (num17 / num2)).Clamp(0f, 100f));
		if (num18 < 10)
		{
			Level = BATTERY_LEVEL.EMPTY;
		}
		else if (num18 >= 10 && num18 < 30)
		{
			Level = BATTERY_LEVEL.LOW;
		}
		else if (num18 >= 30 && num18 < 70)
		{
			Level = BATTERY_LEVEL.MEDIUM;
		}
		else
		{
			Level = BATTERY_LEVEL.FULL;
		}
		emitBatteryStatusEvent();
	}

	private void OnF1000Broadcast(BatteryLevelStatus info)
	{
		//IL_0002: Unknown result type (might be due to invalid IL or missing references)
		State = (((int)info.battery_status != 0) ? CHARGE_STATE.CHARGING : CHARGE_STATE.DISCHARGING);
		int num = (Percent = info.battery_discharge_level);
		if (num < 10)
		{
			Level = BATTERY_LEVEL.EMPTY;
		}
		else if (num >= 10 && num < 30)
		{
			Level = BATTERY_LEVEL.LOW;
		}
		else if (num >= 30 && num < 70)
		{
			Level = BATTERY_LEVEL.MEDIUM;
		}
		else
		{
			Level = BATTERY_LEVEL.FULL;
		}
		emitBatteryStatusEvent();
	}

	private void emitBatteryStatusEvent()
	{
		EventHandler<OnBatteryStatusEventArgs> eventHandler = this.OnBatteryStatus;
		OnBatteryStatusEventArgs e = new OnBatteryStatusEventArgs
		{
			Level = Level,
			State = State,
			Percent = Percent,
			IsBatteryRemoved = IsBatteryRemoved
		};
		eventHandler?.Invoke(this, e);
	}
}
