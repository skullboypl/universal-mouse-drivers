using System;
using System.Runtime.InteropServices;
using System.Text;

namespace DriverLib;

public class UsbServer
{
	public delegate void OnUsbDataReceived(IntPtr pcmd, int cmdLength, IntPtr pdata, int dataLength);

	public delegate void OnDataReceived(UsbCommand command);

	private static OnUsbDataReceived onUsbDataReceived;

	private static OnDataReceived onDataReceived;

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Thread();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Start(StringBuilder inputEndpoint, StringBuilder outputEndpoint, OnUsbDataReceived onUsbDataReceived);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Exit();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadEncryption();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetPCDriverStatus(bool isActived);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadOnLine();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadBatteryLevel();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetClearSetting();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadVersion();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadFalshData(int startAddress, int length);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadAllFlashData();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadConfig();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePair();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePairWithCidMid(byte cid, byte mid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePairOnlyCid(byte cid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadDonglePairStatus();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetVidPid(int vid, int pid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetDeviceDescriptorString(StringBuilder DeviceDescriptorString);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterUsbUpdateMode();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetCurrentConfig(int configId);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadCidMid();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterMTKMode();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbServer_GetCurrentDevice();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadCurrentDPI();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadReportRate();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadDPILed();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadLedBar();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_SetBatteryOptimizeEnable(bool enable);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_SetBatteryOptimizeLastBattery(int _elapsedSeconds, byte lastBatPercent);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_SetBatteryOptimizeParam(int _supportBatteryReplacement, int _smoothChangesInterval, int _smoothChangesIntervalInCharge85_100);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_SetBatteryOptimizeSection(int[] _BatVoltage);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_ReStartBatteryOptimize();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_ProtocolDataCompareUpdate(IntPtr writeFashDataMap, IntPtr compareFashDataMap);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_Set4KDongleRGB(ref DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void UsbServer_Get4KDongleRGBValue();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_SetLongRangeMode(bool enable);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_UsbServer_GetLongRangeMode();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void UsbServer_GetSlaveVersion();

	public static void UsbServer_Thread()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_Thread();
		}
		else
		{
			CS_UsbServer_Thread();
		}
	}

	public static void Start(string inputEndpoint, string outputEndpoint, OnDataReceived _onDataReceived)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(inputEndpoint);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(outputEndpoint);
		onUsbDataReceived = UserUsbDataReceived;
		onDataReceived = _onDataReceived;
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_Start(stringBuilder, stringBuilder2, onUsbDataReceived);
		}
		else
		{
			UsbServer32.CS_UsbServer_Start(stringBuilder, stringBuilder2, onUsbDataReceived);
		}
	}

	public static void UserUsbDataReceived(IntPtr pcmd, int cmdLength, IntPtr pdata, int dataLength)
	{
		byte[] array = new byte[cmdLength];
		Marshal.Copy(pcmd, array, 0, cmdLength);
		UsbCommand command = new UsbCommand
		{
			ReportId = array[0],
			id = array[1],
			CommandStatus = array[2],
			address = ((array[3] << 8) | array[4])
		};
		int num = 10;
		command.command = new byte[num];
		Array.Copy(array, 6, command.command, 0, num);
		if (dataLength > 0)
		{
			command.receivedData = new byte[dataLength];
			Marshal.Copy(pdata, command.receivedData, 0, dataLength);
		}
		else
		{
			command.command = null;
		}
		onDataReceived(command);
	}

	public static void Exit()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_Exit();
		}
		else
		{
			UsbServer32.CS_UsbServer_Exit();
		}
	}

	public static void ReadEncryptedData()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadEncryption();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadEncryption();
		}
	}

	public static void SetPCDriverStatus(bool isActived)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetPCDriverStatus(isActived);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetPCDriverStatus(isActived);
		}
	}

	public static void ReadOnLine()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadOnLine();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadOnLine();
		}
	}

	public static void ReadBatteryLevel()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadBatteryLevel();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadBatteryLevel();
		}
	}

	public static void EnterDonglePair()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_EnterDonglePair();
		}
		else
		{
			UsbServer32.CS_UsbServer_EnterDonglePair();
		}
	}

	public static void EnterDonglePairWithCidMid(byte cid, byte mid)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_EnterDonglePairWithCidMid(cid, mid);
		}
		else
		{
			UsbServer32.CS_UsbServer_EnterDonglePairWithCidMid(cid, mid);
		}
	}

	public static void EnterDonglePairOnlyCid(byte cid)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_EnterDonglePairOnlyCid(cid);
		}
		else
		{
			UsbServer32.CS_UsbServer_EnterDonglePairOnlyCid(cid);
		}
	}

	public static void ReadDonglePairStatus()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadDonglePairStatus();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadDonglePairStatus();
		}
	}

	public static void SetVidPid(int vid, int pid)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetVidPid(vid, pid);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetVidPid(vid, pid);
		}
	}

	public static void SetDeviceDescriptorString(string DeviceDescriptorString)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(DeviceDescriptorString);
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetDeviceDescriptorString(stringBuilder);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetDeviceDescriptorString(stringBuilder);
		}
	}

	public static void EnterUsbUpdateMode()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_EnterUsbUpdateMode();
		}
		else
		{
			UsbServer32.CS_UsbServer_EnterUsbUpdateMode();
		}
	}

	public static void SetClearSetting()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetClearSetting();
		}
		else
		{
			UsbServer32.CS_UsbServer_SetClearSetting();
		}
	}

	public static void ReadVersion()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadVersion();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadVersion();
		}
	}

	public static void ReadFalshData(int address, int length)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadFalshData(address, length);
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadFalshData(address, length);
		}
	}

	public static void ReadAllFlashData()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadAllFlashData();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadAllFlashData();
		}
	}

	public static void ReadConfig()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadConfig();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadConfig();
		}
	}

	public static void SetCurrentConfig(int configid)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetCurrentConfig(configid);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetCurrentConfig(configid);
		}
	}

	public static string GetCurrentEndPointPath()
	{
		string[] array = ((!UsbFinder.isX64System()) ? UsbServer32.CS_UsbServer_GetCurrentDevice() : CS_UsbServer_GetCurrentDevice());
		if (array != null)
		{
			return array[0];
		}
		return "";
	}

	public static void ReadCidMid()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadCidMid();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadCidMid();
		}
	}

	public static void EnterMTKMode()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_EnterMTKMode();
		}
		else
		{
			UsbServer32.CS_UsbServer_EnterMTKMode();
		}
	}

	public static void ReadCurrentDPI()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadCurrentDPI();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadCurrentDPI();
		}
	}

	public static void ReadReportRate()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadReportRate();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadReportRate();
		}
	}

	public static void ReadDPILed()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadDPILed();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadDPILed();
		}
	}

	public static void ReadLedBar()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReadLedBar();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReadLedBar();
		}
	}

	public static void SetBatteryOptimizeEnable(bool enable)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetBatteryOptimizeEnable(enable);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetBatteryOptimizeEnable(enable);
		}
	}

	public static void SetBatteryOptimizeLastBattery(int _elapsedSeconds, byte lastBatPercent)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetBatteryOptimizeLastBattery(_elapsedSeconds, lastBatPercent);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetBatteryOptimizeLastBattery(_elapsedSeconds, lastBatPercent);
		}
	}

	public static void SetBatteryOptimizeParam(int _supportBatteryReplacement, int _smoothChangesInterval, int _smoothChangesIntervalInCharge85_100)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetBatteryOptimizeParam(_supportBatteryReplacement, _smoothChangesInterval, _smoothChangesIntervalInCharge85_100);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetBatteryOptimizeParam(_supportBatteryReplacement, _smoothChangesInterval, _smoothChangesIntervalInCharge85_100);
		}
	}

	public static void SetBatteryOptimizeSection(int[] _BatVoltage)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetBatteryOptimizeSection(_BatVoltage);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetBatteryOptimizeSection(_BatVoltage);
		}
	}

	public static void ReStartBatteryOptimize()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_ReStartBatteryOptimize();
		}
		else
		{
			UsbServer32.CS_UsbServer_ReStartBatteryOptimize();
		}
	}

	public static void ProtocolDataCompareUpdate(FlashDataMap writeFlashDataMap, FlashDataMap compareFlashDataMap)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(FlashDataMap)));
		IntPtr intPtr2 = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(FlashDataMap)));
		Marshal.StructureToPtr(writeFlashDataMap, intPtr, fDeleteOld: true);
		Marshal.StructureToPtr(compareFlashDataMap, intPtr2, fDeleteOld: true);
		if (UsbFinder.isX64System())
		{
			CS_ProtocolDataCompareUpdate(intPtr, intPtr2);
		}
		else
		{
			UsbServer32.CS_ProtocolDataCompareUpdate(intPtr, intPtr2);
		}
		Marshal.FreeHGlobal(intPtr);
		Marshal.FreeHGlobal(intPtr2);
	}

	public static void Set4KDongleRGB(ref DongleRGB dongleRGB)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_Set4KDongleRGB(ref dongleRGB);
		}
		else
		{
			UsbServer32.CS_UsbServer_Set4KDongleRGB(ref dongleRGB);
		}
	}

	public static void Get4KDongleRGBValue()
	{
		if (UsbFinder.isX64System())
		{
			UsbServer_Get4KDongleRGBValue();
		}
		else
		{
			UsbServer32.UsbServer_Get4KDongleRGBValue();
		}
	}

	public static void SetLongRangeMode(bool enable)
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_SetLongRangeMode(enable);
		}
		else
		{
			UsbServer32.CS_UsbServer_SetLongRangeMode(enable);
		}
	}

	public static void GetLongRangeMode()
	{
		if (UsbFinder.isX64System())
		{
			CS_UsbServer_GetLongRangeMode();
		}
		else
		{
			UsbServer32.CS_UsbServer_GetLongRangeMode();
		}
	}

	public static void GetSlaveVersion()
	{
		if (UsbFinder.isX64System())
		{
			UsbServer_GetSlaveVersion();
		}
		else
		{
			UsbServer32.UsbServer_GetSlaveVersion();
		}
	}
}
