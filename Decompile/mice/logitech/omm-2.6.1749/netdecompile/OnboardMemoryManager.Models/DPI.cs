using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using OnboardMemoryManager.Helpers;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class DPI : INotifyPropertyChanged
{
	private ReadOnlyCollection<DPIRange> supportedDPIRange;

	private ReadOnlyCollection<DPIRange> _supportedDPIRangeY;

	private int dpivalue;

	private int _savedValue;

	private int dpiyvalue;

	private int _savedYValue;

	private int lodvalue;

	private int _savedLODValue;

	private int order;

	private bool selected;

	private bool enabled;

	private bool isDPIShift;

	private bool isDefault;

	private bool isLinked;

	public ReadOnlyCollection<DPIRange> SupportedDPIRange
	{
		get
		{
			return supportedDPIRange;
		}
		set
		{
			if (value != supportedDPIRange)
			{
				supportedDPIRange = value;
				OnPropertyChanged("SupportedDPIRange");
			}
		}
	}

	public ReadOnlyCollection<DPIRange> SupportedDPIRangeY
	{
		get
		{
			return _supportedDPIRangeY;
		}
		set
		{
			if (value != _supportedDPIRangeY)
			{
				_supportedDPIRangeY = value;
				OnPropertyChanged("SupportedDPIRangeY");
			}
		}
	}

	public int Value
	{
		get
		{
			return dpivalue;
		}
		set
		{
			if (value != dpivalue)
			{
				dpivalue = value;
				OnPropertyChanged("Value");
			}
		}
	}

	public int SavedValue
	{
		get
		{
			return _savedValue;
		}
		set
		{
			if (value != _savedValue)
			{
				_savedValue = value;
				OnPropertyChanged("SavedValue");
			}
		}
	}

	public int YValue
	{
		get
		{
			return dpiyvalue;
		}
		set
		{
			if (value != dpiyvalue)
			{
				dpiyvalue = value;
				OnPropertyChanged("YValue");
			}
		}
	}

	public int SavedYValue
	{
		get
		{
			return _savedYValue;
		}
		set
		{
			if (value != _savedYValue)
			{
				_savedYValue = value;
				OnPropertyChanged("SavedYValue");
			}
		}
	}

	public int LODValue
	{
		get
		{
			return lodvalue;
		}
		set
		{
			if (value != lodvalue)
			{
				lodvalue = value;
				OnPropertyChanged("LODValue");
			}
		}
	}

	public int SavedLODValue
	{
		get
		{
			return _savedLODValue;
		}
		set
		{
			if (value != _savedLODValue)
			{
				_savedLODValue = value;
				OnPropertyChanged("SavedLODValue");
			}
		}
	}

	public int Order
	{
		get
		{
			return order;
		}
		set
		{
			if (value != order)
			{
				order = value;
				OnPropertyChanged("Order");
			}
		}
	}

	public bool Selected
	{
		get
		{
			return selected;
		}
		set
		{
			if (value != selected)
			{
				selected = value;
				OnPropertyChanged("Selected");
			}
		}
	}

	public bool Enabled
	{
		get
		{
			return enabled;
		}
		set
		{
			if (value != enabled)
			{
				enabled = value;
				OnPropertyChanged("Enabled");
			}
		}
	}

	public bool IsDPIShift
	{
		get
		{
			return isDPIShift;
		}
		set
		{
			if (value != isDPIShift)
			{
				isDPIShift = value;
				OnPropertyChanged("IsDPIShift");
			}
		}
	}

	public bool IsDefault
	{
		get
		{
			return isDefault;
		}
		set
		{
			if (value != isDefault)
			{
				isDefault = value;
				OnPropertyChanged("IsDefault");
			}
		}
	}

	public bool IsLinked
	{
		get
		{
			return isLinked;
		}
		set
		{
			if (value != isLinked)
			{
				isLinked = value;
				OnPropertyChanged("IsLinked");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	public event Action<DPI, PropertyChangedEventArgs> OnPropertyChange;

	public DPI()
	{
		Value = 800;
		SavedValue = 800;
		YValue = 800;
		SavedYValue = 800;
		LODValue = 2;
		SavedLODValue = 2;
		Order = 0;
		Selected = false;
		Enabled = false;
		IsDPIShift = false;
		IsDefault = false;
		IsLinked = false;
		SupportedDPIRange = null;
		SupportedDPIRangeY = null;
	}

	public void InitializeDPI(int dpi, int dpiy = 0, int lod = 0)
	{
		if (dpi == 0)
		{
			dpi = 800;
		}
		if (dpiy == 0)
		{
			dpiy = dpi;
		}
		if (lod == 0)
		{
			lod = 2;
		}
		Value = dpi;
		SavedValue = dpi;
		YValue = dpiy;
		SavedYValue = dpiy;
		LODValue = lod;
		SavedLODValue = lod;
	}

	public override string ToString()
	{
		return $"Value={Value} YValue={YValue} Linked={IsLinked} LOD={LODValue} Order/Index={Order} Current DPI (Active profile only)={Selected} Enabled={Enabled} GShift={IsDPIShift} Default={IsDefault}.";
	}

	public void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
		if (this.OnPropertyChange != null)
		{
			this.OnPropertyChange(this, new PropertyChangedEventArgs(propertyName));
		}
	}

	public bool IsDPIValid(int dpi, bool useRangeY = false)
	{
		Func<int, ReadOnlyCollection<DPIRange>, bool> func = delegate(int d, ReadOnlyCollection<DPIRange> r)
		{
			if (r == null || d == 0)
			{
				return true;
			}
			foreach (DPIRange item in r)
			{
				if (item.start <= d && item.end >= d && d % item.step == 0)
				{
					return true;
				}
			}
			return false;
		};
		if (!useRangeY || SupportedDPIRangeY == null)
		{
			return func(dpi, SupportedDPIRange);
		}
		return func(dpi, SupportedDPIRangeY);
	}

	public int FindNearestValid(int dpi, bool useRangeY = false)
	{
		Func<int, ReadOnlyCollection<DPIRange>, int> func = delegate(int d, ReadOnlyCollection<DPIRange> r)
		{
			if (r == null)
			{
				return d;
			}
			int result = 0;
			int num = int.MaxValue;
			foreach (DPIRange item in r)
			{
				int val = (int)Math.Round((float)d / (float)item.step) * item.step;
				val = val.Clamp(item.start, item.end);
				int num2 = Math.Abs(val - d);
				if (num2 < num)
				{
					num = num2;
					result = val;
				}
			}
			return result;
		};
		if (!useRangeY || SupportedDPIRangeY == null)
		{
			return func(dpi, SupportedDPIRange);
		}
		return func(dpi, SupportedDPIRangeY);
	}
}
