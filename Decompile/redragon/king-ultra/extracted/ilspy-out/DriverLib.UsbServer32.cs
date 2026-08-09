using System;
using System.Runtime.InteropServices;
using System.Text;

namespace DriverLib;

public class UsbServer32
{
	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Thread();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Start(StringBuilder inputEndpoint, StringBuilder outputEndpoint, UsbServer.OnUsbDataReceived onUsbDataReceived);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Exit();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadEncryption();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetPCDriverStatus(bool isActived);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadOnLine();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadBatteryLevel();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetClearSetting();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadVersion();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadFalshData(int startAddress, int length);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadAllFlashData();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadConfig();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePair();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePairWithCidMid(byte cid, byte mid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterDonglePairOnlyCid(byte cid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadDonglePairStatus();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetVidPid(int vid, int pid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetDeviceDescriptorString(StringBuilder DeviceDescriptorString);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterUsbUpdateMode();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetCurrentConfig(int configId);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadCidMid();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_EnterMTKMode();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbServer_GetCurrentDevice();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadCurrentDPI();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadReportRate();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadDPILed();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReadLedBar();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetBatteryOptimizeEnable(bool enable);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetBatteryOptimizeLastBattery(int _elapsedSeconds, byte lastBatPercent);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetBatteryOptimizeParam(int _supportBatteryReplacement, int _smoothChangesInterval, int _smoothChangesIntervalInCharge85_100);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetBatteryOptimizeSection(int[] _BatVoltage);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_ReStartBatteryOptimize();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_ProtocolDataCompareUpdate(IntPtr writeFashDataMap, IntPtr compareFashDataMap);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_Set4KDongleRGB(ref DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void UsbServer_Get4KDongleRGBValue();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_SetLongRangeMode(bool enable);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbServer_GetLongRangeMode();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void UsbServer_GetSlaveVersion();
}
