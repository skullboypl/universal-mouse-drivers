using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using System.Xml;
using FileManager;

namespace Mouse_Drive_Beta.FileManager;

public class DriveConfig
{
	public class DriveParam
	{
		public int Debug;

		public string Company;

		public string DriveName;

		public List<string> VID = new List<string>();

		public List<string> M_PID = new List<string>();

		public List<string> D_PID = new List<string>();

		public int Interfaceid;

		public int Deviceid;

		public int CID;

		public int DeviceTotal;

		public Color LblForeClr;

		public Color BtnForeClr;

		public Color CbbBgClr;

		public Color CbbItemClr;

		public Color CbbForeClr;

		public Color TxtBgClr;

		public Color TxtForeClr;

		public Color LstViewBgClr;

		public Color SliderClr;

		public Color HPCbbBgClr;

		public Color HPCbbItemClr;

		public Color HPCbbForeClr;

		public Color NumClr;

		public Color DlgTxtBgClr;

		public Color DlgTxtForeClr;

		public Color TipsClr;

		public bool ShowBatteryValue;

		public string Version;

		public int OfflineCantIn;

		public int ClickMouseEnterTips;

		public Point TabLocation;

		public List<DeviceParam> DeviceParams;
	}

	public class DeviceParam
	{
		public int MID;

		public string DeviceName;

		public int XIn1;

		public int KeyNumber;

		public int DefaultDPI;

		public int DPIMaxGrade;

		public string Sensor;

		public int[] DPIRange = new int[15];

		public int[] DPIGrade = new int[8];

		public Color[] DPIColor = new Color[8];

		public SensorDPI SensorDPI;

		public string MM;

		public string DM;

		public string D2M;

		public string D4M;

		public string D8M;

		public int KeyDebounceTime;

		public KeyParam[] KeyParams = new KeyParam[16];

		public string SensorUI;

		public string LightUI;

		public bool DisplayLight;

		public int[] BatteryParam = new int[22];

		public int Show4KDongleLED;

		public int[] Advanced;

		public int UnchangeProfile;

		public bool DisableDPIColor;
	}

	public struct KeyParam
	{
		public Point point;

		public byte index;

		public byte type;

		public byte param1;

		public byte param2;

		public string name;
	}

	public DriveParam gDriveParam = new DriveParam();

	[DllImport("kernel32")]
	private static extern int GetPrivateProfileString(string section, string key, string def, StringBuilder retVal, int size, string filePath);

	public static string INIRead(string section, string key, string path)
	{
		StringBuilder stringBuilder = new StringBuilder(255);
		File.ReadAllLines(path);
		GetPrivateProfileString(section, key, "", stringBuilder, 255, path);
		return stringBuilder.ToString();
	}

	public bool GetDriveConfig()
	{
		bool result = true;
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "Config.ini";
		gDriveParam = new DriveParam();
		if (!File.Exists(path))
		{
			return false;
		}
		FieldInfo[] fields = typeof(DriveParam).GetFields();
		foreach (FieldInfo fieldInfo in fields)
		{
			string text = INIRead("Option", fieldInfo.Name, path);
			if (fieldInfo.Name == "DeviceParams")
			{
				gDriveParam.DeviceParams = new List<DeviceParam>();
				for (int j = 0; j < gDriveParam.DeviceTotal; j++)
				{
					DeviceParam deviceParam = new DeviceParam();
					if (!GetDeviceParam(path, j, out deviceParam))
					{
						return false;
					}
					gDriveParam.DeviceParams.Add(deviceParam);
				}
			}
			else if (fieldInfo.Name == "CID")
			{
				string text2 = "";
				byte[] bytes = Convert.FromBase64String(text);
				text = Encoding.UTF8.GetString(bytes);
				text = text.Replace('?', '0');
				text2 = text.Replace(gDriveParam.DriveName, "");
				try
				{
					int.Parse(text2);
				}
				catch (Exception ex)
				{
					text = "";
					new ExceptionLog(ex.Message);
					return false;
				}
				ValueConvert.ClassSetValue(gDriveParam, fieldInfo, text2);
			}
			else if (fieldInfo.Name == "VID" || fieldInfo.Name == "M_PID" || fieldInfo.Name == "D_PID" || fieldInfo.Name == "D4_PID")
			{
				byte[] bytes2 = Convert.FromBase64String(text);
				text = Encoding.ASCII.GetString(bytes2);
				text = text.Replace(gDriveParam.Company, "");
				string[] array = text.Split(',');
				try
				{
					for (int k = 0; k < array.Length; k++)
					{
						Convert.ToInt32(array[k], 16);
					}
				}
				catch (Exception ex2)
				{
					text = "";
					new ExceptionLog(ex2.Message);
					return false;
				}
				ValueConvert.ClassSetValue(gDriveParam, fieldInfo, text);
			}
			else if (fieldInfo.Name == "TabLocation")
			{
				string[] array2 = text.Split(',');
				try
				{
					if (array2.Length == 2)
					{
						gDriveParam.TabLocation.X = Convert.ToInt32(array2[0]);
						gDriveParam.TabLocation.Y = Convert.ToInt32(array2[1]);
					}
				}
				catch (Exception ex3)
				{
					text = "";
					new ExceptionLog(ex3.Message);
					return false;
				}
			}
			else
			{
				ValueConvert.ClassSetValue(gDriveParam, fieldInfo, text);
			}
		}
		return result;
	}

	public static DriveParam GetDriveParam()
	{
		DriveParam driveParam = new DriveParam();
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "Config.ini";
		FieldInfo[] fields = typeof(DriveParam).GetFields();
		foreach (FieldInfo fieldInfo in fields)
		{
			string str = INIRead("Option", fieldInfo.Name, path);
			if (fieldInfo.FieldType.Name == "Color" || fieldInfo.Name == "Web")
			{
				ValueConvert.ClassSetValue(driveParam, fieldInfo, str);
			}
		}
		return driveParam;
	}

	public static int GetDebug()
	{
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "Config.ini";
		return Convert.ToInt32(INIRead("Option", "Debug", path));
	}

	public static string GetDriveName()
	{
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "Config.ini";
		return INIRead("Option", "DriveName", path);
	}

	public static string GetCompany()
	{
		string path = Convert.ToString(AppDomain.CurrentDomain.BaseDirectory) + "Config.ini";
		return INIRead("Option", "Company", path);
	}

	public bool GetDeviceParam(string path, int index, out DeviceParam deviceParam)
	{
		bool result = true;
		FieldInfo[] fields = typeof(DeviceParam).GetFields();
		deviceParam = new DeviceParam();
		string section = "Device" + (index + 1);
		FieldInfo[] array = fields;
		foreach (FieldInfo fieldInfo in array)
		{
			string text = INIRead(section, fieldInfo.Name, path);
			if (fieldInfo.Name == "MM" || fieldInfo.Name == "Sensor" || fieldInfo.Name == "DM" || fieldInfo.Name == "D2M" || fieldInfo.Name == "D4M" || fieldInfo.Name == "D8M")
			{
				if (text != "")
				{
					try
					{
						byte[] array2 = Convert.FromBase64String(text);
						text = Encoding.ASCII.GetString(array2);
						for (int j = 0; j < array2.Length; j++)
						{
							if ((array2[j] >= 90 || array2[j] <= 65) && (array2[j] >= 122 || array2[j] <= 97) && (array2[j] > 57 || array2[j] < 48))
							{
								return false;
							}
						}
					}
					catch (Exception ex)
					{
						text = "";
						new ExceptionLog(ex.Message);
						return false;
					}
					ValueConvert.ClassSetValue(deviceParam, fieldInfo, text);
				}
				else
				{
					ValueConvert.ClassSetValue(deviceParam, fieldInfo, text);
				}
			}
			else if (fieldInfo.Name == "BatteryParam")
			{
				string[] array3 = text.Split(',');
				for (int k = 0; k < deviceParam.BatteryParam.Length; k++)
				{
					deviceParam.BatteryParam[k] = Convert.ToInt32(array3[k]);
				}
			}
			else if (fieldInfo.Name == "DPIRange")
			{
				SensorDPI sensorDPI = default(SensorDPI);
				string[] array4 = text.Split(',');
				sensorDPI.Type = deviceParam.Sensor;
				sensorDPI.Min = new List<int>();
				sensorDPI.Max = new List<int>();
				sensorDPI.Step = new List<int>();
				for (int l = 0; l < array4.Length / 3; l++)
				{
					sensorDPI.Min.Add(int.Parse(array4[3 * l]));
					sensorDPI.Max.Add(int.Parse(array4[3 * l + 1]));
					sensorDPI.Step.Add(int.Parse(array4[3 * l + 2]));
				}
				sensorDPI.DPIex = ValueConvert.StringToInt(array4[array4.Length - 1]);
				SensorDPIFile.GetSensorDPI(ref sensorDPI);
				deviceParam.SensorDPI = sensorDPI;
			}
			else if (!(fieldInfo.Name == "SensorDPI"))
			{
				ValueConvert.ClassSetValue(deviceParam, fieldInfo, text);
			}
		}
		for (int m = 0; m < 16; m++)
		{
			string text = INIRead(section, "KeyParam" + (m + 1), path);
			string[] array5 = text.Split(',');
			deviceParam.KeyParams[m].point = new Point(Convert.ToInt32(array5[0]), Convert.ToInt32(array5[1]));
			deviceParam.KeyParams[m].index = (byte)ValueConvert.StringToInt(array5[2]);
			deviceParam.KeyParams[m].type = (byte)ValueConvert.StringToInt(array5[3]);
			deviceParam.KeyParams[m].param1 = (byte)ValueConvert.StringToInt(array5[4]);
			deviceParam.KeyParams[m].param2 = (byte)ValueConvert.StringToInt(array5[5]);
			if (array5.Length > 5 && array5[5] != null)
			{
				deviceParam.KeyParams[m].name = array5[5];
			}
		}
		return result;
	}

	public static string GetDriveVersion()
	{
		string filePath = Convert.ToString(Application.StartupPath) + "Config.ini";
		StringBuilder stringBuilder = new StringBuilder(255);
		GetPrivateProfileString("Option", "Version", "", stringBuilder, 255, filePath);
		return stringBuilder.ToString();
	}

	public static string GetWeb(string lan)
	{
		string text = Application.StartupPath + "\\Description.xml";
		if (!File.Exists(text))
		{
			return "";
		}
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.Load(text);
		XmlNode xmlNode = xmlDocument.GetElementsByTagName(lan)[0];
		if (xmlNode == null)
		{
			xmlNode = xmlDocument.GetElementsByTagName("Web")[0];
			if (xmlNode == null)
			{
				xmlNode = xmlDocument.GetElementsByTagName("English-Web")[0];
			}
		}
		return xmlNode.InnerText;
	}

	public static string GetDescription(string lan)
	{
		string text = Application.StartupPath + "\\Description.xml";
		if (!File.Exists(text))
		{
			return "";
		}
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.Load(text);
		XmlNode xmlNode = xmlDocument.GetElementsByTagName(lan)[0];
		if (xmlNode == null)
		{
			xmlNode = xmlDocument.GetElementsByTagName("English")[0];
		}
		return xmlNode.InnerText;
	}
}
