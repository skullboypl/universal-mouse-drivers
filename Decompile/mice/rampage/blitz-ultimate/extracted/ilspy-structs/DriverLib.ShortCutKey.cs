using System.Runtime.InteropServices;

namespace DriverLib;

public struct ShortCutKey
{
	public byte contextCount;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 6)]
	public MacroContext[] context;

	public ShortCutKey(int key)
	{
		contextCount = 0;
		context = new MacroContext[6];
		for (int i = 0; i < 6; i++)
		{
			context[i] = new MacroContext(0);
		}
	}
}
