using System;
using System.Runtime.InteropServices;

namespace DriverLib;

public class DataParser
{
	public const int MAX_DPI_CONFIG = 8;

	public const int MAX_KEY_COUNT = 16;

	public const int MAX_KEY_MACRO_COUNT = 70;

	public const int MAX_MACRO_NAME_LENGTH = 30;

	public const int MAX_FLASH_SIZE = 6912;

	public const int MAX_MACRO_COUNT = 70;

	public const int MAX_NAME_LENGTH = 30;

	public const int MAX_SHURTCUT_ACTION_COUNT = 6;

	public const int USB_PACKET_DATA_SIZE = 10;

	public const int USB_PACKET_SIZE = 17;

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_GetCidMid(byte[] data, IntPtr deviceCidMid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.I1)]
	private static extern bool CS_isDeviceOnLine(byte[] data);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_GetDeviceBatteryStatus(byte[] data, IntPtr batteryStatus);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_GetDeviceStatusChanged(byte[] data, IntPtr deviceStatusChanged);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern int CS_GetDeviceVersion(byte[] data);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_ProtocolDataParser(byte[] data, IntPtr fashDataMap);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_ProtocolDataUpdate(IntPtr fashDataMap);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_BufferToDPILed(byte[] data, IntPtr dpiLed);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_BufferToLedBar(byte[] data, IntPtr ledBar);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_SetDllProtocolData(in FlashDataMap flashDataMap);

	public static DeviceInfo GetDeviceInfo(byte[] buffer)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(DeviceInfo)));
		if (UsbFinder.isX64System())
		{
			CS_GetCidMid(buffer, intPtr);
		}
		else
		{
			DataParser32.CS_GetCidMid(buffer, intPtr);
		}
		DeviceInfo result = (DeviceInfo)Marshal.PtrToStructure(intPtr, typeof(DeviceInfo));
		Marshal.FreeHGlobal(intPtr);
		return result;
	}

	public static bool isDeviceOnLine(byte[] buffer)
	{
		if (UsbFinder.isX64System())
		{
			return CS_isDeviceOnLine(buffer);
		}
		return DataParser32.CS_isDeviceOnLine(buffer);
	}

	public static BatteryStatus GetDeviceBatteryStatus(byte[] buffer)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(BatteryStatus)));
		if (UsbFinder.isX64System())
		{
			CS_GetDeviceBatteryStatus(buffer, intPtr);
		}
		else
		{
			DataParser32.CS_GetDeviceBatteryStatus(buffer, intPtr);
		}
		BatteryStatus result = (BatteryStatus)Marshal.PtrToStructure(intPtr, typeof(BatteryStatus));
		Marshal.FreeHGlobal(intPtr);
		return result;
	}

	public static DeviceStatusChanged GetDeviceStatusChanged(byte[] buffer)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(DeviceStatusChanged)));
		if (UsbFinder.isX64System())
		{
			CS_GetDeviceStatusChanged(buffer, intPtr);
		}
		else
		{
			DataParser32.CS_GetDeviceStatusChanged(buffer, intPtr);
		}
		DeviceStatusChanged result = (DeviceStatusChanged)Marshal.PtrToStructure(intPtr, typeof(DeviceStatusChanged));
		Marshal.FreeHGlobal(intPtr);
		return result;
	}

	public static int GetDeviceVersion(byte[] buffer)
	{
		if (UsbFinder.isX64System())
		{
			return CS_GetDeviceVersion(buffer);
		}
		return DataParser32.CS_GetDeviceVersion(buffer);
	}

	public static void ProtocolParser(byte[] buffer, ref FlashDataMap flashDataMap)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(FlashDataMap)));
		if (UsbFinder.isX64System())
		{
			CS_ProtocolDataParser(buffer, intPtr);
		}
		else
		{
			DataParser32.CS_ProtocolDataParser(buffer, intPtr);
		}
		flashDataMap = (FlashDataMap)Marshal.PtrToStructure(intPtr, typeof(FlashDataMap));
		Marshal.FreeHGlobal(intPtr);
	}

	public static void Update(FlashDataMap flashDataMap)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(FlashDataMap)));
		Marshal.StructureToPtr(flashDataMap, intPtr, fDeleteOld: true);
		if (UsbFinder.isX64System())
		{
			CS_ProtocolDataUpdate(intPtr);
		}
		else
		{
			DataParser32.CS_ProtocolDataUpdate(intPtr);
		}
		Marshal.FreeHGlobal(intPtr);
	}

	public static void BufferToDPILed(byte[] data, ref DPILed dpiLed)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(DPILed)));
		if (UsbFinder.isX64System())
		{
			CS_BufferToDPILed(data, intPtr);
		}
		else
		{
			DataParser32.CS_BufferToDPILed(data, intPtr);
		}
		dpiLed = (DPILed)Marshal.PtrToStructure(intPtr, typeof(DPILed));
		Marshal.FreeHGlobal(intPtr);
	}

	public static void BufferToLedBar(byte[] data, ref LedBar ledBar)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(LedBar)));
		if (UsbFinder.isX64System())
		{
			CS_BufferToLedBar(data, intPtr);
		}
		else
		{
			DataParser32.CS_BufferToLedBar(data, intPtr);
		}
		ledBar = (LedBar)Marshal.PtrToStructure(intPtr, typeof(LedBar));
		Marshal.FreeHGlobal(intPtr);
	}

	public static void SetDllProtocolData(in FlashDataMap flashDataMap)
	{
		if (UsbFinder.isX64System())
		{
			CS_SetDllProtocolData(in flashDataMap);
		}
		else
		{
			DataParser32.CS_SetDllProtocolData(in flashDataMap);
		}
	}
}
