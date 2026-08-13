using System.ComponentModel;
using OnboardMemoryManager.Controllers;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class OnboardProfileDirectoryEntry : INotifyPropertyChanged
{
	protected OnboardProfileDirectoryEntry _entry;

	protected bool _virtual;

	protected int _index;

	protected OnboardMemoryManager.Controllers.ProfileDirectory _controller;

	public bool Enabled
	{
		get
		{
			return _entry.enabled;
		}
		set
		{
			if (value != _entry.enabled)
			{
				_entry.enabled = value;
				OnPropertyChanged("Enabled");
			}
		}
	}

	public int Sector
	{
		get
		{
			return _entry.sector;
		}
		set
		{
			if (value != _entry.sector)
			{
				_entry.sector = value;
				OnPropertyChanged("Sector");
			}
		}
	}

	public int Index
	{
		get
		{
			return _index;
		}
		set
		{
			if (value != _index)
			{
				_index = value;
				OnPropertyChanged("Index");
			}
		}
	}

	public bool Virtual
	{
		get
		{
			return _virtual;
		}
		set
		{
			if (value != _virtual)
			{
				_virtual = value;
				OnPropertyChanged("Virtual");
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
			if (value != _controller)
			{
				_controller = value;
				OnPropertyChanged("Controller");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	public OnboardProfileDirectoryEntry(OnboardProfileDirectoryEntry entry)
	{
		_entry = entry;
	}

	public OnboardProfileDirectoryEntry(int sector, bool enabled, bool virt)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		//IL_0011: Expected O, but got Unknown
		_entry = new OnboardProfileDirectoryEntry();
		_entry.sector = sector;
		_entry.enabled = enabled;
		_virtual = virt;
	}

	public OnboardProfileDirectoryEntry Clone()
	{
		return new OnboardProfileDirectoryEntry(_entry.Clone())
		{
			Index = Index,
			Virtual = Virtual
		};
	}

	public override bool Equals(object obj)
	{
		if (!(obj is OnboardProfileDirectoryEntry onboardProfileDirectoryEntry))
		{
			return false;
		}
		if (_entry == onboardProfileDirectoryEntry._entry && _virtual == onboardProfileDirectoryEntry._virtual)
		{
			return _index == onboardProfileDirectoryEntry._index;
		}
		return false;
	}

	public override int GetHashCode()
	{
		return base.GetHashCode();
	}

	public OnboardProfileDirectoryEntry GetEntry()
	{
		return _entry.Clone();
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}
}
