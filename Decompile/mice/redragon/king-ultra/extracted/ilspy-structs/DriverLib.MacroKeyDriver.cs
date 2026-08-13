using System;
using System.Text;

namespace DriverLib;

public class MacroKeyDriver
{
	public MacroKey macroKey = new MacroKey(0);

	public void Clear()
	{
		macroKey.contextCount = 0;
	}

	public void SetMacroName(string name)
	{
		if (name.Length < macroKey.name.Length)
		{
			macroKey.nameLength = (byte)name.Length;
			Array.Clear(macroKey.name, 0, macroKey.name.Length);
			byte[] bytes = Encoding.Default.GetBytes(name);
			Array.Copy(bytes, 0, macroKey.name, 0, bytes.Length);
		}
	}

	public void AddMacroKey(KEY_STATE keyState, HID_CODE_TYPE keyType, int hidCode, uint delay)
	{
		if (macroKey.contextCount < 70)
		{
			int num = macroKey.contextCount++;
			macroKey.context[num].keyState = (byte)keyState;
			macroKey.context[num].type = (byte)keyType;
			macroKey.context[num].value[0] = (byte)hidCode;
			macroKey.context[num].value[1] = (byte)(hidCode >> 8);
			if (num > 0)
			{
				macroKey.context[num - 1].delay = delay;
			}
		}
	}

	public void InsertMacroKey(KEY_STATE keyState, HID_CODE_TYPE keyType, int hidCode, uint delay, int index)
	{
		if (macroKey.contextCount == 0)
		{
			macroKey.context[index].keyState = (byte)keyState;
			macroKey.context[index].type = (byte)keyType;
			macroKey.context[index].value[0] = (byte)hidCode;
			macroKey.context[index].value[1] = (byte)(hidCode >> 8);
			macroKey.context[index].delay = delay;
			macroKey.contextCount++;
		}
		else if (macroKey.contextCount < 70)
		{
			for (int num = macroKey.contextCount; num > index; num--)
			{
				macroKey.context[num].keyState = macroKey.context[num - 1].keyState;
				macroKey.context[num].type = macroKey.context[num - 1].type;
				macroKey.context[num].value[0] = macroKey.context[num - 1].value[0];
				macroKey.context[num].value[1] = macroKey.context[num - 1].value[1];
				macroKey.context[num].delay = macroKey.context[num - 1].delay;
			}
			macroKey.context[index].keyState = (byte)keyState;
			macroKey.context[index].type = (byte)keyType;
			macroKey.context[index].value[0] = (byte)hidCode;
			macroKey.context[index].value[1] = (byte)(hidCode >> 8);
			if (index > 0)
			{
				macroKey.context[index].delay = delay;
			}
			macroKey.contextCount++;
		}
	}

	public void ModifyMacroKey(MacroKey macroKey, int hidCode, int index)
	{
		macroKey.context[index].value[0] = (byte)hidCode;
		macroKey.context[index].value[1] = (byte)(hidCode >> 8);
	}

	public void InsertMouseKey(byte[] value, int index, uint delay)
	{
		if (macroKey.contextCount == 0)
		{
			macroKey.context[index].keyState = 0;
			macroKey.context[index].type = 4;
			macroKey.context[index].value[0] = value[0];
			macroKey.context[index].value[1] = value[1];
			macroKey.context[index].delay = delay;
			macroKey.context[index + 1].keyState = 1;
			macroKey.context[index + 1].type = 4;
			macroKey.context[index + 1].value[0] = value[0];
			macroKey.context[index + 1].value[1] = value[1];
			macroKey.context[index + 1].delay = delay;
			macroKey.contextCount++;
			macroKey.contextCount++;
		}
		else if (macroKey.contextCount < 70)
		{
			macroKey.contextCount++;
			macroKey.contextCount++;
			int num = ((index < 2) ? 2 : index);
			for (int num2 = macroKey.contextCount; num2 >= num; num2--)
			{
				macroKey.context[num2].keyState = macroKey.context[num2 - 2].keyState;
				macroKey.context[num2].type = macroKey.context[num2 - 2].type;
				macroKey.context[num2].value[0] = macroKey.context[num2 - 2].value[0];
				macroKey.context[num2].value[1] = macroKey.context[num2 - 2].value[1];
				macroKey.context[num2].delay = macroKey.context[num2 - 2].delay;
			}
			macroKey.context[index].keyState = 0;
			macroKey.context[index].type = 4;
			macroKey.context[index].value[0] = value[0];
			macroKey.context[index].value[1] = value[1];
			macroKey.context[index].delay = delay;
			macroKey.context[index + 1].keyState = 1;
			macroKey.context[index + 1].type = 4;
			macroKey.context[index + 1].value[0] = value[0];
			macroKey.context[index + 1].value[1] = value[1];
			macroKey.context[index + 1].delay = delay;
		}
	}

	public void InsertMoveXY(byte[] value, int index)
	{
		if (macroKey.contextCount == 0)
		{
			macroKey.context[index].keyState = 2;
			macroKey.context[index].type = 5;
			macroKey.context[index].value[0] = value[0];
			macroKey.context[index].value[1] = value[1];
			macroKey.context[index].delay = 0u;
			macroKey.context[index + 1].keyState = 2;
			macroKey.context[index + 1].type = 5;
			macroKey.context[index + 1].value[0] = 0;
			macroKey.context[index + 1].value[1] = 0;
			macroKey.context[index + 1].delay = 0u;
			macroKey.contextCount++;
			macroKey.contextCount++;
		}
		else if (macroKey.contextCount < 70)
		{
			macroKey.contextCount++;
			macroKey.contextCount++;
			int num = ((index < 2) ? 2 : index);
			for (int num2 = macroKey.contextCount; num2 >= num; num2--)
			{
				macroKey.context[num2].keyState = macroKey.context[num2 - 1].keyState;
				macroKey.context[num2].type = macroKey.context[num2 - 1].type;
				macroKey.context[num2].value[0] = macroKey.context[num2 - 1].value[0];
				macroKey.context[num2].value[1] = macroKey.context[num2 - 1].value[1];
				macroKey.context[num2].delay = macroKey.context[num2 - 1].delay;
			}
			macroKey.context[index].keyState = 2;
			macroKey.context[index].type = 5;
			macroKey.context[index].value[0] = value[0];
			macroKey.context[index].value[1] = value[1];
			macroKey.context[index].delay = 0u;
			macroKey.context[index + 1].keyState = 2;
			macroKey.context[index + 1].type = 5;
			macroKey.context[index + 1].value[0] = 0;
			macroKey.context[index + 1].value[1] = 0;
			macroKey.context[index + 1].delay = 0u;
		}
	}

	public void DeleteMacroKey(int index)
	{
		for (int i = index; i < macroKey.contextCount - 1; i++)
		{
			macroKey.context[i].keyState = macroKey.context[i + 1].keyState;
			macroKey.context[i].type = macroKey.context[i + 1].type;
			macroKey.context[i].value[0] = macroKey.context[i + 1].value[0];
			macroKey.context[i].value[1] = macroKey.context[i + 1].value[1];
			macroKey.context[i].delay = macroKey.context[i + 1].delay;
		}
		macroKey.context[macroKey.contextCount - 1] = new MacroContext(0);
		macroKey.contextCount--;
	}

	public void InsertDelay(uint delay, int index)
	{
		if (macroKey.contextCount < 70)
		{
			macroKey.context[index].delay = ((delay > 65535) ? 65535u : delay);
		}
	}

	public void ModifyDelay(uint delay, int index)
	{
		macroKey.context[index].delay = ((delay > 65535) ? 65535u : delay);
	}

	public void DeletcDelay(int index)
	{
		macroKey.context[index].delay = 0u;
	}

	public void Sorting()
	{
		if (macroKey.contextCount >= 70)
		{
			return;
		}
		int contextCount = macroKey.contextCount;
		for (int i = 0; i < contextCount; i++)
		{
			if (macroKey.context[i].keyState == 0 && macroKey.context[i].type == 0 && macroKey.context[i].value[0] == 0 && macroKey.context[i].value[1] == 0)
			{
				if (i > 0)
				{
					uint num = macroKey.context[i].delay + macroKey.context[i - 1].delay;
					num = ((num > 65535) ? 65535u : num);
					macroKey.context[i - 1].delay = num;
				}
				macroKey.contextCount--;
				contextCount = macroKey.contextCount;
				for (int j = i; j < contextCount; j++)
				{
					macroKey.context[j].keyState = macroKey.context[j + 1].keyState;
					macroKey.context[j].type = macroKey.context[j + 1].type;
					macroKey.context[j].value[0] = macroKey.context[j + 1].value[0];
					macroKey.context[j].value[1] = macroKey.context[j + 1].value[1];
					macroKey.context[j].delay = macroKey.context[j + 1].delay;
				}
				Sorting();
			}
		}
	}

	public static void Copy(MacroKey macroKey, ref MacroKeyAndCycle OutParam, string name, byte cycleTimes)
	{
		OutParam.name = name;
		OutParam.CycleTimes = cycleTimes;
		OutParam.macroKey.name = Encoding.Default.GetBytes(name);
		OutParam.macroKey.nameLength = (byte)OutParam.macroKey.name.Length;
		OutParam.macroKey.contextCount = macroKey.contextCount;
		for (int i = 0; i < macroKey.contextCount; i++)
		{
			OutParam.macroKey.context[i] = macroKey.context[i];
		}
	}

	public void GetMacroKeyData(ref MacroKey outMacroKey)
	{
		outMacroKey.nameLength = macroKey.nameLength;
		Array.Copy(macroKey.name, 0, outMacroKey.name, 0, macroKey.name.Length);
		outMacroKey.contextCount = macroKey.contextCount;
		for (int i = 0; i < macroKey.contextCount; i++)
		{
			outMacroKey.context[i].keyState = macroKey.context[i].keyState;
			outMacroKey.context[i].type = macroKey.context[i].type;
			outMacroKey.context[i].value[0] = macroKey.context[i].value[0];
			outMacroKey.context[i].value[1] = macroKey.context[i].value[1];
			outMacroKey.context[i].delay = macroKey.context[i].delay;
		}
	}
}
