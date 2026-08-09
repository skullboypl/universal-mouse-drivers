namespace DriverLib;

public struct MacroKeyAndCycle
{
	public MacroKey macroKey;

	public byte CycleTimes;

	public string name;

	public MacroKeyAndCycle(int key)
	{
		macroKey = new MacroKey(0);
		CycleTimes = 1;
		name = "";
	}
}
