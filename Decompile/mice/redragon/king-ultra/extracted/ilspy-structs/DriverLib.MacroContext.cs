using System.Runtime.InteropServices;

namespace DriverLib;

public struct MacroContext
{
	public byte keyState;

	public byte type;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 2)]
	public byte[] value;

	public uint delay;

	public MacroContext(int key)
	{
		keyState = 1;
		type = 1;
		value = new byte[2];
		value[0] = 0;
		value[1] = 0;
		delay = 0u;
	}
}
