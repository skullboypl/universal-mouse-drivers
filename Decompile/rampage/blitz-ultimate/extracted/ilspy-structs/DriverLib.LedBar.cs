using System.Runtime.InteropServices;

namespace DriverLib;

public struct LedBar
{
	public byte mode;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
	public byte[] color;

	public byte speed;

	public byte brightness;

	public byte enable;
}
