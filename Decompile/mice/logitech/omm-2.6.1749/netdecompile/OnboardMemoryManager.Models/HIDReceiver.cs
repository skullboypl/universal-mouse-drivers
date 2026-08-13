using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OnboardMemoryManager.Properties;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDReceiver : HIDDevice
{
	private HidppDevice hidppDevice;

	private List<HIDDevice> _pairedDevices = new List<HIDDevice>();

	private static readonly int[] _blacklistedReceiverPIDs = new int[27]
	{
		50470, 50471, 50472, 50473, 50474, 50475, 50476, 50477, 50478, 50479,
		50480, 50482, 50483, 50497, 50485, 50486, 50487, 50488, 50491, 50492,
		50494, 50496, 50498, 50500, 50502, 50504, 50505
	};

	public override string DeviceName
	{
		get
		{
			if (hidppDevice != null && hidppDevice.ProductId == 50490)
			{
				DeviceName = Resources.Powerplay_Receiver;
			}
			else
			{
				DeviceName = Resources.USB_Receiver;
			}
			return base.DeviceName;
		}
	}

	public IReadOnlyList<HIDDevice> PairedDevices => _pairedDevices.AsReadOnly();

	public event Action<HIDReceiver, HIDDevice> PairedDeviceAdded;

	public event Action<HIDReceiver, HIDDevice> PairedDeviceRemoved;

	public HIDReceiver(HidppDevice hidppDevice, CancellationTokenSource cancellation_token_origin = null)
		: base(hidppDevice, cancellation_token_origin)
	{
		this.hidppDevice = hidppDevice;
	}

	public void AddPairedDevice(HIDDevice device)
	{
		_pairedDevices.Add(device);
		OnPropertyChanged("PairedDevices");
		this.PairedDeviceAdded?.Invoke(this, device);
	}

	public void RemovePairedDevice(HIDDevice device)
	{
		_pairedDevices.Remove(device);
		OnPropertyChanged("PairedDevices");
		this.PairedDeviceRemoved?.Invoke(this, device);
	}

	public async Task<HidppDeviceIndex> Pair()
	{
		bool flag = await IsLightspeed2Compatible() && LS2ShouldSpecifyPairingSlot();
		return await hidppDevice.PairQuadDevice(flag, (BaseDeviceType)2);
	}

	public Task Unpair(HidppDeviceIndex Index)
	{
		//IL_0006: Unknown result type (might be due to invalid IL or missing references)
		return hidppDevice.UnpairQuadDevice(Index);
	}

	public override async Task<bool> IsCompatible()
	{
		return await IsCompatible();
	}

	public async Task<bool> IsCompatible(bool skip_child_mouse_device_check = false)
	{
		if (!base.IsConnected)
		{
			return false;
		}
		if ((await hidppDevice.ProtocolVersion).Major != 1)
		{
			return false;
		}
		if ((int)base.DeviceType != 255)
		{
			return false;
		}
		if (_blacklistedReceiverPIDs.Contains(hidppDevice.ProductId))
		{
			return false;
		}
		IEnumerable<HIDDevice> pairedMice = _pairedDevices.Where((HIDDevice device) => device.GetType() == typeof(HIDMouse));
		if (pairedMice.Where((HIDDevice mouse) => mouse.IsConnected).Count() > 0 && !skip_child_mouse_device_check)
		{
			return false;
		}
		if (await hidppDevice.PairingSlotCount <= _pairedDevices.Count && pairedMice.Count() == 0)
		{
			return false;
		}
		foreach (HIDDevice item in pairedMice)
		{
			if ((int)item.HidppDeviceHandle.ProtocolType != 12 && (int)item.HidppDeviceHandle.ProtocolType != 13 && (int)item.HidppDeviceHandle.ProtocolType != 15 && (int)item.HidppDeviceHandle.ProtocolType != 14 && (int)item.HidppDeviceHandle.ProtocolType != 17)
			{
				return false;
			}
		}
		return true;
	}

	public async Task<bool> IsLightspeed2Compatible()
	{
		return await hidppDevice.PairingSlotCount > 1;
	}

	public bool LS2ShouldSpecifyPairingSlot()
	{
		return PairedDevices.Where((HIDDevice device) => (int)device.DeviceType == 1).FirstOrDefault() != null;
	}
}
