using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Windows.Forms;
using DriverLib;

namespace Mouse_Drive_Beta.FileManager;

public class MacroFile
{
	public static void SaveLocalMacroKey(List<MacroKeyAndCycle> MacroKeyAndCycleList)
	{
		string text = "";
		text = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
		text = text + "\\" + DriveConfig.GetCompany() + "\\" + DriveConfig.GetDriveName();
		if (!Directory.Exists(text))
		{
			Directory.CreateDirectory(text);
		}
		StreamWriter streamWriter = new StreamWriter(new FileStream(text + "\\MacroKey.txt", FileMode.Create, FileAccess.Write));
		for (int i = 0; i < MacroKeyAndCycleList.Count; i++)
		{
			SaveMacroKey(streamWriter, MacroKeyAndCycleList[i]);
		}
		streamWriter.Flush();
		streamWriter.Flush();
		streamWriter.Close();
		streamWriter.Close();
	}

	public static void SaveMacroKey(StreamWriter streamWriter, MacroKeyAndCycle macroKeyAndCycle)
	{
		byte[] array = new byte[6];
		string text = "";
		string name = macroKeyAndCycle.name;
		text = "Macro Name:" + name;
		streamWriter.WriteLine(text);
		text = "Macro Context Count:" + macroKeyAndCycle.macroKey.contextCount;
		streamWriter.WriteLine(text);
		text = "Macro Cycle Times:" + macroKeyAndCycle.CycleTimes;
		streamWriter.WriteLine(text);
		for (int i = 0; i < macroKeyAndCycle.macroKey.contextCount; i++)
		{
			array[0] = macroKeyAndCycle.macroKey.context[i].type;
			array[1] = macroKeyAndCycle.macroKey.context[i].keyState;
			array[2] = macroKeyAndCycle.macroKey.context[i].value[0];
			array[3] = macroKeyAndCycle.macroKey.context[i].value[1];
			array[4] = (byte)macroKeyAndCycle.macroKey.context[i].delay;
			array[5] = (byte)(macroKeyAndCycle.macroKey.context[i].delay >> 8);
			text = "";
			for (int j = 0; j < array.Length; j++)
			{
				text = text + array[j].ToString("X2") + " ";
			}
			streamWriter.WriteLine(text);
		}
	}

	public static void ExportMacroFile(MacroKeyAndCycle macroKeyAndCycle, string fileName, string str)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Title = "导出宏";
		saveFileDialog.Filter = "txt文件|*.txt";
		saveFileDialog.FileName = fileName;
		if (saveFileDialog.ShowDialog() == DialogResult.OK)
		{
			FileStream fileStream = new FileStream(saveFileDialog.FileName, FileMode.Create);
			StreamWriter streamWriter = new StreamWriter(fileStream);
			streamWriter.WriteLine(str);
			SaveMacroKey(streamWriter, macroKeyAndCycle);
			streamWriter.Flush();
			fileStream.Flush();
			streamWriter.Close();
			fileStream.Close();
		}
	}

	public static bool ReadLocalMacroKey(ref List<MacroKeyAndCycle> MacroKeyAndCycleList)
	{
		string text = "";
		string text2 = "";
		string path = AppDomain.CurrentDomain.BaseDirectory + "\\MacroKey.txt";
		bool result = false;
		text2 = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
		text2 = text2 + "\\" + DriveConfig.GetCompany() + "\\" + DriveConfig.GetDriveName();
		if (!Directory.Exists(text2))
		{
			Directory.CreateDirectory(text2);
		}
		text = text2 + "\\MacroKey.txt";
		if (File.Exists(text))
		{
			FileStream fileStream = File.OpenRead(text);
			StreamReader streamReader = new StreamReader(fileStream);
			string[] array = File.ReadAllLines(text);
			if (array.Length == 0)
			{
				fileStream.Flush();
				fileStream.Close();
				streamReader.Close();
				return result;
			}
			MacroKeyAndCycle macroKeyAndCycle = new MacroKeyAndCycle(0);
			MacroKeyAndCycleList = new List<MacroKeyAndCycle>(0);
			int index = 0;
			for (int i = 0; i < array.Length; i++)
			{
				if (ReadMacroKey(streamReader, ref macroKeyAndCycle, ref index))
				{
					MacroKeyAndCycleList.Add(macroKeyAndCycle);
					macroKeyAndCycle = new MacroKeyAndCycle(0);
				}
			}
			fileStream.Flush();
			fileStream.Close();
			streamReader.Close();
			result = true;
		}
		else if (File.Exists(path))
		{
			FileStream fileStream2 = File.OpenRead(path);
			StreamReader streamReader2 = new StreamReader(fileStream2);
			string[] array2 = File.ReadAllLines(path);
			if (array2.Length == 0)
			{
				fileStream2.Flush();
				fileStream2.Close();
				streamReader2.Close();
				return result;
			}
			MacroKeyAndCycle macroKeyAndCycle2 = new MacroKeyAndCycle(0);
			MacroKeyAndCycleList = new List<MacroKeyAndCycle>(0);
			int index2 = 0;
			for (int j = 0; j < array2.Length; j++)
			{
				if (ReadMacroKey(streamReader2, ref macroKeyAndCycle2, ref index2))
				{
					MacroKeyAndCycleList.Add(macroKeyAndCycle2);
					macroKeyAndCycle2 = new MacroKeyAndCycle(0);
				}
			}
			fileStream2.Flush();
			fileStream2.Close();
			streamReader2.Close();
			result = true;
		}
		return result;
	}

	public static bool ReadMacroKey(StreamReader streamReader, ref MacroKeyAndCycle macroKeyAndCycle, ref int index)
	{
		string text = streamReader.ReadLine();
		bool result = false;
		if (text == null || text == "")
		{
			return false;
		}
		if (text.Contains("Macro Name:"))
		{
			text = text.Replace("Macro Name:", "");
			macroKeyAndCycle.macroKey.name = Encoding.Default.GetBytes(text);
			macroKeyAndCycle.macroKey.nameLength = (byte)macroKeyAndCycle.macroKey.name.Length;
		}
		else if (text.Contains("Macro Context Count:"))
		{
			text = text.Replace("Macro Context Count:", "");
			macroKeyAndCycle.macroKey.contextCount = Convert.ToByte(text);
		}
		else if (text.Contains("Macro Cycle Times:"))
		{
			text = text.Replace("Macro Cycle Times:", "");
			macroKeyAndCycle.CycleTimes = Convert.ToByte(text);
			if (macroKeyAndCycle.macroKey.contextCount == 0)
			{
				result = true;
				macroKeyAndCycle.name = Encoding.Default.GetString(macroKeyAndCycle.macroKey.name);
				index = 0;
			}
		}
		else
		{
			if (macroKeyAndCycle.macroKey.contextCount > 0)
			{
				text = text.Replace(" ", "");
				byte[] array = new byte[text.Length / 2];
				for (int i = 0; i < text.Length / 2; i++)
				{
					string value = text.Substring(i * 2, 2);
					array[i] = Convert.ToByte(value, 16);
				}
				macroKeyAndCycle.macroKey.context[index].type = array[0];
				macroKeyAndCycle.macroKey.context[index].keyState = array[1];
				macroKeyAndCycle.macroKey.context[index].value[0] = array[2];
				macroKeyAndCycle.macroKey.context[index].value[1] = array[3];
				macroKeyAndCycle.macroKey.context[index].delay = (uint)(array[4] + (array[5] << 8));
				index++;
			}
			if ((index == macroKeyAndCycle.macroKey.contextCount && macroKeyAndCycle.macroKey.contextCount > 0) || macroKeyAndCycle.macroKey.contextCount == 0)
			{
				result = true;
				macroKeyAndCycle.name = Encoding.Default.GetString(macroKeyAndCycle.macroKey.name);
				index = 0;
			}
		}
		return result;
	}

	public static int ImportMacroFile(ref MacroKeyAndCycle OutMacroKeyAndCycle, string str)
	{
		int result = -1;
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Title = "导入宏";
		openFileDialog.Filter = "txt文件|*.txt";
		if (openFileDialog.ShowDialog() == DialogResult.OK)
		{
			FileStream fileStream = new FileStream(openFileDialog.FileName, FileMode.Open, FileAccess.Read);
			StreamReader streamReader = new StreamReader(fileStream);
			string[] array = File.ReadAllLines(openFileDialog.FileName);
			MacroKeyAndCycle macroKeyAndCycle = new MacroKeyAndCycle(0);
			int index = 0;
			if (str.Contains(array[0]))
			{
				for (int i = 0; i < array.Length; i++)
				{
					if (ReadMacroKey(streamReader, ref macroKeyAndCycle, ref index))
					{
						OutMacroKeyAndCycle = macroKeyAndCycle;
						result = 0;
					}
				}
			}
			else
			{
				result = 1;
			}
			fileStream.Flush();
			fileStream.Close();
			streamReader.Close();
		}
		return result;
	}
}
