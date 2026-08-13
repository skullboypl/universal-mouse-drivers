using System.Runtime.InteropServices;

namespace DriverLib;

public struct FlashDataMap
{
	public MouseConfig mouseConfig;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 8)]
	public DPIConfig[] dpiConfig;

	public DPILed dpiLed;

	public LedBar ledBar;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
	public KeyFunMap[] keys;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
	public ShortCutKey[] shortCutKey;

	[MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
	public MacroKey[] macroKey;

	public FlashDataMap(int key)
	{
		mouseConfig = default(MouseConfig);
		dpiConfig = new DPIConfig[8];
		dpiLed = default(DPILed);
		ledBar = default(LedBar);
		keys = new KeyFunMap[16];
		shortCutKey = new ShortCutKey[16];
		macroKey = new MacroKey[16];
	}
}
