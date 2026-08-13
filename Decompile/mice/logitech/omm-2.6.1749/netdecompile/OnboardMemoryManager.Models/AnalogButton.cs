using System;
using System.ComponentModel;

namespace OnboardMemoryManager.Models;

public class AnalogButton : INotifyPropertyChanged
{
	private uint _buttonId;

	private int _actuationPoint;

	private bool _isRapidTriggerEnabled;

	private int _rapidTriggerSensitivity;

	private int _hapticLevel;

	private uint _keyTravel;

	public uint ButtonId
	{
		get
		{
			return _buttonId;
		}
		set
		{
			if (_buttonId != value)
			{
				_buttonId = value;
				OnPropertyChanged("ButtonId");
			}
		}
	}

	internal Func<int, int> ClampActuationPoint { get; set; }

	internal Func<int, int> ClampRapidTriggerSensitivity { get; set; }

	internal Func<int, int> ClampHapticLevel { get; set; }

	public int ActuationPoint
	{
		get
		{
			return _actuationPoint;
		}
		set
		{
			int num = ClampActuationPoint?.Invoke(value) ?? value;
			if (_actuationPoint != num)
			{
				_actuationPoint = num;
				OnPropertyChanged("ActuationPoint");
			}
		}
	}

	public bool IsRapidTriggerEnabled
	{
		get
		{
			return _isRapidTriggerEnabled;
		}
		set
		{
			if (_isRapidTriggerEnabled != value)
			{
				_isRapidTriggerEnabled = value;
				OnPropertyChanged("IsRapidTriggerEnabled");
			}
		}
	}

	public int RapidTriggerSensitivity
	{
		get
		{
			return _rapidTriggerSensitivity;
		}
		set
		{
			int num = ClampRapidTriggerSensitivity?.Invoke(value) ?? value;
			if (_rapidTriggerSensitivity != num)
			{
				_rapidTriggerSensitivity = num;
				OnPropertyChanged("RapidTriggerSensitivity");
			}
		}
	}

	public int HapticLevel
	{
		get
		{
			return _hapticLevel;
		}
		set
		{
			int num = ClampHapticLevel?.Invoke(value) ?? value;
			if (_hapticLevel != num)
			{
				_hapticLevel = num;
				OnPropertyChanged("HapticLevel");
			}
		}
	}

	public uint KeyTravel
	{
		get
		{
			return _keyTravel;
		}
		set
		{
			if (_keyTravel != value)
			{
				_keyTravel = value;
				OnPropertyChanged("KeyTravel");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}
}
