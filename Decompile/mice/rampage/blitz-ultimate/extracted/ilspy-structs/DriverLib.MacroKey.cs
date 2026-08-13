using System.Runtime.InteropServices;

namespace DriverLib;

public struct MacroKey
{
	public byte nameLength;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 30)]
	public byte[] name;

	public byte contextCount;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 70)]
	public MacroContext[] context;

	public MacroKey(int key)
	{
		nameLength = 0;
		name = new byte[30];
		contextCount = 0;
		context = new MacroContext[70];
		for (int i = 0; i < 70; i++)
		{
			context[i] = new MacroContext(0);
		}
	}
}
