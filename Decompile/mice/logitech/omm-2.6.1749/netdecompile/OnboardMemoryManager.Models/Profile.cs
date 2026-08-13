using System;
using System.ComponentModel;

namespace OnboardMemoryManager.Models;

public class Profile : INotifyPropertyChanged, IDisposable
{
	private Device _device;

	private int _profile_id;

	private string _title = "";

	private bool _enabled;

	private bool _active;

	private bool _advanced;

	private int _lightingEffectID;

	public Device Device
	{
		get
		{
			return _device;
		}
		set
		{
			_device = value;
		}
	}

	public int ProfileID
	{
		get
		{
			return _profile_id;
		}
		set
		{
			if (value != _profile_id)
			{
				_profile_id = value;
				OnPropertyChanged("ProfileID");
				OnPropertyChanged("Title");
			}
		}
	}

	public string Title
	{
		get
		{
			return _title;
		}
		set
		{
			if (value != _title)
			{
				_title = value;
				OnPropertyChanged("Title");
			}
		}
	}

	public bool Enabled
	{
		get
		{
			return _enabled;
		}
		set
		{
			if (value != _enabled)
			{
				_enabled = value;
				OnPropertyChanged("Enabled");
			}
		}
	}

	public bool Active
	{
		get
		{
			return _active;
		}
		set
		{
			if (value != _active)
			{
				_active = value;
				OnPropertyChanged("Active");
			}
		}
	}

	public bool Advanced
	{
		get
		{
			return _advanced;
		}
		set
		{
			if (value != _advanced)
			{
				_advanced = value;
				OnPropertyChanged("Advanced");
			}
		}
	}

	public int LightingEffectID
	{
		get
		{
			return _lightingEffectID;
		}
		set
		{
			if (value != _lightingEffectID)
			{
				_lightingEffectID = value;
				OnPropertyChanged("LightingEffectID");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public void Dispose()
	{
		GC.SuppressFinalize(this);
		Dispose(disposing: true);
	}

	~Profile()
	{
		Dispose(disposing: false);
	}

	protected virtual void Dispose(bool disposing)
	{
	}
}
