using System;
using System.Threading;
using System.Threading.Tasks;
using OnboardMemoryManager.Helpers;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDDevice : Device
{
	public enum ConnectionType
	{
		UNKNOWN,
		USB,
		BLUETOOTH,
		LIGHTSPEED
	}

	private HidppDevice _hidppDevice;

	private readonly CancellationTokenSource _cancellation_token_source;

	private HIDDevice _parent;

	private ConnectionType _connectionType;

	private TaskSingleShot<long> _product_id_task;

	private TaskSingleShot<long> _extended_model_id_task;

	private TaskSingleShot<string> _device_name_task;

	public bool IsConnected => ((DeviceBase)_hidppDevice).IsConnected;

	public string Id => ((DeviceBase)_hidppDevice).Id;

	public HidppDevice HidppDeviceHandle => _hidppDevice;

	public CancellationTokenSource CancellationTokenSrc => _cancellation_token_source;

	public HidppDeviceIndex Index => HidppDeviceHandle.Index;

	public bool IsWireless
	{
		get
		{
			//IL_0001: Unknown result type (might be due to invalid IL or missing references)
			//IL_0009: Unknown result type (might be due to invalid IL or missing references)
			//IL_0013: Invalid comparison between Unknown and I4
			//IL_0020: Unknown result type (might be due to invalid IL or missing references)
			if ((int)Index != 0 && (int)Index != 255)
			{
				return Enum.IsDefined(typeof(HidppDeviceIndex), Index);
			}
			return false;
		}
	}

	public new BaseDeviceType DeviceType => ((DeviceBase)HidppDeviceHandle).DeviceType;

	public HIDDevice Parent
	{
		get
		{
			return _parent;
		}
		set
		{
			if (value != _parent)
			{
				_parent = value;
				EvaluateConnectionType();
				OnPropertyChanged("Parent");
			}
		}
	}

	public ConnectionType ActiveConnectionType
	{
		get
		{
			return _connectionType;
		}
		protected set
		{
			if (value != _connectionType)
			{
				_connectionType = value;
				OnPropertyChanged("ActiveConnectionType");
			}
		}
	}

	public event Action<HIDDevice, bool> ConnectionChanged;

	public HIDDevice(HidppDevice hidppDevice, CancellationTokenSource cancellation_token_origin = null)
	{
		_hidppDevice = hidppDevice;
		if (cancellation_token_origin != null)
		{
			_cancellation_token_source = CancellationTokenSource.CreateLinkedTokenSource(cancellation_token_origin.Token);
		}
		else
		{
			_cancellation_token_source = CancellationTokenSource.CreateLinkedTokenSource();
		}
		if (_hidppDevice != null)
		{
			((DeviceBase)_hidppDevice).ConnectionChanged += OnConnectionChanged;
		}
		EvaluateConnectionType();
		_product_id_task = new TaskSingleShot<long>(getProductID, base.ProductID);
		_extended_model_id_task = new TaskSingleShot<long>(getExtendedModelID, base.ExtendedModelID);
		_device_name_task = new TaskSingleShot<string>(getDeviceName, DeviceName);
	}

	private void EvaluateConnectionType()
	{
		//IL_0010: Unknown result type (might be due to invalid IL or missing references)
		//IL_0016: Invalid comparison between Unknown and I4
		//IL_001e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0024: Invalid comparison between Unknown and I4
		//IL_0030: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Invalid comparison between Unknown and I4
		ConnectionType connectionType = ConnectionType.UNKNOWN;
		if (_hidppDevice != null)
		{
			if ((int)_hidppDevice.TransportType == 2 || (int)_hidppDevice.TransportType == 3)
			{
				connectionType = ConnectionType.BLUETOOTH;
			}
			else if ((int)_hidppDevice.TransportType == 1 && Parent == null)
			{
				connectionType = ConnectionType.USB;
			}
			else if (Parent != null)
			{
				connectionType = ConnectionType.LIGHTSPEED;
			}
			if (connectionType != ActiveConnectionType)
			{
				ActiveConnectionType = connectionType;
			}
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing)
		{
			_cancellation_token_source.Dispose();
		}
		base.Dispose(disposing);
	}

	public virtual async Task InitAsync()
	{
		base.ProductID = await GetProductID();
		base.ExtendedModelID = await GetExtendedModelID();
		DeviceName = await GetDeviceName();
	}

	public override Task<bool> IsCompatible()
	{
		return Task.FromResult(result: false);
	}

	private void OnConnectionChanged(DeviceBase device, bool is_connected)
	{
		EvaluateConnectionType();
		OnPropertyChanged("IsConnected");
		this.ConnectionChanged?.Invoke(this, is_connected);
	}

	private async Task<long> getProductID()
	{
		if ((await _hidppDevice.ProtocolVersion).Major >= 2)
		{
			return (await ((DeviceBase)_hidppDevice).GetFeature<Feature0003>().GetDeviceInfo()).model_id;
		}
		return _hidppDevice.ProductId;
	}

	public Task<long> GetProductID()
	{
		if (!((DeviceBase)_hidppDevice).IsConnected)
		{
			throw new Exception("Device not connected");
		}
		return _product_id_task.Get();
	}

	private async Task<long> getExtendedModelID()
	{
		int extended_model_id = 0;
		if ((await _hidppDevice.ProtocolVersion).Major >= 2)
		{
			extended_model_id = (await ((DeviceBase)_hidppDevice).GetFeature<Feature0003>().GetDeviceInfo()).extended_model_id;
		}
		return extended_model_id;
	}

	public Task<long> GetExtendedModelID()
	{
		if (!((DeviceBase)_hidppDevice).IsConnected)
		{
			throw new Exception("Device not connected");
		}
		return _extended_model_id_task.Get();
	}

	private async Task<string> getDeviceName()
	{
		if (DeviceName == "" && (await _hidppDevice.ProtocolVersion).Major >= 2)
		{
			DeviceName = await ((DeviceBase)_hidppDevice).GetFeature<Feature0005>().GetDeviceName();
		}
		return DeviceName;
	}

	public virtual Task<string> GetDeviceName()
	{
		if (!((DeviceBase)_hidppDevice).IsConnected)
		{
			throw new Exception("Device not connected");
		}
		return _device_name_task.Get();
	}
}
