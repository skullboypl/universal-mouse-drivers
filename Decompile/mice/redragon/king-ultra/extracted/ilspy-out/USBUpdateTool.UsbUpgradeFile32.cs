using System.Runtime.InteropServices;
using System.Text;

namespace USBUpdateTool;

public class UsbUpgradeFile32
{
	public const int MaxCmdLength = 64;

	public const int BOOT_SIZE = 8192;

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_CreateUpgradeFile(StringBuilder icName, byte[] binFile, int binArraySize);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetNormalEndPoint(StringBuilder icName, byte[] binFile, StringBuilder inputEndPoint, StringBuilder outputEndPoint);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetBootEndPoint(StringBuilder icName, byte[] binFile, StringBuilder inputEndPoint, StringBuilder outputEndPoint);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetVersion(StringBuilder icName, byte[] binFile, uint version);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetDeviceType(StringBuilder icName, byte[] binFile, uint deviceType);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetICName(StringBuilder icName, byte[] binFile, StringBuilder icNewName);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetCidMid(StringBuilder icName, byte[] binFile, byte cid, byte mid);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetSensorName(StringBuilder icName, byte[] binFile, StringBuilder sensorName);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SetProductName(StringBuilder icName, byte[] binFile, StringBuilder productName);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_IsValidUpgradeFile(byte[] binFile);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_SplitFromUpgradeFile(byte[] binFile, int binArraySize, int fileIndex);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_AppendUpgradeFile(byte[] sourceFile, int sourceFileSize, byte[] newFile, int newFileSize);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_SetPassward1(StringBuilder passwrod1);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern void CS_SetPassward2(StringBuilder passwrod2);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_isPassward1();

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_isPassward2();

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	public static extern bool CS_UsbFinder_EnterPairByFeature(StringBuilder endpoint, byte cid, byte mid);

	[DllImport("UsbFile32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	public static extern byte[] CS_UsbFinder_GetPairStatusByFeature(StringBuilder endpoint, byte reportId, int length);

	[DllImport("HIDUsb32.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	public static extern string[] CS_UsbUpgrade_GetLogs();
}
