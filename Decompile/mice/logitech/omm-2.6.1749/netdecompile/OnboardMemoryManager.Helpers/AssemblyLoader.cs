using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;

namespace OnboardMemoryManager.Helpers;

public sealed class AssemblyLoader : IDisposable
{
	private static readonly IList<string> _logiNethidppioDependentAssemblies = new ReadOnlyCollection<string>(new List<string>
	{
		"api-ms-win-core-console-l1-1-0.dll", "api-ms-win-core-console-l1-2-0.dll", "api-ms-win-core-datetime-l1-1-0.dll", "api-ms-win-core-debug-l1-1-0.dll", "api-ms-win-core-errorhandling-l1-1-0.dll", "api-ms-win-core-file-l1-1-0.dll", "api-ms-win-core-file-l1-2-0.dll", "api-ms-win-core-file-l2-1-0.dll", "api-ms-win-core-handle-l1-1-0.dll", "api-ms-win-core-heap-l1-1-0.dll",
		"api-ms-win-core-interlocked-l1-1-0.dll", "api-ms-win-core-libraryloader-l1-1-0.dll", "api-ms-win-core-localization-l1-2-0.dll", "api-ms-win-core-memory-l1-1-0.dll", "api-ms-win-core-namedpipe-l1-1-0.dll", "api-ms-win-core-processenvironment-l1-1-0.dll", "api-ms-win-core-processthreads-l1-1-0.dll", "api-ms-win-core-processthreads-l1-1-1.dll", "api-ms-win-core-profile-l1-1-0.dll", "api-ms-win-core-rtlsupport-l1-1-0.dll",
		"api-ms-win-core-string-l1-1-0.dll", "api-ms-win-core-synch-l1-1-0.dll", "api-ms-win-core-synch-l1-2-0.dll", "api-ms-win-core-sysinfo-l1-1-0.dll", "api-ms-win-core-timezone-l1-1-0.dll", "api-ms-win-core-util-l1-1-0.dll", "API-MS-Win-core-xstate-l2-1-0.dll", "api-ms-win-crt-conio-l1-1-0.dll", "api-ms-win-crt-convert-l1-1-0.dll", "api-ms-win-crt-environment-l1-1-0.dll",
		"api-ms-win-crt-filesystem-l1-1-0.dll", "api-ms-win-crt-heap-l1-1-0.dll", "api-ms-win-crt-locale-l1-1-0.dll", "api-ms-win-crt-math-l1-1-0.dll", "api-ms-win-crt-multibyte-l1-1-0.dll", "api-ms-win-crt-private-l1-1-0.dll", "api-ms-win-crt-process-l1-1-0.dll", "api-ms-win-crt-runtime-l1-1-0.dll", "api-ms-win-crt-stdio-l1-1-0.dll", "api-ms-win-crt-string-l1-1-0.dll",
		"api-ms-win-crt-time-l1-1-0.dll", "api-ms-win-crt-utility-l1-1-0.dll", "concrt140.dll", "msvcp140.dll", "msvcp140_1.dll", "msvcp140_2.dll", "msvcp140_codecvt_ids.dll", "ucrtbase.dll", "vcruntime140.dll"
	});

	private readonly Dictionary<string, Assembly> _assemblies = new Dictionary<string, Assembly>();

	private readonly string assemblyCacheDir;

	public AssemblyLoader(string assemblyCacheDir)
	{
		this.assemblyCacheDir = assemblyCacheDir;
		AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;
	}

	public void Dispose()
	{
		AppDomain.CurrentDomain.AssemblyResolve -= CurrentDomain_AssemblyResolve;
		GC.SuppressFinalize(this);
	}

	private Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs args)
	{
		if (_assemblies.ContainsKey(args.Name))
		{
			return _assemblies[args.Name];
		}
		string text = string.Empty;
		string name = new AssemblyName(args.Name).Name;
		if (name == GetType().Assembly.GetName().Name + ".resources")
		{
			string cultureName = new AssemblyName(args.Name).CultureName;
			if (!string.IsNullOrEmpty(cultureName))
			{
				text = $"{Assembly.GetExecutingAssembly().GetName().Name}.embeddeddlls.Resources_{cultureName}.dll";
			}
		}
		if (string.IsNullOrEmpty(text))
		{
			text = $"{Assembly.GetExecutingAssembly().GetName().Name}.embeddeddlls.{name}.dll";
		}
		if (name == "logi_nethidppio")
		{
			extractResourceAssemblies(_logiNethidppioDependentAssemblies);
		}
		using Stream stream = GetType().Assembly.GetManifestResourceStream(text);
		if (stream == null)
		{
			return null;
		}
		byte[] array = new byte[stream.Length];
		stream.Read(array, 0, array.Length);
		Assembly assembly = null;
		try
		{
			assembly = Assembly.Load(array);
		}
		catch
		{
			if (!Directory.Exists(assemblyCacheDir))
			{
				Directory.CreateDirectory(assemblyCacheDir);
			}
			string text2 = Path.Combine(assemblyCacheDir, new AssemblyName(args.Name).Name + ".dll");
			bool flag = true;
			using SHA1CryptoServiceProvider sHA1CryptoServiceProvider = new SHA1CryptoServiceProvider();
			string text3 = BitConverter.ToString(sHA1CryptoServiceProvider.ComputeHash(array)).Replace("-", string.Empty);
			if (File.Exists(text2))
			{
				byte[] buffer = File.ReadAllBytes(text2);
				string text4 = BitConverter.ToString(sHA1CryptoServiceProvider.ComputeHash(buffer)).Replace("-", string.Empty);
				if (text3 == text4)
				{
					flag = false;
				}
			}
			if (flag)
			{
				File.WriteAllBytes(text2, array);
			}
			assembly = Assembly.LoadFrom(text2);
		}
		_assemblies[args.Name] = assembly;
		return assembly;
	}

	private void extractResourceAssemblies(IList<string> resources)
	{
		if (!Directory.Exists(assemblyCacheDir))
		{
			Directory.CreateDirectory(assemblyCacheDir);
		}
		foreach (string resource in resources)
		{
			string text = $"{Assembly.GetExecutingAssembly().GetName().Name}.embeddeddlls.{resource}";
			using Stream stream = GetType().Assembly.GetManifestResourceStream(text);
			if (stream == null)
			{
				Console.WriteLine("Failed to find resource assembly with name {0}", text);
				continue;
			}
			byte[] array = new byte[stream.Length];
			stream.Read(array, 0, array.Length);
			string path = Path.Combine(assemblyCacheDir, resource);
			bool flag = true;
			using SHA1CryptoServiceProvider sHA1CryptoServiceProvider = new SHA1CryptoServiceProvider();
			string text2 = BitConverter.ToString(sHA1CryptoServiceProvider.ComputeHash(array)).Replace("-", string.Empty);
			if (File.Exists(path))
			{
				byte[] buffer = File.ReadAllBytes(path);
				string text3 = BitConverter.ToString(sHA1CryptoServiceProvider.ComputeHash(buffer)).Replace("-", string.Empty);
				if (text2 == text3)
				{
					flag = false;
				}
			}
			if (flag)
			{
				File.WriteAllBytes(path, array);
			}
		}
	}
}
