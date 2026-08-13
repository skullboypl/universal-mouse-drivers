using System;
using System.Collections.Generic;
using System.IO;

namespace Mouse_Drive_Beta.FileManager;

public class SensorDPIFile
{
	public List<SensorDPI> SensorDPIList = new List<SensorDPI>();

	public static void GetSensorDPI(ref SensorDPI sensorDPI)
	{
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "driver_sensor.h";
		new StreamReader(File.OpenRead(path));
		string[] array = File.ReadAllLines(path);
		sensorDPI.Discord = false;
		sensorDPI.DPIList = new List<int>();
		sensorDPI.DPIList.Clear();
		sensorDPI.DPIValueList = new List<int>();
		sensorDPI.DPIValueList.Clear();
		int num = sensorDPI.Min[0];
		string type = sensorDPI.Type;
		for (int i = 0; i < array.Length; i++)
		{
			string value = "SENSOR_" + type + "_DPI_" + num;
			if (!array[i].Contains(value))
			{
				continue;
			}
			string[] array2 = array[i].Split(' ', '\t');
			for (int j = 0; j < array2.Length; j++)
			{
				int item = 0;
				bool flag = false;
				try
				{
					item = ValueConvert.StringToInt(array2[j]);
					flag = true;
				}
				catch
				{
				}
				if (flag)
				{
					sensorDPI.DPIList.Add(num);
					sensorDPI.DPIValueList.Add(item);
					num += sensorDPI.Step[0];
					sensorDPI.Discord = true;
					break;
				}
			}
		}
	}

	private static string SupportSensorSetting(string setting)
	{
		string result = null;
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "driver_sensor.h";
		File.OpenRead(path);
		string[] array = File.ReadAllLines(path);
		for (int i = 0; i < array.Length; i++)
		{
			if (array[i].Contains(setting))
			{
				result = array[i];
				result = result.Replace("#define", "");
			}
		}
		return result;
	}

	public static bool SupportLODCal(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_LOD_CAL").Contains(sensor))
		{
			result = true;
		}
		return result;
	}

	public static bool SupportSensorModeSel(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_SENSOR_MODE_SEL").Contains(sensor))
		{
			result = true;
		}
		return result;
	}

	public static bool SupportRipple(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_RIPPLE").Contains(sensor))
		{
			result = true;
		}
		return result;
	}

	public static bool SupportFixline(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_FIXLINE").Contains(sensor))
		{
			result = true;
		}
		return result;
	}

	public static bool SupportMotionSync(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_MOTION_SYNC").Contains(sensor))
		{
			result = true;
		}
		return result;
	}

	public static bool SupportMousepadCal(string sensor)
	{
		bool result = false;
		if (SupportSensorSetting("SUPPORT_MOUSEPAD_CAL").Contains(sensor))
		{
			result = true;
		}
		return result;
	}
}
