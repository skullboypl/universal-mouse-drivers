using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using OnboardMemoryManager.Models;
using logi.hidppio;
using logi.hidppio.errors;

namespace OnboardMemoryManager.Controllers;

public class ProfileDirectory
{
	private OnboardMemoryManager.Models.ProfileDirectory _entries;

	private OnboardMemoryManager.Models.ProfileDirectory _mutableEntries;

	private OnboardProfilesInfo _profilesInfo;

	private HIDMouse _device;

	public OnboardMemoryManager.Models.ProfileDirectory Entries => _mutableEntries;

	public ProfileDirectory(HIDMouse hidMouse)
	{
		ProfileDirectory profileDirectory = this;
		_device = hidMouse;
		Feature8100 f8100 = ((DeviceBase)_device.HidppDeviceHandle).GetFeature<Feature8100>();
		Task.Run(async delegate
		{
			OnboardProfilesInfo profilesInfo = await f8100.GetOnboardProfilesInfo();
			profileDirectory._profilesInfo = profilesInfo;
			List<OnboardProfileDirectoryEntry> nativeEntries;
			try
			{
				nativeEntries = (await f8100.ReadProfileDirectory()).values.ToList();
			}
			catch (Exception ex)
			{
				if (!ex.Message.Contains("CRC Checksum Failed"))
				{
					throw ex;
				}
				nativeEntries = new List<OnboardProfileDirectoryEntry>();
			}
			profileDirectory._entries = new OnboardMemoryManager.Models.ProfileDirectory(profileDirectory._profilesInfo, nativeEntries);
			profileDirectory._mutableEntries = profileDirectory._entries.Clone();
			if (profileDirectory._mutableEntries.Count() > 0 && profileDirectory._mutableEntries.Where((OnboardProfileDirectoryEntry d) => d.Enabled).Count() == 0)
			{
				profileDirectory._mutableEntries[0].Enabled = true;
			}
			profileDirectory._mutableEntries.Controller = profileDirectory;
		}, _device.CancellationTokenSrc.Token).Wait(_device.CancellationTokenSrc.Token);
	}

	public async Task Write()
	{
		if (!_mutableEntries.IsModified)
		{
			return;
		}
		if (_mutableEntries.Count() > 0 && _mutableEntries.Where((OnboardProfileDirectoryEntry d) => d.Enabled).Count() == 0)
		{
			_mutableEntries[0].Enabled = true;
		}
		_mutableEntries.Validate();
		IReadOnlyList<OnboardProfileDirectoryEntry> directory = _mutableEntries.GetDirectory();
		try
		{
			await ((DeviceBase)_device.HidppDeviceHandle).GetFeature<Feature8100>().WriteProfileDirectory(directory.ToList());
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in profile directory write, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			Application.Current.Dispatcher.Invoke(delegate
			{
				MessageBox.Show($"Device raised an exception during profile directory write: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		foreach (OnboardProfileDirectoryEntry item in directory)
		{
			foreach (OnboardProfileDirectoryEntry mutableEntry in _mutableEntries)
			{
				if (item == mutableEntry.GetEntry() && mutableEntry.Virtual)
				{
					mutableEntry.Virtual = false;
					break;
				}
			}
		}
		_mutableEntries.IsModified = false;
		_entries = _mutableEntries.Clone();
	}
}
