using System.Runtime.InteropServices;
using System.Text;

namespace DriverLib;

public class UsbFinder32
{
	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_GetDllVersion();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_StartUsbChanged(UsbFinder.OnUsbChanged onUsbChanged, int delayTimeout_ms);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_StopUsbChanged();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_SetUsbChangedCallBack(UsbFinder.OnUsbChanged usbChangedCallBack, int delayTimeout_ms);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_EnumHidDeviceList();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevices(StringBuilder vid, StringBuilder pid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByKey(StringBuilder inputEndPoint);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByDefaultDeviceId(StringBuilder vid, StringBuilder pid);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByDeviceId(StringBuilder vid, StringBuilder pid, int interfaceId, int deviceId);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern int CS_UsbFinder_GetDeviceInfo(StringBuilder endpoint, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_ReadCidMid(StringBuilder endpoint, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_WriteCidMid(StringBuilder endpoint, byte cid, byte mid, byte deviceType, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern int CS_UsbFinder_GetVersion(StringBuilder endpoint);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_GetDeviceOnLine(StringBuilder endpoint);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_UsbFinder_GetDeviceOnLineWithUsbAddress(StringBuilder endpoint);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbUpgrade_Start(byte[] binFile, UsbFinder.OnUsbUpgradeDataReceived onUsbUpgradeDataReceived, int waitTimeout);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbUpgrade_FindBootDevices(byte[] binFile, int binArraySize);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbUpgrade_GetLogs();

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbFinder_GetUsbDeviceAttribute(StringBuilder endpoint, out HIDD_ATTRIBUTES hidd_attributes);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_GetSlaveVersion(StringBuilder endpoint, out int slaveVersion);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern byte CS_UsbFinder_Set4KDongleRGB(StringBuilder endpoint, ref DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_Get4KDongleRGBValue(StringBuilder endpoint, out DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_SetDongleIDToMouse(StringBuilder endpoint, byte[] usbDongleId);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_OpenDevice(StringBuilder endpoint);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_UsbFinder_ReadWriteDeviceData(byte[] command, byte length);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_WriteDeviceData(byte[] command, byte length);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbFinder_CloseDevice();
}
