using System;
using System.Runtime.InteropServices;
using System.Text;
using DriverLib;

namespace USBUpdateTool;

public class UsbUpgradeFile
{
	public const int MaxCmdLength = 64;

	public const int BOOT_SIZE = 8192;

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_CreateUpgradeFile(StringBuilder icName, byte[] binFile, int binArraySize);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetNormalEndPoint(StringBuilder icName, byte[] binFile, StringBuilder inputEndPoint, StringBuilder outputEndPoint);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetBootEndPoint(StringBuilder icName, byte[] binFile, StringBuilder inputEndPoint, StringBuilder outputEndPoint);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetVersion(StringBuilder icName, byte[] binFile, uint version);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetDeviceType(StringBuilder icName, byte[] binFile, uint deviceType);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetICName(StringBuilder icName, byte[] binFile, StringBuilder icNewName);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetCidMid(StringBuilder icName, byte[] binFile, byte cid, byte mid);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetSensorName(StringBuilder icName, byte[] binFile, StringBuilder sensorName);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SetProductName(StringBuilder icName, byte[] binFile, StringBuilder productName);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern bool CS_IsValidUpgradeFile(byte[] binFile);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_SplitFromUpgradeFile(byte[] binFile, int binArraySize, int fileIndex);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_AppendUpgradeFile(byte[] sourceFile, int sourceFileSize, byte[] newFile, int newFileSize);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_SetPassward1(StringBuilder passwrod1);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern void CS_SetPassward2(StringBuilder passwrod2);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern bool CS_isPassward1();

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern bool CS_isPassward2();

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	private static extern bool CS_UsbFinder_EnterPairByFeature(StringBuilder endpoint, byte cid, byte mid);

	[DllImport("UsbFile.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_UI1)]
	private static extern byte[] CS_UsbFinder_GetPairStatusByFeature(StringBuilder endpoint, byte reportId, int length);

	[DllImport("HIDUsb.dll", CallingConvention = CallingConvention.Cdecl)]
	[return: MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_BSTR)]
	private static extern string[] CS_UsbUpgrade_GetLogs();

	public static byte[] CreateUpgradeFile(string icName, byte[] binFile)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		if (UsbFinder.isX64System())
		{
			return CS_CreateUpgradeFile(stringBuilder, binFile, binFile.Length);
		}
		return UsbUpgradeFile32.CS_CreateUpgradeFile(stringBuilder, binFile, binFile.Length);
	}

	public static byte[] SetNormalEndPoint(string icName, byte[] upgradeFile, string inputEndpoint, string outputEndpoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(inputEndpoint);
		StringBuilder stringBuilder3 = new StringBuilder();
		stringBuilder3.Append(outputEndpoint);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetNormalEndPoint(stringBuilder, upgradeFile, stringBuilder2, stringBuilder3);
			}
			return UsbUpgradeFile32.CS_SetNormalEndPoint(stringBuilder, upgradeFile, stringBuilder2, stringBuilder3);
		}
		return null;
	}

	public static byte[] SetBootEndPoint(string icName, byte[] upgradeFile, string inputEndpoint, string outputEndpoint)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(inputEndpoint);
		StringBuilder stringBuilder3 = new StringBuilder();
		stringBuilder3.Append(outputEndpoint);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetBootEndPoint(stringBuilder, upgradeFile, stringBuilder2, stringBuilder3);
			}
			return UsbUpgradeFile32.CS_SetBootEndPoint(stringBuilder, upgradeFile, stringBuilder2, stringBuilder3);
		}
		return null;
	}

	public static byte[] SetVersion(string icName, byte[] upgradeFile, uint version)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetVersion(stringBuilder, upgradeFile, version);
			}
			return UsbUpgradeFile32.CS_SetVersion(stringBuilder, upgradeFile, version);
		}
		return null;
	}

	public static byte[] SetDeviceType(string icName, byte[] upgradeFile, uint deviceType)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetDeviceType(stringBuilder, upgradeFile, deviceType);
			}
			return UsbUpgradeFile32.CS_SetDeviceType(stringBuilder, upgradeFile, deviceType);
		}
		return null;
	}

	public static byte[] SetSensorName(string icName, byte[] upgradeFile, string icNewName)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(icNewName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetSensorName(stringBuilder, upgradeFile, stringBuilder2);
			}
			return UsbUpgradeFile32.CS_SetSensorName(stringBuilder, upgradeFile, stringBuilder2);
		}
		return null;
	}

	public static byte[] SetCidMid(string icName, byte[] upgradeFile, byte cid, byte mid)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetCidMid(stringBuilder, upgradeFile, cid, mid);
			}
			return UsbUpgradeFile32.CS_SetCidMid(stringBuilder, upgradeFile, cid, mid);
		}
		return null;
	}

	public static byte[] SetIcName(string icName, byte[] upgradeFile, string sensorName)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(sensorName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetICName(stringBuilder, upgradeFile, stringBuilder2);
			}
			return UsbUpgradeFile32.CS_SetICName(stringBuilder, upgradeFile, stringBuilder2);
		}
		return null;
	}

	public static byte[] SetProductName(string icName, byte[] upgradeFile, string productName)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(icName);
		StringBuilder stringBuilder2 = new StringBuilder();
		stringBuilder2.Append(productName);
		if (upgradeFile != null && upgradeFile.Length > 8192)
		{
			if (UsbFinder.isX64System())
			{
				return CS_SetProductName(stringBuilder, upgradeFile, stringBuilder2);
			}
			return UsbUpgradeFile32.CS_SetProductName(stringBuilder, upgradeFile, stringBuilder2);
		}
		return null;
	}

	public static bool IsValidUpgradeFile(byte[] upgradeFile)
	{
		if (UsbFinder.isX64System())
		{
			return CS_IsValidUpgradeFile(upgradeFile);
		}
		return UsbUpgradeFile32.CS_IsValidUpgradeFile(upgradeFile);
	}

	public static byte[] SplitFromUpgradeFile(byte[] sourceFile, int fileIndex)
	{
		int binArraySize = 0;
		if (sourceFile != null)
		{
			binArraySize = sourceFile.Length;
		}
		if (UsbFinder.isX64System())
		{
			return CS_SplitFromUpgradeFile(sourceFile, binArraySize, fileIndex);
		}
		return UsbUpgradeFile32.CS_SplitFromUpgradeFile(sourceFile, binArraySize, fileIndex);
	}

	public static byte[] AppendUpgradeFile(byte[] sourceFile, byte[] newFile)
	{
		int sourceFileSize = 0;
		if (sourceFile != null)
		{
			sourceFileSize = sourceFile.Length;
		}
		int newFileSize = 0;
		if (newFile != null)
		{
			newFileSize = newFile.Length;
		}
		if (UsbFinder.isX64System())
		{
			return CS_AppendUpgradeFile(sourceFile, sourceFileSize, newFile, newFileSize);
		}
		return UsbUpgradeFile32.CS_AppendUpgradeFile(sourceFile, sourceFileSize, newFile, newFileSize);
	}

	public static UpgradeFileHeader ByteToStruct(byte[] bytes)
	{
		int num = Marshal.SizeOf(typeof(UpgradeFileHeader));
		if (bytes == null || num > bytes.Length)
		{
			return default(UpgradeFileHeader);
		}
		IntPtr intPtr = Marshal.AllocHGlobal(num);
		Marshal.Copy(bytes, 0, intPtr, num);
		UpgradeFileHeader result = (UpgradeFileHeader)Marshal.PtrToStructure(intPtr, typeof(UpgradeFileHeader));
		Marshal.FreeHGlobal(intPtr);
		return result;
	}

	public static void SetPassward1(string password1)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(password1);
		if (UsbFinder.isX64System())
		{
			CS_SetPassward1(stringBuilder);
		}
		else
		{
			UsbUpgradeFile32.CS_SetPassward1(stringBuilder);
		}
	}

	public static void SetPassward2(string password2)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(password2);
		if (UsbFinder.isX64System())
		{
			CS_SetPassward2(stringBuilder);
		}
		else
		{
			UsbUpgradeFile32.CS_SetPassward2(stringBuilder);
		}
	}

	public static bool isPassward1()
	{
		if (UsbFinder.isX64System())
		{
			return CS_isPassward1();
		}
		return UsbUpgradeFile32.CS_isPassward1();
	}

	public static bool isPassward2()
	{
		if (UsbFinder.isX64System())
		{
			return CS_isPassward2();
		}
		return UsbUpgradeFile32.CS_isPassward2();
	}

	public static bool EnterPairByFeature(string endPoint, byte cid, byte mid)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (UsbFinder.isX64System())
		{
			return CS_UsbFinder_EnterPairByFeature(stringBuilder, cid, mid);
		}
		return UsbUpgradeFile32.CS_UsbFinder_EnterPairByFeature(stringBuilder, cid, mid);
	}

	public static byte[] GetPairStatusByFeature(string endPoint, byte reportId, int length)
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(endPoint);
		if (UsbFinder.isX64System())
		{
			return CS_UsbFinder_GetPairStatusByFeature(stringBuilder, reportId, length);
		}
		return UsbUpgradeFile32.CS_UsbFinder_GetPairStatusByFeature(stringBuilder, reportId, length);
	}

	public static string[] UsbUpgrade_GetLogs()
	{
		if (UsbFinder.isX64System())
		{
			return CS_UsbUpgrade_GetLogs();
		}
		return UsbUpgradeFile32.CS_UsbUpgrade_GetLogs();
	}
}
