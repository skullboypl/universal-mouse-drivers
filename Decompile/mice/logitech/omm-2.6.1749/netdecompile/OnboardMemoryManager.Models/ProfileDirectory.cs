using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using OnboardMemoryManager.Controllers;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class ProfileDirectory : IEnumerable<OnboardProfileDirectoryEntry>, IEnumerable, INotifyPropertyChanged
{
	private OnboardMemoryManager.Controllers.ProfileDirectory _controller;

	private List<OnboardProfileDirectoryEntry> _entries;

	private OnboardProfilesInfo _profilesInfo;

	private bool _isModified;

	public bool IsModified
	{
		get
		{
			return _isModified;
		}
		set
		{
			if (value != _isModified)
			{
				_isModified = value;
				OnPropertyChanged("IsModified");
			}
		}
	}

	public OnboardMemoryManager.Controllers.ProfileDirectory Controller
	{
		get
		{
			return _controller;
		}
		set
		{
			if (value == _controller)
			{
				return;
			}
			_controller = value;
			foreach (OnboardProfileDirectoryEntry entry in _entries)
			{
				entry.Controller = _controller;
			}
			OnPropertyChanged("Controller");
		}
	}

	public OnboardProfileDirectoryEntry this[int index] => _entries[index];

	public event PropertyChangedEventHandler PropertyChanged;

	public ProfileDirectory(OnboardProfilesInfo profilesInfo, List<OnboardProfileDirectoryEntry> nativeEntries)
	{
		_profilesInfo = profilesInfo;
		_entries = new List<OnboardProfileDirectoryEntry>();
		foreach (OnboardProfileDirectoryEntry nativeEntry in nativeEntries)
		{
			OnboardProfileDirectoryEntry entry = nativeEntry.Clone();
			Add(new OnboardProfileDirectoryEntry(entry));
		}
		for (int i = _entries.Count(); i < _profilesInfo.profile_count; i++)
		{
			List<int> list = _entries.Select((OnboardProfileDirectoryEntry d) => d.Sector).ToList();
			int num = 0;
			for (int num2 = 1; num2 <= _profilesInfo.profile_count; num2++)
			{
				if (!list.Contains(num2))
				{
					num = num2;
					break;
				}
			}
			if (num == 0)
			{
				throw new Exception("Unable to find free sector for virtual profile entry");
			}
			Add(new OnboardProfileDirectoryEntry(num, enabled: false, virt: true));
		}
	}

	public IReadOnlyList<OnboardProfileDirectoryEntry> GetDirectory()
	{
		List<OnboardProfileDirectoryEntry> list = new List<OnboardProfileDirectoryEntry>();
		OnboardProfileDirectoryEntry onboardProfileDirectoryEntry = null;
		foreach (OnboardProfileDirectoryEntry entry in _entries)
		{
			if (entry.Enabled || !entry.Virtual)
			{
				onboardProfileDirectoryEntry = entry;
			}
		}
		if (onboardProfileDirectoryEntry != null)
		{
			foreach (OnboardProfileDirectoryEntry entry2 in _entries)
			{
				list.Add(entry2.GetEntry());
				if (entry2 == onboardProfileDirectoryEntry)
				{
					break;
				}
			}
		}
		return list.AsReadOnly();
	}

	public ProfileDirectory Clone()
	{
		return new ProfileDirectory(_profilesInfo, GetDirectory().ToList());
	}

	public override bool Equals(object obj)
	{
		if (!(obj is ProfileDirectory profileDirectory))
		{
			return false;
		}
		if (Count() != profileDirectory.Count())
		{
			return false;
		}
		return this.Except(profileDirectory).Count() == 0;
	}

	public override int GetHashCode()
	{
		return base.GetHashCode();
	}

	public void Validate()
	{
		foreach (OnboardProfileDirectoryEntry entry in _entries)
		{
			ValidateEntry(entry);
		}
		if (new HashSet<int>(_entries.Select((OnboardProfileDirectoryEntry d) => d.Sector)).Count() != _entries.Count())
		{
			throw new Exception("Sector exists multiple times in directory");
		}
		if (_entries.Count() == 0 || _entries.Count() > _profilesInfo.profile_count)
		{
			throw new Exception("Profiles count out of range");
		}
		if (_entries.Select((OnboardProfileDirectoryEntry d) => d.Enabled).Count() == 0)
		{
			throw new Exception("At least one profile must be enabled");
		}
	}

	public void ValidateEntry(OnboardProfileDirectoryEntry entry)
	{
		if (entry.Sector == 0)
		{
			throw new Exception("Sector address cannot point to directory");
		}
		if (entry.Sector < 0 || entry.Sector >= _profilesInfo.sector_count)
		{
			throw new Exception("Sector address out of range");
		}
	}

	public IEnumerator<OnboardProfileDirectoryEntry> GetEnumerator()
	{
		return ((IEnumerable<OnboardProfileDirectoryEntry>)_entries).GetEnumerator();
	}

	IEnumerator IEnumerable.GetEnumerator()
	{
		return ((IEnumerable<OnboardProfileDirectoryEntry>)_entries).GetEnumerator();
	}

	public int Count()
	{
		return _entries.Count();
	}

	public void Add(OnboardProfileDirectoryEntry item)
	{
		if (_entries.Count() >= _profilesInfo.profile_count)
		{
			throw new Exception("Profile count exceeds max allowable");
		}
		item.PropertyChanged += onWrappedEntryModified;
		item.Controller = _controller;
		item.Index = _entries.Count() + 1;
		_entries.Add(item);
	}

	private void onWrappedEntryModified(object sender, PropertyChangedEventArgs e)
	{
		_isModified = true;
		OnPropertyChanged(e.PropertyName);
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}
}
