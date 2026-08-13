using System.Runtime.InteropServices;

namespace DriverLib;

public struct DPIConfig
{
	public byte xDPI;

	public byte yDPI;

	public byte DPIex;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
	public byte[] color;
}
