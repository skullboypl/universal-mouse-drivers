using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using DriverLib;
using Mouse_Drive_Beta.FileManager;

namespace FileManager;

public class ConfigFile
{
	public static void ExportConfigFile(string company, string sensor, FlashDataMap flashDataMap)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Title = "导出配置";
		saveFileDialog.Filter = "bin文件|*.bin";
		if (saveFileDialog.ShowDialog() == DialogResult.OK)
		{
			FileStream fileStream = new FileStream(saveFileDialog.FileName, FileMode.Create);
			byte[] array = FlashDataMapToByte(flashDataMap);
			byte[] array2 = new byte[array.Length + 64];
			byte[] bytes = Encoding.UTF8.GetBytes(company);
			for (int i = 0; i < bytes.Length; i++)
			{
				array2[i] = bytes[i];
			}
			byte[] bytes2 = Encoding.UTF8.GetBytes(sensor);
			for (int j = 0; j < bytes2.Length; j++)
			{
				array2[j + 32] = bytes2[j];
			}
			for (int k = 0; k < array.Length; k++)
			{
				array2[k + 64] = array[k];
			}
			if (array2 != null)
			{
				fileStream.Write(array2, 0, array2.Length);
			}
			fileStream.Flush();
			fileStream.Close();
		}
	}

	public static int ImportConfigFile(string company, string sensor, ref byte[] data)
	{
		int result = -1;
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Title = "导入配置";
		openFileDialog.Filter = "bin文件|*.bin";
		if (openFileDialog.ShowDialog() == DialogResult.OK)
		{
			FileStream fileStream = new FileStream(openFileDialog.FileName, FileMode.Open, FileAccess.Read);
			byte[] array = new byte[fileStream.Length];
			fileStream.Read(array, 0, array.Length);
			if (array == null)
			{
				return 1;
			}
			byte[] bytes = Encoding.UTF8.GetBytes(company);
			for (int i = 0; i < company.Length; i++)
			{
				if (bytes[i] != array[i])
				{
					return 1;
				}
			}
			byte[] bytes2 = Encoding.UTF8.GetBytes(sensor);
			for (int j = 0; j < bytes2.Length; j++)
			{
				if (bytes2[j] != array[j + 32])
				{
					return 2;
				}
			}
			data = new byte[fileStream.Length - 64];
			for (int k = 0; k < fileStream.Length - 64; k++)
			{
				data[k] = array[k + 64];
			}
			if (data != null)
			{
				result = 0;
			}
			fileStream.Close();
		}
		return result;
	}

	public static void SaveDeviceConfigFile(string fileName, FlashDataMap flashDataMap)
	{
		string text = "";
		text = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
		text = text + "\\" + DriveConfig.GetCompany() + "\\" + DriveConfig.GetDriveName() + "\\Device_Info";
		if (!Directory.Exists(text))
		{
			Directory.CreateDirectory(text);
		}
		FileStream fileStream = new FileStream(text + "\\" + fileName, FileMode.Create, FileAccess.Write);
		byte[] array = FlashDataMapToByte(flashDataMap);
		if (array != null)
		{
			fileStream.Write(array, 0, array.Length);
		}
		fileStream.Flush();
		fileStream.Close();
	}

	public static bool ReadDeviceConfigFile(string fileName, ref byte[] data)
	{
		string text = "";
		string text2 = "";
		bool result = false;
		text2 = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
		text2 = text2 + "\\" + DriveConfig.GetCompany() + "\\" + DriveConfig.GetDriveName() + "\\Device_Info";
		if (!Directory.Exists(text2))
		{
			Directory.CreateDirectory(text2);
		}
		text = text2 + "\\" + fileName;
		if (File.Exists(text))
		{
			FileStream fileStream = new FileStream(text, FileMode.Open, FileAccess.Read);
			data = new byte[fileStream.Length];
			fileStream.Read(data, 0, data.Length);
			if (data != null)
			{
				result = true;
			}
			fileStream.Close();
		}
		return result;
	}

	public static byte[] FlashDataMapToByte(FlashDataMap map)
	{
		byte[] array = null;
		int num = Marshal.SizeOf(typeof(FlashDataMap));
		IntPtr intPtr = Marshal.AllocHGlobal(num);
		Marshal.StructureToPtr(map, intPtr, fDeleteOld: true);
		array = new byte[num];
		Marshal.Copy(intPtr, array, 0, num);
		Marshal.FreeHGlobal(intPtr);
		return array;
	}

	public static FlashDataMap ByteToFlashDataMap(byte[] data)
	{
		int num = Marshal.SizeOf(typeof(FlashDataMap));
		IntPtr intPtr = Marshal.AllocHGlobal(num);
		Marshal.Copy(data, 0, intPtr, num);
		FlashDataMap result = (FlashDataMap)Marshal.PtrToStructure(intPtr, typeof(FlashDataMap));
		Marshal.FreeHGlobal(intPtr);
		return result;
	}
}
