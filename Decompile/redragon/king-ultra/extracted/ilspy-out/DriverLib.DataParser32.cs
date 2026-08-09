using System;
using System.Runtime.InteropServices;

namespace DriverLib;

public class DataParser32
{
	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_GetCidMid(byte[] data, IntPtr deviceCidMid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.I1)]
	public static extern bool CS_isDeviceOnLine(byte[] data);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_GetDeviceBatteryStatus(byte[] data, IntPtr batteryStatus);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_GetDeviceStatusChanged(byte[] data, IntPtr deviceStatusChanged);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern int CS_GetDeviceVersion(byte[] data);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_ProtocolDataParser(byte[] data, IntPtr fashDataMap);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_ProtocolDataUpdate(IntPtr fashDataMap);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_BufferToDPILed(byte[] data, IntPtr dpiLed);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_BufferToLedBar(byte[] data, IntPtr ledBar);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_SetDllProtocolData(in FlashDataMap flashDataMap);
}
