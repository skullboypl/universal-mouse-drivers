using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using Mouse_Drive_Beta;

namespace DriverLib;

public class UsbFinder
{
	public delegate void OnUsbChanged(bool isUsbPluged);

	public delegate void OnUsbUpgradeDataReceived(IntPtr pcmd, int cmdLength);

	public delegate void OnUpgradeDataReceived(byte[] command);

	public enum HID_CODE_TYPE
	{
		Modify,
		Normal,
		Media,
		Power,
		Mouse
	}

	private static OnUsbChanged onUsbChangedDll;

	private static OnUsbChanged onUsbChangedApp;

	private static OnUsbUpgradeDataReceived onUsbUpgradeDataReceived;

	private static OnUpgradeDataReceived onUpgradeDataReceived;

	public static bool usbOpening;

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	private static extern string[] CS_UsbFinder_GetDllVersion();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_StartUsbChanged(OnUsbChanged onUsbChanged, int delayTimeout_ms);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_StopUsbChanged();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_SetUsbChangedCallBack(OnUsbChanged usbChangedCallBack, int delayTimeout_ms);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_EnumHidDeviceList();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevices(StringBuilder vid, StringBuilder pid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByKey(StringBuilder inputEndPoint);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByDefaultDeviceId(StringBuilder vid, StringBuilder pid);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbFinder_FindHidDevicesByDeviceId(StringBuilder vid, StringBuilder pid, int interfaceId, int deviceId);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern int CS_UsbFinder_GetDeviceInfo(StringBuilder endpoint, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_ReadCidMid(StringBuilder endpoint, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_WriteCidMid(StringBuilder endpoint, byte cid, byte mid, byte deviceType, out DeviceInfo deviceInfo);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern int CS_UsbFinder_GetVersion(StringBuilder endpoint);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_GetDeviceOnLine(StringBuilder endpoint);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_UsbFinder_GetDeviceOnLineWithUsbAddress(StringBuilder endpoint);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbUpgrade_Start(byte[] binFile, OnUsbUpgradeDataReceived onUsbUpgradeDataReceived, int waitTimeout);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbUpgrade_FindBootDevices(byte[] binFile, int binArraySize);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbUpgrade_GetLogs();

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbFinder_GetUsbDeviceAttribute(StringBuilder endpoint, out HIDD_ATTRIBUTES hidd_attributes);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_GetSlaveVersion(StringBuilder endpoint, out int slaveVersion);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern byte CS_UsbFinder_Set4KDongleRGB(StringBuilder endpoint, ref DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_Get4KDongleRGBValue(StringBuilder endpoint, out DongleRGB dongleRGB);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_SetDongleIDToMouse(StringBuilder endpoint, byte[] usbDongleId);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_OpenDevice(StringBuilder endpoint);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_UsbFinder_ReadWriteDeviceData(byte[] command, byte length);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_WriteDeviceData(byte[] command, byte length);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_UsbFinder_CloseDevice();

	public static bool isWindow7()
	{
		if (Environment.OSVersion.Version.Major == 6)
		{
			return Environment.OSVersion.Version.Minor == 1;
		}
		return false;
	}

	public static bool isX64System()
	{
		return Environment.Is64BitOperatingSystem;
	}

	public static string[] GetDllVersion()
	{
		if (isX64System())
		{
			return CS_UsbFinder_GetDllVersion();
		}
		return UsbFinder32.CS_UsbFinder_GetDllVersion();
	}

	public static void StartUsbChanged(OnUsbChanged onUsbChanged, int delayTimeout_ms)
	{
		onUsbChangedDll = OnUserUsbChanged;
		onUsbChangedApp = onUsbChanged;
		if (isX64System())
		{
			CS_StartUsbChanged(onUsbChangedDll, delayTimeout_ms);
		}
		else
		{
			UsbFinder32.CS_StartUsbChanged(onUsbChangedDll, delayTimeout_ms);
		}
	}

	public static void OnUserUsbChanged(bool isUsbPluged)
	{
		onUsbChangedApp(isUsbPluged);
	}

	public static void StopUsbChanged()
	{
		if (isX64System())
		{
			CS_StopUsbChanged();
		}
		else
		{
			UsbFinder32.CS_StopUsbChanged();
		}
	}

	public static void SetUsbChangedCallBack(OnUsbChanged usbChangedCallBack, int delayTimeout_ms)
	{
		if (isX64System())
		{
			CS_SetUsbChangedCallBack(usbChangedCallBack, delayTimeout_ms);
		}
		else
		{
			UsbFinder32.CS_SetUsbChangedCallBack(usbChangedCallBack, delayTimeout_ms);
		}
	}

	public static string[] EnumHidDeviceList()
	{
		if (isX64System())
		{
			return CS_UsbFinder_EnumHidDeviceList();
		}
		return UsbFinder32.CS_UsbFinder_EnumHidDeviceList();
	}

	public static string[] FindHidDevices(string vid, string pid)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(vid);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(pid);
		if (isX64System())
		{
			return CS_UsbFinder_FindHidDevices(stringBuilder, stringBuilder2);
		}
		return UsbFinder32.CS_UsbFinder_FindHidDevices(stringBuilder, stringBuilder2);
	}

	public static string[] FindHidDevices(string inputEndpoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(inputEndpoint);
		if (isX64System())
		{
			return CS_UsbFinder_FindHidDevicesByKey(stringBuilder);
		}
		return UsbFinder32.CS_UsbFinder_FindHidDevicesByKey(stringBuilder);
	}

	public static string[] FindHidDevicesByDefaultDeviceId(string vid, string pid)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(vid);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(pid);
		if (isX64System())
		{
			return CS_UsbFinder_FindHidDevicesByDefaultDeviceId(stringBuilder, stringBuilder2);
		}
		return UsbFinder32.CS_UsbFinder_FindHidDevicesByDefaultDeviceId(stringBuilder, stringBuilder2);
	}

	public static string[] FindHidDevicesByDeviceId(string vid, string pid, int interfaceId, int deviceId)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(vid);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(pid);
		if (isX64System())
		{
			return CS_UsbFinder_FindHidDevicesByDeviceId(stringBuilder, stringBuilder2, interfaceId, deviceId);
		}
		return UsbFinder32.CS_UsbFinder_FindHidDevicesByDeviceId(stringBuilder, stringBuilder2, interfaceId, deviceId);
	}

	public static void GetDeviceInfo(string endPoint, out DeviceInfo deviceInfo)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			CS_UsbFinder_GetDeviceInfo(stringBuilder, out deviceInfo);
		}
		else
		{
			UsbFinder32.CS_UsbFinder_GetDeviceInfo(stringBuilder, out deviceInfo);
		}
	}

	public static int GetVersion(string endPoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			return CS_UsbFinder_GetVersion(stringBuilder);
		}
		return UsbFinder32.CS_UsbFinder_GetVersion(stringBuilder);
	}

	public static bool GetDeviceOnLine(string endPoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			return CS_UsbFinder_GetDeviceOnLine(stringBuilder);
		}
		return UsbFinder32.CS_UsbFinder_GetDeviceOnLine(stringBuilder);
	}

	public static byte[] GetDeviceOnLineWithAddress(string endPoint)
	{
		_ = new byte[32];
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			return CS_UsbFinder_GetDeviceOnLineWithUsbAddress(stringBuilder);
		}
		return UsbFinder32.CS_UsbFinder_GetDeviceOnLineWithUsbAddress(stringBuilder);
	}

	public static void GetUsbDeviceAttribute(string endpoint, out HIDD_ATTRIBUTES hidd_attributes)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endpoint);
		if (isX64System())
		{
			CS_UsbFinder_GetUsbDeviceAttribute(stringBuilder, out hidd_attributes);
		}
		else
		{
			UsbFinder32.CS_UsbFinder_GetUsbDeviceAttribute(stringBuilder, out hidd_attributes);
		}
	}

	public static IntPtr BytesToIntptr(byte[] bytes)
	{
		int num = bytes.Length;
		IntPtr intPtr = Marshal.AllocHGlobal(num);
		try
		{
			Marshal.Copy(bytes, 0, intPtr, num);
			return intPtr;
		}
		finally
		{
			Marshal.FreeHGlobal(intPtr);
		}
	}

	public static bool UsbUpgrade_Start(byte[] binFile, OnUpgradeDataReceived _onUsbUpgradeDataReceived, int waitTimeout)
	{
		onUsbUpgradeDataReceived = UserUsbUpgradeDataReceived;
		onUpgradeDataReceived = _onUsbUpgradeDataReceived;
		if (isX64System())
		{
			return CS_UsbUpgrade_Start(binFile, onUsbUpgradeDataReceived, waitTimeout);
		}
		return UsbFinder32.CS_UsbUpgrade_Start(binFile, onUsbUpgradeDataReceived, waitTimeout);
	}

	public static void UserUsbUpgradeDataReceived(IntPtr pcmd, int cmdLength)
	{
		byte[] array = new byte[cmdLength];
		Marshal.Copy(pcmd, array, 0, cmdLength);
		onUpgradeDataReceived(array);
	}

	public static string[] FindBootDevices(byte[] binFile)
	{
		if (isX64System())
		{
			return CS_UsbUpgrade_FindBootDevices(binFile, binFile.Length);
		}
		return UsbFinder32.CS_UsbUpgrade_FindBootDevices(binFile, binFile.Length);
	}

	public static string[] UsbUpgrade_GetLogs()
	{
		if (isX64System())
		{
			return CS_UsbUpgrade_GetLogs();
		}
		return UsbFinder32.CS_UsbUpgrade_GetLogs();
	}

	public static void ReadCidMid(string endPoint, out DeviceInfo deviceInfo)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			CS_UsbFinder_ReadCidMid(stringBuilder, out deviceInfo);
		}
		else
		{
			UsbFinder32.CS_UsbFinder_ReadCidMid(stringBuilder, out deviceInfo);
		}
	}

	public static void WriteCidMid(string endPoint, byte cid, byte mid, byte deviceType, out DeviceInfo deviceInfo)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			CS_UsbFinder_WriteCidMid(stringBuilder, cid, mid, deviceType, out deviceInfo);
		}
		else
		{
			UsbFinder32.CS_UsbFinder_WriteCidMid(stringBuilder, cid, mid, deviceType, out deviceInfo);
		}
	}

	public static bool GetSlaveVersion(string endPoint, out int slaveVersion)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (isX64System())
		{
			return CS_UsbFinder_GetSlaveVersion(stringBuilder, out slaveVersion);
		}
		return UsbFinder32.CS_UsbFinder_GetSlaveVersion(stringBuilder, out slaveVersion);
	}

	public static bool SetDongleIDToMouse(string endpoint, byte[] usbDongleId)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endpoint);
		return CS_UsbFinder_SetDongleIDToMouse(stringBuilder, usbDongleId);
	}

	public static bool UsbFinder_OpenDevice(string endpoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endpoint);
		while (usbOpening)
		{
			Thread.Sleep(100);
		}
		if (isX64System())
		{
			usbOpening = CS_UsbFinder_OpenDevice(stringBuilder);
		}
		else
		{
			usbOpening = UsbFinder32.CS_UsbFinder_OpenDevice(stringBuilder);
		}
		return usbOpening;
	}

	public static byte[] UsbFinder_ReadWriteDeviceData(byte[] command, byte length)
	{
		if (isX64System())
		{
			return CS_UsbFinder_ReadWriteDeviceData(command, length);
		}
		return UsbFinder32.CS_UsbFinder_ReadWriteDeviceData(command, length);
	}

	public static bool UsbFinder_WriteDeviceData(byte[] command, byte length)
	{
		if (isX64System())
		{
			return CS_UsbFinder_WriteDeviceData(command, length);
		}
		return UsbFinder32.CS_UsbFinder_WriteDeviceData(command, length);
	}

	public static void UsbFinder_CloseDevice()
	{
		if (isX64System())
		{
			CS_UsbFinder_CloseDevice();
		}
		else
		{
			UsbFinder32.CS_UsbFinder_CloseDevice();
		}
		usbOpening = false;
	}

	public static void SetMousePairAddress(string device, byte[] rfid)
	{
		byte[] array = null;
		if (!UsbFinder_OpenDevice(device))
		{
			return;
		}
		byte[] array2 = new byte[17]
		{
			8, 26, 0, 0, 0, 10, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0
		};
		for (int i = 0; i < rfid.Length; i++)
		{
			array2[6 + i] = rfid[i];
		}
		array2[array2.Length - 1] = ValueConvert.Get_CRC(array2);
		int j = 0;
		bool flag = false;
		for (; j < 5; j++)
		{
			if (flag)
			{
				break;
			}
			array = UsbFinder_ReadWriteDeviceData(array2, (byte)array2.Length);
			if (array != null && array.Length == array2.Length)
			{
				flag = ValueConvert.Check_CRC(array);
			}
		}
		UsbFinder_CloseDevice();
	}
}
