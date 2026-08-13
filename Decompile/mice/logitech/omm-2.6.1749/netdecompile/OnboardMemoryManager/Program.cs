using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using OnboardMemoryManager.Helpers;

namespace OnboardMemoryManager;

internal class Program
{
	[STAThread]
	public static void Main(string[] args)
	{
		Assembly executingAssembly = Assembly.GetExecutingAssembly();
		Process currentProcess = Process.GetCurrentProcess();
		string productName = currentProcess.MainModule.FileVersionInfo.ProductName;
		string name = executingAssembly.GetName().Name;
		Process[] processes = Process.GetProcesses();
		foreach (Process process in processes)
		{
			if (process.MainWindowHandle == IntPtr.Zero || process.Id == currentProcess.Id)
			{
				continue;
			}
			try
			{
				if (process.MainModule.FileVersionInfo.ProductName == productName && WindowHelpers.BringMainWindowToFront(process))
				{
					return;
				}
			}
			catch (Win32Exception)
			{
			}
		}
		string name2 = "Global\\" + name;
		bool createdNew;
		using (new Mutex(initiallyOwned: true, name2, out createdNew))
		{
			if (!createdNew)
			{
				return;
			}
			string text = Path.Combine(Path.GetTempPath(), name);
			if (args.Contains("clean"))
			{
				waitForCloseAndCleanUp(text);
				return;
			}
			using (new AssemblyLoader(text))
			{
				App.Main();
			}
			if (Directory.Exists(text))
			{
				Process.Start(Assembly.GetExecutingAssembly().Location, "clean");
			}
		}
	}

	private static void waitForCloseAndCleanUp(string assemblyCacheDir)
	{
		string assemblyName = Assembly.GetExecutingAssembly().GetName().Name;
		int num = 0;
		Process[] array = (from p in Process.GetProcesses()
			where p.ProcessName == assemblyName
			select p).ToArray();
		while (array.Length > 1)
		{
			num += 100;
			if (num > 5000)
			{
				break;
			}
			Thread.Sleep(100);
			array = (from p in Process.GetProcesses()
				where p.ProcessName == assemblyName
				select p).ToArray();
		}
		int id = Process.GetCurrentProcess().Id;
		Process[] array2 = array;
		foreach (Process process in array2)
		{
			if (process.Id != id)
			{
				try
				{
					process.Kill();
				}
				catch (Exception)
				{
				}
			}
		}
		if (Directory.Exists(assemblyCacheDir))
		{
			try
			{
				Directory.Delete(assemblyCacheDir, recursive: true);
			}
			catch (Exception)
			{
			}
		}
	}
}
