using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Messages;
using OnboardMemoryManager.Properties;
using logi.hidppio;
using logi.hidppio.errors;
using logi.hidppio.onboard_profiles;

namespace OnboardMemoryManager.Models;

public class HIDProfile : Profile
{
	public class OnModifiedStateChangedEventArgs : EventArgs
	{
		public bool IsModified { get; set; }
	}

	private readonly CancellationTokenSource _cancellation_token_source = new CancellationTokenSource();

	private readonly HidppDevice _hidppDevice;

	private OnboardProfile _profile_data;

	private OnboardProfile _original_profile_data;

	private OnboardProfileDirectoryEntry _profile_directory_entry;

	private DPIRanges _supported_dpi_range;

	private DPIRanges _supported_dpi_range_y;

	private SensorCapabilities _sensor_capabilities;

	private ReportRates _supported_wired_report_rates;

	private ReportRates _supported_wireless_report_rates;

	private ReportRates _actual_report_rates;

	private AnalogButtons _analog_buttons;

	private Feature2201 _f2201;

	private Feature2202 _f2202;

	private Feature8061 _f8061;

	private Feature80E0 _f80E0;

	private Feature1B0C _f1B0C;

	private Feature8100 _f8100;

	private bool _dirty;

	private ICommand _importHITSCodeCommand;

	private ICommand _shareHITSCodeCommand;

	public const uint s_bunny_hopping_timeout_default = 100u;

	private uint _bunny_hopping_timeout_cache = 100u;

	private static List<int> _supported_lighting_effects_for_color = new List<int> { 1, 10 };

	private static System.Drawing.Color _defaultColor = System.Drawing.Color.FromArgb(0, 169, 224);

	private const int GHUB_default = 5000;

	public DPI _savedDefaultDPI;

	public int _oobDefaultLOD;

	public ICommand ImportHITSCodeCommand => _importHITSCodeCommand;

	public ICommand ShareHITSCodeCommand => _shareHITSCodeCommand;

	public bool IsAdvancedDPIActive
	{
		get
		{
			if (!SupportsAdvancedDPI)
			{
				return false;
			}
			foreach (DPI dPI in DPIs)
			{
				if (dPI.Enabled && (!dPI.IsLinked || dPI.YValue != dPI.Value || dPI.LODValue != OOBDefaultLOD))
				{
					return true;
				}
			}
			return false;
		}
	}

	public bool SupportsAdvancedDPI
	{
		get
		{
			if (SupportsAdvancedDPIFeature && _sensor_capabilities != null)
			{
				if (!_sensor_capabilities.supports_dpi_y)
				{
					return _sensor_capabilities.supports_lod;
				}
				return true;
			}
			return false;
		}
	}

	public bool SupportsDPIY
	{
		get
		{
			if (SupportsAdvancedDPIFeature && _sensor_capabilities != null)
			{
				return _sensor_capabilities.supports_dpi_y;
			}
			return false;
		}
	}

	public bool SupportsLOD
	{
		get
		{
			if (SupportsAdvancedDPIFeature && _sensor_capabilities != null)
			{
				return _sensor_capabilities.supports_lod;
			}
			return false;
		}
	}

	public SensorCapabilities SensorCapabilities => _sensor_capabilities;

	public bool HasExtendedWiredReportRate
	{
		get
		{
			if (SupportsExtendedReportRate && _supported_wired_report_rates != null)
			{
				return _supported_wired_report_rates.isValid();
			}
			return false;
		}
	}

	public bool HasExtendedWirelessReportRate
	{
		get
		{
			if (SupportsExtendedReportRate && _supported_wireless_report_rates != null)
			{
				return _supported_wireless_report_rates.isValid();
			}
			return false;
		}
	}

	public bool HasUnsupportedWirelessReportRate { get; protected set; }

	public bool SupportsAdvancedDPIFeature => _f2202 != null;

	public bool SupportsExtendedReportRate => _f8061 != null;

	public bool SupportsAnyReportRate
	{
		get
		{
			if (base.Device is HIDDevice hIDDevice)
			{
				return hIDDevice.ActiveConnectionType != HIDDevice.ConnectionType.BLUETOOTH;
			}
			return false;
		}
	}

	public bool SupportsBunnyHopping => _f80E0 != null;

	public bool SupportsAnalogButtons => _f1B0C != null;

	public new string Title
	{
		get
		{
			return GetProfileDisplayName();
		}
		set
		{
			if (value != _profile_data.GetProfileName())
			{
				_profile_data.SetProfileName(value);
				base.Title = value;
				Dirty = true;
				OnPropertyChanged("Title");
			}
		}
	}

	public OnboardProfileDirectoryEntry OnboardProfileDirectoryEntry
	{
		get
		{
			return _profile_directory_entry;
		}
		set
		{
			if (value != _profile_directory_entry)
			{
				_profile_directory_entry = value;
				OnPropertyChanged("OnboardProfileDirectoryEntry");
			}
		}
	}

	public bool Dirty
	{
		get
		{
			return _dirty;
		}
		set
		{
			if (value != _dirty)
			{
				_dirty = value;
				OnPropertyChanged("Dirty");
				Application.Current.Dispatcher.Invoke(delegate
				{
					EventHandler<OnModifiedStateChangedEventArgs> eventHandler = this.OnModifiedStateChanged;
					OnModifiedStateChangedEventArgs e = new OnModifiedStateChangedEventArgs
					{
						IsModified = value
					};
					eventHandler?.Invoke(this, e);
				}, DispatcherPriority.Render, _cancellation_token_source.Token);
			}
		}
	}

	public new bool Enabled
	{
		get
		{
			return base.Enabled;
		}
		set
		{
			if (value != base.Enabled)
			{
				base.Enabled = value;
				_profile_directory_entry.Enabled = value;
				base.Enabled = value;
				OnPropertyChanged("Enabled");
			}
		}
	}

	public int Sector => _profile_directory_entry.Sector;

	public ReportRate ReportRate
	{
		get
		{
			//IL_0010: Unknown result type (might be due to invalid IL or missing references)
			if (!SupportsAnyReportRate)
			{
				return (ReportRate)8;
			}
			return _profile_data.GetReportRate();
		}
		set
		{
			//IL_0008: Unknown result type (might be due to invalid IL or missing references)
			//IL_000f: Unknown result type (might be due to invalid IL or missing references)
			//IL_001c: Unknown result type (might be due to invalid IL or missing references)
			if (SupportsAnyReportRate && value != _profile_data.GetReportRate())
			{
				_profile_data.SetReportRate(value);
				Dirty = true;
				OnPropertyChanged("ReportRate");
			}
		}
	}

	public ReportRateExtended ReportRateWired
	{
		get
		{
			//IL_0006: Unknown result type (might be due to invalid IL or missing references)
			return _profile_data.GetReportRateWired();
		}
		set
		{
			//IL_0000: Unknown result type (might be due to invalid IL or missing references)
			//IL_0007: Unknown result type (might be due to invalid IL or missing references)
			//IL_0014: Unknown result type (might be due to invalid IL or missing references)
			if (value != _profile_data.GetReportRateWired())
			{
				_profile_data.SetReportRateWired(value);
				Dirty = true;
				OnPropertyChanged("ReportRateWired");
			}
		}
	}

	public ReportRateExtended ReportRateWireless
	{
		get
		{
			//IL_0006: Unknown result type (might be due to invalid IL or missing references)
			return _profile_data.GetReportRateWireless();
		}
		set
		{
			//IL_0000: Unknown result type (might be due to invalid IL or missing references)
			//IL_0007: Unknown result type (might be due to invalid IL or missing references)
			//IL_0014: Unknown result type (might be due to invalid IL or missing references)
			if (value != _profile_data.GetReportRateWireless())
			{
				_profile_data.SetReportRateWireless(value);
				Dirty = true;
				OnPropertyChanged("ReportRateWireless");
			}
		}
	}

	public static uint BunnyHoppingTimeoutMax => 1000u;

	public static uint BunnyHoppingTimeoutMin => 100u;

	public uint BunnyHoppingTimeout
	{
		get
		{
			uint num = BunnyHoppingHelper.ConvertTimeoutToMs(_profile_data.GetBunnyHoppingTimeout());
			if (num <= BunnyHoppingTimeoutMax && num >= BunnyHoppingTimeoutMin)
			{
				return num;
			}
			return 100u;
		}
		set
		{
			_profile_data.SetBunnyHoppingTimeout(BunnyHoppingHelper.ConvertTimeoutToByte(value));
			Dirty = true;
			OnPropertyChanged("BunnyHoppingTimeout");
		}
	}

	public bool BunnyHoppingEnabled
	{
		get
		{
			return BunnyHoppingHelper.IsBunnyHoppingEnabled(_profile_data.GetBunnyHoppingTimeout());
		}
		set
		{
			bool flag = BunnyHoppingHelper.IsBunnyHoppingEnabled(_profile_data.GetBunnyHoppingTimeout());
			bool flag2 = value;
			if (flag2 != flag)
			{
				if (!flag2)
				{
					_bunny_hopping_timeout_cache = BunnyHoppingTimeout;
					_profile_data.SetBunnyHoppingTimeout((byte)0);
				}
				else if (flag2 && BunnyHoppingHelper.ConvertTimeoutToMs(_profile_data.GetBunnyHoppingTimeout()) != _bunny_hopping_timeout_cache)
				{
					BunnyHoppingTimeout = _bunny_hopping_timeout_cache;
					OnPropertyChanged("BunnyHoppingTimeout");
				}
				Dirty = true;
				OnPropertyChanged("BunnyHoppingEnabled");
			}
		}
	}

	public AnalogButtons AnalogButtons => _analog_buttons;

	public System.Windows.Media.Color SelectedColor
	{
		get
		{
			//IL_0023: Unknown result type (might be due to invalid IL or missing references)
			//IL_002d: Invalid comparison between Unknown and I4
			//IL_0061: Unknown result type (might be due to invalid IL or missing references)
			//IL_006b: Invalid comparison between Unknown and I4
			//IL_009c: Unknown result type (might be due to invalid IL or missing references)
			//IL_00a6: Invalid comparison between Unknown and I4
			//IL_00d7: Unknown result type (might be due to invalid IL or missing references)
			//IL_00e1: Invalid comparison between Unknown and I4
			System.Drawing.Color color = System.Drawing.Color.FromArgb(0, 0, 0);
			if (_profile_data.HasComponent((ComponentId)8) && (int)_profile_data.GetLogoLighting().effect_id != 255)
			{
				color = GetColorFrom8070(_profile_data.GetLogoLighting());
			}
			else if (_profile_data.HasComponent((ComponentId)9) && (int)_profile_data.GetSideLighting().effect_id != 255)
			{
				color = GetColorFrom8070(_profile_data.GetSideLighting());
			}
			else if (_profile_data.HasComponent((ComponentId)15) && (int)_profile_data.GetCluster0Active().effect_id != 255)
			{
				color = GetColorFrom8071(_profile_data.GetCluster0Active());
			}
			else if (_profile_data.HasComponent((ComponentId)17) && (int)_profile_data.GetCluster1Active().effect_id != 255)
			{
				color = GetColorFrom8071(_profile_data.GetCluster1Active());
			}
			return System.Windows.Media.Color.FromRgb(color.R, color.G, color.B);
		}
		set
		{
			//IL_0054: Unknown result type (might be due to invalid IL or missing references)
			//IL_0055: Unknown result type (might be due to invalid IL or missing references)
			//IL_0057: Invalid comparison between Unknown and I4
			//IL_0059: Unknown result type (might be due to invalid IL or missing references)
			//IL_005c: Invalid comparison between Unknown and I4
			//IL_0080: Unknown result type (might be due to invalid IL or missing references)
			//IL_0086: Expected O, but got Unknown
			//IL_00d3: Unknown result type (might be due to invalid IL or missing references)
			//IL_00da: Expected O, but got Unknown
			//IL_033b: Unknown result type (might be due to invalid IL or missing references)
			//IL_0342: Expected O, but got Unknown
			//IL_012a: Unknown result type (might be due to invalid IL or missing references)
			//IL_0131: Expected O, but got Unknown
			//IL_0392: Unknown result type (might be due to invalid IL or missing references)
			//IL_0399: Expected O, but got Unknown
			//IL_0181: Unknown result type (might be due to invalid IL or missing references)
			//IL_0188: Expected O, but got Unknown
			//IL_03e9: Unknown result type (might be due to invalid IL or missing references)
			//IL_03f0: Expected O, but got Unknown
			//IL_01d8: Unknown result type (might be due to invalid IL or missing references)
			//IL_01df: Expected O, but got Unknown
			//IL_0440: Unknown result type (might be due to invalid IL or missing references)
			//IL_0447: Expected O, but got Unknown
			//IL_022f: Unknown result type (might be due to invalid IL or missing references)
			//IL_0236: Expected O, but got Unknown
			//IL_0497: Unknown result type (might be due to invalid IL or missing references)
			//IL_049e: Expected O, but got Unknown
			//IL_0286: Unknown result type (might be due to invalid IL or missing references)
			//IL_028d: Expected O, but got Unknown
			//IL_04ee: Unknown result type (might be due to invalid IL or missing references)
			//IL_04f5: Expected O, but got Unknown
			//IL_02e0: Unknown result type (might be due to invalid IL or missing references)
			//IL_02e7: Expected O, but got Unknown
			//IL_0545: Unknown result type (might be due to invalid IL or missing references)
			//IL_054c: Expected O, but got Unknown
			//IL_059c: Unknown result type (might be due to invalid IL or missing references)
			//IL_05a3: Expected O, but got Unknown
			if (!(value != SelectedColor))
			{
				return;
			}
			System.Drawing.Color color = System.Drawing.Color.FromArgb(value.R, value.G, value.B);
			System.Drawing.Color color2 = System.Drawing.Color.FromArgb(value.R / 2, value.G / 2, value.B / 2);
			EFFECT_ID val = (EFFECT_ID)(byte)LightingEffectID;
			if ((int)val != 1)
			{
				if ((int)val == 10)
				{
					if (_profile_data.HasComponent((ComponentId)8))
					{
						EffectDataPulsingBreathingWaveform val2 = new EffectDataPulsingBreathingWaveform(_profile_data.GetLogoLighting());
						if ((System.Drawing.Color)(object)val2.color != color)
						{
							val2.color = color;
							Dirty = true;
						}
						_profile_data.SetLogoLighting((EffectData)(object)val2);
					}
					if (_profile_data.HasComponent((ComponentId)9))
					{
						EffectDataPulsingBreathingWaveform val3 = new EffectDataPulsingBreathingWaveform(_profile_data.GetSideLighting());
						if ((System.Drawing.Color)(object)val3.color != color)
						{
							val3.color = color;
							Dirty = true;
						}
						_profile_data.SetSideLighting((EffectData)(object)val3);
					}
					if (_profile_data.HasComponent((ComponentId)13))
					{
						EffectDataPulsingBreathingWaveform val4 = new EffectDataPulsingBreathingWaveform(_profile_data.GetLogoPowerSaveLighting());
						if ((System.Drawing.Color)(object)val4.color != color2)
						{
							val4.color = color2;
							Dirty = true;
						}
						_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val4);
					}
					if (_profile_data.HasComponent((ComponentId)14))
					{
						EffectDataPulsingBreathingWaveform val5 = new EffectDataPulsingBreathingWaveform(_profile_data.GetSidePowerSaveLighting());
						if ((System.Drawing.Color)(object)val5.color != color2)
						{
							val5.color = color2;
							Dirty = true;
						}
						_profile_data.SetSidePowerSaveLighting((EffectData)(object)val5);
					}
					if (_profile_data.HasComponent((ComponentId)15))
					{
						EffectDataPulsingBreathingWaveform val6 = new EffectDataPulsingBreathingWaveform(_profile_data.GetCluster0Active());
						if ((System.Drawing.Color)(object)val6.color != color)
						{
							val6.color = color;
							Dirty = true;
						}
						_profile_data.SetCluster0Active((EffectData)(object)val6);
					}
					if (_profile_data.HasComponent((ComponentId)17))
					{
						EffectDataPulsingBreathingWaveform val7 = new EffectDataPulsingBreathingWaveform(_profile_data.GetCluster1Active());
						if ((System.Drawing.Color)(object)val7.color != color)
						{
							val7.color = color;
							Dirty = true;
						}
						_profile_data.SetCluster1Active((EffectData)(object)val7);
					}
					if (_profile_data.HasComponent((ComponentId)16))
					{
						EffectDataPulsingBreathingWaveform val8 = new EffectDataPulsingBreathingWaveform(_profile_data.GetCluster0Passive());
						if ((System.Drawing.Color)(object)val8.color != color2)
						{
							val8.color = color2;
							Dirty = true;
						}
						_profile_data.SetCluster0Passive((EffectData)(object)val8);
					}
					if (_profile_data.HasComponent((ComponentId)18))
					{
						EffectDataPulsingBreathingWaveform val9 = new EffectDataPulsingBreathingWaveform(_profile_data.GetCluster1Passive());
						if ((System.Drawing.Color)(object)val9.color != color2)
						{
							val9.color = color2;
							Dirty = true;
						}
						_profile_data.SetCluster1Passive((EffectData)(object)val9);
					}
				}
			}
			else
			{
				if (_profile_data.HasComponent((ComponentId)8))
				{
					EffectDataFixed val10 = new EffectDataFixed(_profile_data.GetLogoLighting());
					if ((System.Drawing.Color)(object)val10.color != color)
					{
						val10.color = color;
						Dirty = true;
					}
					_profile_data.SetLogoLighting((EffectData)(object)val10);
				}
				if (_profile_data.HasComponent((ComponentId)9))
				{
					EffectDataFixed val11 = new EffectDataFixed(_profile_data.GetSideLighting());
					if ((System.Drawing.Color)(object)val11.color != color)
					{
						val11.color = color;
						Dirty = true;
					}
					_profile_data.SetSideLighting((EffectData)(object)val11);
				}
				if (_profile_data.HasComponent((ComponentId)13))
				{
					EffectDataFixed val12 = new EffectDataFixed(_profile_data.GetLogoPowerSaveLighting());
					if ((System.Drawing.Color)(object)val12.color != color2)
					{
						val12.color = color2;
						Dirty = true;
					}
					_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val12);
				}
				if (_profile_data.HasComponent((ComponentId)14))
				{
					EffectDataFixed val13 = new EffectDataFixed(_profile_data.GetSidePowerSaveLighting());
					if ((System.Drawing.Color)(object)val13.color != color2)
					{
						val13.color = color2;
						Dirty = true;
					}
					_profile_data.SetSidePowerSaveLighting((EffectData)(object)val13);
				}
				if (_profile_data.HasComponent((ComponentId)15))
				{
					EffectDataFixed val14 = new EffectDataFixed(_profile_data.GetCluster0Active());
					if ((System.Drawing.Color)(object)val14.color != color)
					{
						val14.color = color;
						Dirty = true;
					}
					_profile_data.SetCluster0Active((EffectData)(object)val14);
				}
				if (_profile_data.HasComponent((ComponentId)17))
				{
					EffectDataFixed val15 = new EffectDataFixed(_profile_data.GetCluster1Active());
					if ((System.Drawing.Color)(object)val15.color != color)
					{
						val15.color = color;
						Dirty = true;
					}
					_profile_data.SetCluster1Active((EffectData)(object)val15);
				}
				if (_profile_data.HasComponent((ComponentId)16))
				{
					EffectDataFixed val16 = new EffectDataFixed(_profile_data.GetCluster0Passive());
					if ((System.Drawing.Color)(object)val16.color != color2)
					{
						val16.color = color2;
						Dirty = true;
					}
					_profile_data.SetCluster0Passive((EffectData)(object)val16);
				}
				if (_profile_data.HasComponent((ComponentId)18))
				{
					EffectDataFixed val17 = new EffectDataFixed(_profile_data.GetCluster1Passive());
					if ((System.Drawing.Color)(object)val17.color != color2)
					{
						val17.color = color2;
						Dirty = true;
					}
					_profile_data.SetCluster1Passive((EffectData)(object)val17);
				}
			}
			Dirty = true;
			OnPropertyChanged("SelectedColor");
		}
	}

	public bool IsColorVisible => _supported_lighting_effects_for_color.Contains(LightingEffectID);

	public new int LightingEffectID
	{
		get
		{
			//IL_001a: Unknown result type (might be due to invalid IL or missing references)
			//IL_0024: Invalid comparison between Unknown and I4
			//IL_0052: Unknown result type (might be due to invalid IL or missing references)
			//IL_005c: Invalid comparison between Unknown and I4
			//IL_0031: Unknown result type (might be due to invalid IL or missing references)
			//IL_0037: Expected I4, but got Unknown
			//IL_008a: Unknown result type (might be due to invalid IL or missing references)
			//IL_0094: Invalid comparison between Unknown and I4
			//IL_0069: Unknown result type (might be due to invalid IL or missing references)
			//IL_006f: Expected I4, but got Unknown
			//IL_00c2: Unknown result type (might be due to invalid IL or missing references)
			//IL_00cc: Invalid comparison between Unknown and I4
			//IL_00a1: Unknown result type (might be due to invalid IL or missing references)
			//IL_00a7: Expected I4, but got Unknown
			//IL_00d9: Unknown result type (might be due to invalid IL or missing references)
			//IL_00df: Expected I4, but got Unknown
			if (_profile_data.HasComponent((ComponentId)8) && (int)_profile_data.GetLogoLighting().effect_id != 255)
			{
				return (int)_profile_data.GetLogoLighting().effect_id;
			}
			if (_profile_data.HasComponent((ComponentId)9) && (int)_profile_data.GetSideLighting().effect_id != 255)
			{
				return (int)_profile_data.GetSideLighting().effect_id;
			}
			if (_profile_data.HasComponent((ComponentId)15) && (int)_profile_data.GetCluster0Active().effect_id != 255)
			{
				return (int)_profile_data.GetCluster0Active().effect_id;
			}
			if (_profile_data.HasComponent((ComponentId)17) && (int)_profile_data.GetCluster1Active().effect_id != 255)
			{
				return (int)_profile_data.GetCluster1Active().effect_id;
			}
			return 0;
		}
		set
		{
			if (value != base.LightingEffectID)
			{
				base.LightingEffectID = value;
				System.Windows.Media.Color selectedColor = SelectedColor;
				System.Drawing.Color color = System.Drawing.Color.FromArgb(selectedColor.R, selectedColor.G, selectedColor.B);
				if (color == System.Drawing.Color.FromArgb(0, 0, 0))
				{
					color = _defaultColor;
				}
				SetLightingFlag(value);
				switch (value)
				{
				case 0:
					SetGenericEffectDisabled();
					break;
				case 1:
					SetGenericEffectFixed(color);
					break;
				case 3:
					SetGenericEffectCycling();
					break;
				case 10:
					SetGenericEffectBreathing(color);
					break;
				case 4:
					SetGenericEffectColorWave();
					Console.Out.WriteLine(((object)_profile_data).ToString());
					break;
				case 15:
					SetGenericEffectSnipePulse();
					break;
				case 16:
					SetGenericEffectNeuralWave();
					break;
				case 21:
					SetGenericEffectColorCyclingConfig();
					break;
				case 22:
					SetGenericEffectColorWaveConfig();
					break;
				case 24:
					SetGenericEffectSmoothStarBreathing();
					break;
				default:
					Console.WriteLine("Unsupported lighting effect {0}", value);
					break;
				}
				OnPropertyChanged("LightingEffectID");
				OnPropertyChanged("SelectedColor");
				OnPropertyChanged("IsColorVisible");
				Dirty = true;
			}
		}
	}

	public ObservableCollection<DPI> DPIs { get; set; } = new ObservableCollection<DPI>();

	public DPI SavedDefaultDPI
	{
		get
		{
			return _savedDefaultDPI;
		}
		private set
		{
			_savedDefaultDPI = value;
		}
	}

	public int OOBDefaultLOD
	{
		get
		{
			return _oobDefaultLOD;
		}
		private set
		{
			_oobDefaultLOD = value;
		}
	}

	public ObservableCollection<HIDReportRateItem> ReportRateItems { get; set; } = new ObservableCollection<HIDReportRateItem>();

	public ObservableCollection<HIDReportRateExtItem> ReportRateWiredItems { get; set; } = new ObservableCollection<HIDReportRateExtItem>();

	public ObservableCollection<HIDReportRateExtItem> ReportRateWirelessItems { get; set; } = new ObservableCollection<HIDReportRateExtItem>();

	public ObservableCollection<OnboardMemoryManager.Controllers.Assignment> Assignments { get; set; } = new ObservableCollection<OnboardMemoryManager.Controllers.Assignment>();

	public ObservableCollection<OnboardMemoryManager.Controllers.Assignment> GShiftAssignments { get; set; } = new ObservableCollection<OnboardMemoryManager.Controllers.Assignment>();

	public event EventHandler<OnModifiedStateChangedEventArgs> OnModifiedStateChanged;

	public event EventHandler<OnboardMemoryManager.Controllers.Assignment.AssignmentActionListChangedEventArgs> AssignmentActionListChanged;

	public HIDProfile(HIDDevice device, OnboardProfileDirectoryEntry profile_directory_entry, OnboardProfile profile_data)
	{
		base.Device = device;
		_profile_directory_entry = profile_directory_entry;
		_profile_data = profile_data;
		if (!(base.Device is HIDDevice hIDDevice))
		{
			throw new NullReferenceException("Device must be of type HIDDevice to initialize a HIDProfile");
		}
		_hidppDevice = hIDDevice.HidppDeviceHandle;
		if (_hidppDevice == null)
		{
			throw new NullReferenceException("HidppDevice cannot be null");
		}
		_importHITSCodeCommand = new RelayCommand(ExecuteImportHITSCode);
		_shareHITSCodeCommand = new RelayCommand(ExecuteShareHITSCode);
	}

	public async Task InitAsync()
	{
		if (await ((DeviceBase)_hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2201_003E.FeatureId))
		{
			_f2201 = ((DeviceBase)_hidppDevice).GetFeature<Feature2201>();
		}
		else if (await ((DeviceBase)_hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_2202_003E.FeatureId))
		{
			_f2202 = ((DeviceBase)_hidppDevice).GetFeature<Feature2202>();
		}
		if (await ((DeviceBase)_hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_8061_003E.FeatureId))
		{
			_f8061 = ((DeviceBase)_hidppDevice).GetFeature<Feature8061>();
		}
		if (await ((DeviceBase)_hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_80e0_003E.FeatureId))
		{
			_f80E0 = ((DeviceBase)_hidppDevice).GetFeature<Feature80E0>();
		}
		if (await ((DeviceBase)_hidppDevice).HasFeature(FeatureBase_003Clogi_003A_003Ahidppio_003A_003Afeature_1b0c_003E.FeatureId))
		{
			_f1B0C = ((DeviceBase)_hidppDevice).GetFeature<Feature1B0C>();
		}
		_f8100 = ((DeviceBase)_hidppDevice).GetFeature<Feature8100>();
		_f8100.OnActiveResolutionChangeBroadcast += OnActiveDPIChange;
		if (_f2201 != null)
		{
			_supported_dpi_range = await _f2201.GetSensorDPIList((ValueType)0);
		}
		else if (SupportsAdvancedDPIFeature)
		{
			_supported_dpi_range = await _f2202.GetSensorDPIList((ValueType)0, (ValueType)0);
			_sensor_capabilities = await _f2202.GetSensorCapabilities((ValueType)0);
			if (_sensor_capabilities.supports_dpi_y)
			{
				_supported_dpi_range_y = await _f2202.GetSensorDPIList((ValueType)0, (ValueType)1);
			}
		}
		if (SupportsExtendedReportRate)
		{
			_supported_wired_report_rates = await _f8061.GetDeviceCapabilities((ConnectionType)0);
			_supported_wireless_report_rates = await _f8061.GetDeviceCapabilities((ConnectionType)1);
			_actual_report_rates = await _f8061.GetActualReportRateList();
			HasUnsupportedWirelessReportRate = _supported_wireless_report_rates.getMaxReportRate() != _actual_report_rates.getMaxReportRate();
		}
		_original_profile_data = _profile_data.Clone();
		base.PropertyChanged += onPropertyChanged;
		Application.Current.Dispatcher.Invoke(delegate
		{
			populateFields();
		}, DispatcherPriority.Render, _cancellation_token_source.Token);
	}

	protected void onPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "Active")
		{
			if (SavedDefaultDPI != null)
			{
				int num = (base.Active ? SavedDefaultDPI.Order : (-1));
				for (int i = 0; i < DPIs.Count; i++)
				{
					DPIs[i].Selected = DPIs[i].Order == num;
				}
			}
			if (_f1B0C != null && _analog_buttons != null)
			{
				_f1B0C.ActuationLevelsBroadcast -= OnActuationLevelsBroadcast;
				if (base.Active)
				{
					_f1B0C.ActuationLevelsBroadcast += OnActuationLevelsBroadcast;
				}
			}
		}
		else
		{
			if (!(e.PropertyName == "Advanced") || !SupportsAdvancedDPI || base.Advanced)
			{
				return;
			}
			foreach (DPI dPI in DPIs)
			{
				if (!dPI.IsLinked)
				{
					dPI.IsLinked = true;
				}
				if (dPI.YValue != dPI.Value)
				{
					dPI.YValue = dPI.Value;
				}
				if (dPI.LODValue != OOBDefaultLOD)
				{
					dPI.LODValue = OOBDefaultLOD;
				}
			}
		}
	}

	public void OnActiveDPIChange(int dpi)
	{
		if (!base.Active)
		{
			return;
		}
		for (int i = 0; i < DPIs.Count; i++)
		{
			if (DPIs[i].Value == DPIs[i].SavedValue)
			{
				DPIs[i].Selected = DPIs[i].Order == dpi;
			}
			else
			{
				DPIs[i].Selected = false;
			}
		}
	}

	public void SetKnownDPI(int dpi)
	{
		if (base.Active)
		{
			for (int i = 0; i < DPIs.Count; i++)
			{
				DPIs[i].Selected = DPIs[i].Value == dpi;
			}
		}
	}

	private async void populateFields()
	{
		HIDDevice hIDDevice = base.Device as HIDDevice;
		OnboardProfilesInfo result;
		try
		{
			Task<OnboardProfilesInfo> onboardProfilesInfo = _f8100.GetOnboardProfilesInfo();
			onboardProfilesInfo.Wait(hIDDevice.CancellationTokenSrc.Token);
			result = onboardProfilesInfo.Result;
		}
		catch (Exception arg)
		{
			Console.WriteLine("Exception caught in device field population, {0}", arg);
			return;
		}
		if (result == null)
		{
			return;
		}
		Enabled = _profile_directory_entry.Enabled;
		base.ProfileID = _profile_directory_entry.Index;
		int num = 0;
		DPIs.Clear();
		foreach (ushort item in _profile_data.GetDpiTable())
		{
			bool flag = num == _profile_data.GetDpiDefaultResolution();
			bool isDPIShift = num == _profile_data.GetDpiShiftResolution();
			DPI dPI = new DPI();
			dPI.InitializeDPI(item);
			dPI.Order = num;
			dPI.Enabled = item != 0;
			dPI.IsDPIShift = isDPIShift;
			dPI.IsDefault = flag;
			dPI.SupportedDPIRange = _supported_dpi_range.values;
			dPI.OnPropertyChange += OnDPIChange;
			if (flag)
			{
				SavedDefaultDPI = dPI;
			}
			DPIs.Add(dPI);
			num++;
		}
		foreach (AdvancedDpi item2 in _profile_data.GetDpiAdvancedTable())
		{
			bool flag2 = num == _profile_data.GetDpiDefaultResolution();
			bool isDPIShift2 = num == _profile_data.GetDpiShiftResolution();
			DPI dPI2 = new DPI();
			dPI2.InitializeDPI(item2.dpi_x, item2.dpi_y, item2.lod);
			dPI2.Order = num;
			dPI2.Enabled = item2.dpi_x != 0;
			dPI2.IsDPIShift = isDPIShift2;
			dPI2.IsDefault = flag2;
			dPI2.IsLinked = item2.dpi_x == item2.dpi_y;
			dPI2.SupportedDPIRange = _supported_dpi_range.values;
			if (_supported_dpi_range_y != null && _supported_dpi_range_y.values.Count > 0)
			{
				dPI2.SupportedDPIRangeY = _supported_dpi_range_y.values;
			}
			dPI2.OnPropertyChange += OnDPIChange;
			if (flag2)
			{
				SavedDefaultDPI = dPI2;
				OOBDefaultLOD = dPI2.LODValue;
			}
			DPIs.Add(dPI2);
			num++;
		}
		if (SupportsAdvancedDPIFeature && result.profile_count_oob >= 1)
		{
			int sector = _profile_directory_entry.Sector;
			int num2 = ((result.profile_count_oob < sector) ? 1 : sector);
			OnboardProfile profile;
			try
			{
				profile = _f8100.GetProfile(num2 + 256);
			}
			catch (Exception arg2)
			{
				Console.WriteLine("Exception caught in device field population, {0}", arg2);
				return;
			}
			if (profile == null)
			{
				return;
			}
			int dpiDefaultResolution = profile.GetDpiDefaultResolution();
			FixedSizeArray_003Clogi_003A_003Ahidppio_003A_003AFeature8100_003A_003AAdvancedDpi_0020_005E_003E dpiAdvancedTable = profile.GetDpiAdvancedTable();
			if (dpiAdvancedTable != null && dpiDefaultResolution >= 0 && dpiDefaultResolution < dpiAdvancedTable.Count())
			{
				OOBDefaultLOD = ((IEnumerable<AdvancedDpi>)dpiAdvancedTable).ElementAt(dpiDefaultResolution).lod;
			}
		}
		base.Advanced = IsAdvancedDPIActive;
		ReportRateItems.Clear();
		ReportRateWiredItems.Clear();
		ReportRateWirelessItems.Clear();
		if (SupportsExtendedReportRate)
		{
			if (HasExtendedWiredReportRate)
			{
				ReportRateExtended reportRateWired = _profile_data.GetReportRateWired();
				ReportRateWiredItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 125), (ReportRateExtended)0));
				ReportRateWiredItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 250), (ReportRateExtended)1));
				ReportRateWiredItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 500), (ReportRateExtended)2));
				ReportRateWiredItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 1000), (ReportRateExtended)3));
				ReportRateWired = reportRateWired;
				OnPropertyChanged("ReportRateWired");
			}
			if (HasExtendedWirelessReportRate)
			{
				ReportRateExtended reportRateWireless = _profile_data.GetReportRateWireless();
				ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 125), (ReportRateExtended)0));
				ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 250), (ReportRateExtended)1));
				ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 500), (ReportRateExtended)2));
				ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 1000), (ReportRateExtended)3));
				if (!_supported_wireless_report_rates.isMaxReportRate((ReportRateExtended)3))
				{
					if (_supported_wireless_report_rates.hasReportRate((ReportRateExtended)4))
					{
						ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 2000), (ReportRateExtended)4));
					}
					if (_supported_wireless_report_rates.hasReportRate((ReportRateExtended)5))
					{
						ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 4000), (ReportRateExtended)5));
					}
					if (_supported_wireless_report_rates.hasReportRate((ReportRateExtended)6))
					{
						ReportRateWirelessItems.Add(new HIDReportRateExtItem(this, string.Format(Resources.Herz_Value, 8000), (ReportRateExtended)6));
					}
				}
				ReportRateWireless = reportRateWireless;
				OnPropertyChanged("ReportRateWireless");
			}
		}
		else
		{
			ReportRate val = _profile_data.GetReportRate();
			ReportRateItems.Add(new HIDReportRateItem(this, string.Format(Resources.Herz_Value, 125), (ReportRate)8));
			if ((int)val != 0)
			{
				ReportRateItems.Add(new HIDReportRateItem(this, string.Format(Resources.Herz_Value, 250), (ReportRate)4));
				ReportRateItems.Add(new HIDReportRateItem(this, string.Format(Resources.Herz_Value, 500), (ReportRate)2));
				ReportRateItems.Add(new HIDReportRateItem(this, string.Format(Resources.Herz_Value, 1000), (ReportRate)1));
			}
			else
			{
				val = (ReportRate)8;
			}
			ReportRate = val;
			OnPropertyChanged("ReportRate");
		}
		if (SupportsBunnyHopping)
		{
			OnPropertyChanged("BunnyHoppingEnabled");
			OnPropertyChanged("BunnyHoppingTimeout");
		}
		if (SupportsAnalogButtons)
		{
			Capabilities result2 = _f1B0C.GetCapabilities().Result;
			ObservableCollection<AnalogButton> observableCollection = CreateAnalogButtonsCollection(result2);
			if (observableCollection.Count == 0)
			{
				_f1B0C = null;
			}
			else
			{
				_analog_buttons = new AnalogButtons(observableCollection, new AnalogMetadata(result2.analog_button_level_resolution, result2.haptics_resolution, result2.rt_sensitivity_resolution));
				OnPropertyChanged("AnalogButtons");
			}
		}
		base.LightingEffectID = LightingEffectID;
		OnPropertyChanged("LightingEffectID");
		OnPropertyChanged("SelectedColor");
		OnPropertyChanged("IsColorVisible");
		foreach (OnboardMemoryManager.Controllers.Assignment assignment4 in Assignments)
		{
			assignment4.AssignmentActionListChanged -= onAssignmentActionListChanged;
			assignment4.PropertyChanged -= OnAssignmentChanged;
		}
		Assignments.Clear();
		List<int> list = new List<int>();
		int num3 = 0;
		int i;
		for (i = 0; i < result.button_count; i++)
		{
			bool enabled = true;
			IEnumerable<HIDActionBlacklistItem> source = HIDActionsBlacklist.Items.Where((HIDActionBlacklistItem item) => item.Action.Macro == _profile_data.GetButtonFunctions(i));
			source = source.Where((HIDActionBlacklistItem item) => item.Exemptions == null || item.Exemptions.Where((int product_id) => product_id == _hidppDevice.ProductId).Count() == 0);
			if (source.Count() > 0)
			{
				if (!source.First().Visible)
				{
					list.Add(i);
					continue;
				}
				enabled = false;
			}
			if (i < 2)
			{
				enabled = false;
			}
			num3++;
			OnboardMemoryManager.Controllers.Assignment assignment = new OnboardMemoryManager.Controllers.Assignment(this, new HIDAssignment(_profile_data.GetButtonFunctions(i), num3, i, enabled, isGshift: false));
			Assignments.Add(assignment);
			assignment.AssignmentActionListChanged += onAssignmentActionListChanged;
			assignment.PropertyChanged += OnAssignmentChanged;
		}
		foreach (OnboardMemoryManager.Controllers.Assignment gShiftAssignment in GShiftAssignments)
		{
			gShiftAssignment.AssignmentActionListChanged -= onAssignmentActionListChanged;
			gShiftAssignment.PropertyChanged -= OnAssignmentChanged;
		}
		GShiftAssignments.Clear();
		num3 = 0;
		int i2;
		for (i2 = 0; i2 < result.button_count; i2++)
		{
			bool enabled2 = true;
			HIDActionsBlacklist.Items.Where((HIDActionBlacklistItem item) => item.Action.Macro == _profile_data.GetGShiftFunction(i2));
			if (!list.Contains(i2))
			{
				num3++;
				OnboardMemoryManager.Controllers.Assignment assignment2 = new OnboardMemoryManager.Controllers.Assignment(this, new HIDAssignment(_profile_data.GetGShiftFunction(i2), num3, i2, enabled2, isGshift: true));
				GShiftAssignments.Add(assignment2);
				assignment2.AssignmentActionListChanged += onAssignmentActionListChanged;
				assignment2.PropertyChanged += OnAssignmentChanged;
			}
		}
		foreach (OnboardMemoryManager.Controllers.Assignment assignment5 in Assignments)
		{
			if (!(assignment5.Model is HIDAssignment hIDAssignment) || !(assignment5.ComboSelectItem is HIDAction hIDAction) || (int)hIDAction.Macro.button_behavior != 144 || (int)hIDAction.Macro.function_opcode != 11)
			{
				continue;
			}
			OnboardMemoryManager.Controllers.Assignment assignment3 = GShiftAssignments[hIDAssignment.Index];
			if (assignment3.Model is HIDAssignment hIDAssignment2)
			{
				if (!hIDAssignment2.Actions.Contains(hIDAction))
				{
					hIDAssignment2.Actions.Add(hIDAction);
				}
				assignment3.GenerateAssignmentCache();
				assignment3.IsEnabled = false;
			}
		}
	}

	private ObservableCollection<AnalogButton> CreateAnalogButtonsCollection(Capabilities native_capabilities)
	{
		ObservableCollection<AnalogButton> observableCollection = new ObservableCollection<AnalogButton>();
		BitArray bitArray = new BitArray(new int[1] { native_capabilities.analog_buttons_bitfield });
		for (int i = 0; i < bitArray.Count; i++)
		{
			if (bitArray[i])
			{
				ulong analog_button_index = (ulong)observableCollection.Count;
				AnalogButton analogButton = CreateAnalogButton(i, analog_button_index, native_capabilities);
				observableCollection.Add(analogButton);
				analogButton.PropertyChanged += delegate(object sender, PropertyChangedEventArgs e)
				{
					OnAnalogButtonPropertyChanged(sender, e, analog_button_index);
				};
			}
		}
		return observableCollection;
	}

	private AnalogButton CreateAnalogButton(int general_button_index, ulong analog_button_index, Capabilities native_capabilities)
	{
		return new AnalogButton
		{
			ButtonId = (uint)(general_button_index + 1),
			ClampActuationPoint = (int val) => val.Clamp(1, native_capabilities.analog_button_level_resolution),
			ClampRapidTriggerSensitivity = (int val) => val.Clamp(1, native_capabilities.rt_sensitivity_resolution),
			ClampHapticLevel = (int val) => val.Clamp(0, native_capabilities.haptics_resolution),
			ActuationPoint = _profile_data.GetActuationPoint(analog_button_index),
			RapidTriggerSensitivity = _profile_data.GetRapidTriggerSensitivity(analog_button_index),
			IsRapidTriggerEnabled = _profile_data.GetRapidTriggerEnable(analog_button_index),
			HapticLevel = _profile_data.GetHapticLevel(analog_button_index)
		};
	}

	private void OnAnalogButtonPropertyChanged(object sender, PropertyChangedEventArgs e, ulong analog_button_index)
	{
		AnalogButton analogButton = sender as AnalogButton;
		if (!(e.PropertyName == "KeyTravel"))
		{
			_profile_data.SetActuationPoint((byte)analogButton.ActuationPoint, analog_button_index);
			_profile_data.SetHapticLevel((byte)analogButton.HapticLevel, analog_button_index);
			_profile_data.SetRapidTriggerSensitivity((byte)analogButton.RapidTriggerSensitivity, analog_button_index);
			_profile_data.SetRapidTriggerEnable(analogButton.IsRapidTriggerEnabled, analog_button_index);
			Dirty = true;
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing)
		{
			_cancellation_token_source.Dispose();
			ReportRateItems.Clear();
			ReportRateWiredItems.Clear();
			ReportRateWirelessItems.Clear();
			foreach (OnboardMemoryManager.Controllers.Assignment assignment in Assignments)
			{
				assignment.AssignmentActionListChanged -= onAssignmentActionListChanged;
				assignment.PropertyChanged -= OnAssignmentChanged;
			}
			Assignments.Clear();
			((Disposable)_profile_data).Dispose();
			_profile_data = null;
		}
		base.Dispose(disposing);
	}

	private void onAssignmentActionListChanged(object sender, OnboardMemoryManager.Controllers.Assignment.AssignmentActionListChangedEventArgs e)
	{
		this.AssignmentActionListChanged?.Invoke(sender, e);
	}

	private void OnActuationLevelsBroadcast(byte[] actuation_levels)
	{
		if (actuation_levels.Length >= _analog_buttons.AnalogButtonsCollection.Count)
		{
			for (int i = 0; i < _analog_buttons.AnalogButtonsCollection.Count; i++)
			{
				_analog_buttons.AnalogButtonsCollection[i].KeyTravel = actuation_levels[i];
			}
		}
	}

	private void UpdateDpiTable()
	{
		if (_profile_data == null)
		{
			return;
		}
		FixedSizeArray_003Cunsigned_0020short_003E dpiTable = _profile_data.GetDpiTable();
		if (dpiTable == null)
		{
			return;
		}
		foreach (DPI dPI in DPIs)
		{
			if (dPI.Order >= dpiTable.Count())
			{
				continue;
			}
			if (dPI.Enabled)
			{
				if (dPI.Value != dpiTable[dPI.Order])
				{
					dpiTable[dPI.Order] = (ushort)dPI.Value;
					Dirty = true;
				}
			}
			else if (dpiTable[dPI.Order] != 0)
			{
				dpiTable[dPI.Order] = 0;
				Dirty = true;
			}
			if (dPI.IsDPIShift)
			{
				_profile_data.SetDpiShiftResolution(dPI.Order);
			}
			if (dPI.IsDefault && _profile_data.GetDpiDefaultResolution() != dPI.Order)
			{
				_profile_data.SetDpiDefaultResolution(dPI.Order);
				Dirty = true;
			}
		}
		_profile_data.SetDpiTable(dpiTable);
	}

	private void UpdateDpiAdvancedTable()
	{
		if (_profile_data == null)
		{
			return;
		}
		FixedSizeArray_003Clogi_003A_003Ahidppio_003A_003AFeature8100_003A_003AAdvancedDpi_0020_005E_003E dpiAdvancedTable = _profile_data.GetDpiAdvancedTable();
		if (dpiAdvancedTable == null)
		{
			return;
		}
		foreach (DPI dPI in DPIs)
		{
			if (dPI.Order >= dpiAdvancedTable.Count())
			{
				continue;
			}
			if (dPI.Enabled)
			{
				if (dPI.Value != dpiAdvancedTable[dPI.Order].dpi_x)
				{
					if (dpiAdvancedTable[dPI.Order].dpi_x != 0)
					{
						Dirty = true;
					}
					dpiAdvancedTable[dPI.Order].dpi_x = (ushort)dPI.Value;
				}
				if (dPI.YValue != dpiAdvancedTable[dPI.Order].dpi_y)
				{
					if (dpiAdvancedTable[dPI.Order].dpi_y != 0)
					{
						Dirty = true;
					}
					dpiAdvancedTable[dPI.Order].dpi_y = (ushort)dPI.YValue;
				}
				if (dPI.LODValue != dpiAdvancedTable[dPI.Order].lod)
				{
					if (dpiAdvancedTable[dPI.Order].lod != 0)
					{
						Dirty = true;
					}
					dpiAdvancedTable[dPI.Order].lod = (byte)dPI.LODValue;
				}
			}
			else
			{
				if (dpiAdvancedTable[dPI.Order].dpi_x != 0)
				{
					dpiAdvancedTable[dPI.Order].dpi_x = 0;
					Dirty = true;
				}
				if (dpiAdvancedTable[dPI.Order].dpi_y != 0)
				{
					dpiAdvancedTable[dPI.Order].dpi_y = 0;
					Dirty = true;
				}
				if (dpiAdvancedTable[dPI.Order].lod != 0)
				{
					dpiAdvancedTable[dPI.Order].lod = 0;
					Dirty = true;
				}
			}
			if (dPI.IsDPIShift)
			{
				_profile_data.SetDpiShiftResolution(dPI.Order);
			}
			if (dPI.IsDefault && _profile_data.GetDpiDefaultResolution() != dPI.Order)
			{
				_profile_data.SetDpiDefaultResolution(dPI.Order);
				Dirty = true;
			}
		}
		_profile_data.SetDpiAdvancedTable(dpiAdvancedTable);
	}

	private void OnDPIChange(DPI dpi, PropertyChangedEventArgs e)
	{
		if (SupportsAdvancedDPIFeature)
		{
			UpdateDpiAdvancedTable();
		}
		else
		{
			UpdateDpiTable();
		}
	}

	private void OnAssignmentChanged(object sender, PropertyChangedEventArgs e)
	{
		//IL_009c: Unknown result type (might be due to invalid IL or missing references)
		//IL_00a6: Invalid comparison between Unknown and I4
		//IL_0175: Unknown result type (might be due to invalid IL or missing references)
		//IL_017f: Invalid comparison between Unknown and I4
		//IL_00ad: Unknown result type (might be due to invalid IL or missing references)
		//IL_00b4: Invalid comparison between Unknown and I4
		//IL_0187: Unknown result type (might be due to invalid IL or missing references)
		//IL_018e: Invalid comparison between Unknown and I4
		if (!(e.PropertyName == "Action"))
		{
			return;
		}
		OnboardMemoryManager.Controllers.Assignment assignment = sender as OnboardMemoryManager.Controllers.Assignment;
		HIDAssignment hIDAssignment = null;
		hIDAssignment = ((assignment != null) ? (assignment.Model as HIDAssignment) : (sender as HIDAssignment));
		if (hIDAssignment == null)
		{
			return;
		}
		bool isGshift = hIDAssignment.isGshift;
		if (!(hIDAssignment.Action is HIDAction hIDAction))
		{
			return;
		}
		if (isGshift)
		{
			_profile_data.SetGShiftFunction(hIDAssignment.Index, hIDAction.Macro);
		}
		else
		{
			OnboardMacro buttonFunctions = _profile_data.GetButtonFunctions(hIDAssignment.Index);
			_profile_data.SetButtonFunctions(hIDAssignment.Index, hIDAction.Macro);
			if ((int)buttonFunctions.button_behavior == 144 && (int)buttonFunctions.function_opcode == 11)
			{
				OnboardMemoryManager.Controllers.Assignment assignment2 = GShiftAssignments[hIDAssignment.Index];
				if (assignment2 != null && assignment2.Model is HIDAssignment hIDAssignment2)
				{
					hIDAssignment2.IsEnabled = hIDAssignment2.InitializedEnabled;
					Action action = hIDAssignment2.Actions.FirstOrDefault(delegate(Action gaction)
					{
						//IL_0012: Unknown result type (might be due to invalid IL or missing references)
						//IL_001c: Invalid comparison between Unknown and I4
						//IL_0024: Unknown result type (might be due to invalid IL or missing references)
						//IL_002a: Invalid comparison between Unknown and I4
						if (!(gaction is HIDAction hIDAction2))
						{
							return false;
						}
						return (int)hIDAction2.Macro.button_behavior == 144 && (int)hIDAction2.Macro.function_opcode == 0;
					});
					hIDAssignment2.Action = action;
					Action item = hIDAssignment2.Actions.FirstOrDefault(delegate(Action gaction)
					{
						//IL_0012: Unknown result type (might be due to invalid IL or missing references)
						//IL_001c: Invalid comparison between Unknown and I4
						//IL_0024: Unknown result type (might be due to invalid IL or missing references)
						//IL_002b: Invalid comparison between Unknown and I4
						if (!(gaction is HIDAction hIDAction2))
						{
							return false;
						}
						return (int)hIDAction2.Macro.button_behavior == 144 && (int)hIDAction2.Macro.function_opcode == 11;
					});
					hIDAssignment2.Actions.Remove(item);
					assignment2.GenerateAssignmentCache();
				}
			}
			if ((int)hIDAction.Macro.button_behavior == 144 && (int)hIDAction.Macro.function_opcode == 11)
			{
				OnboardMemoryManager.Controllers.Assignment assignment3 = GShiftAssignments[hIDAssignment.Index];
				if (assignment3 != null && assignment3.Model is HIDAssignment hIDAssignment3)
				{
					hIDAssignment3.IsEnabled = false;
					if (!hIDAssignment3.Actions.Contains(hIDAction))
					{
						hIDAssignment3.Actions.Add(hIDAction);
						assignment3.GenerateAssignmentCache();
					}
					hIDAssignment3.Action = hIDAction;
				}
			}
		}
		Dirty = true;
		OnPropertyChanged("Assignments");
	}

	private void ExecuteImportHITSCode()
	{
		Messenger.Instance.SendToAllSubscribers(new ShowHITSCodeImportDialog(delegate(string importedCode)
		{
			bool num = new HITSCodeParser(_analog_buttons.AnalogButtonsCollection, _analog_buttons.Metadata).TryParse(importedCode);
			if (num)
			{
				Dirty = true;
			}
			return num;
		}));
	}

	private void ExecuteShareHITSCode()
	{
		string code = new HITSCodeGenerator(_analog_buttons.AnalogButtonsCollection).Generate();
		Messenger.Instance.SendToAllSubscribers(new ShowHITSCodeShareDialog(code));
	}

	public void ResetBunnyHoppingTimeoutCache()
	{
		_bunny_hopping_timeout_cache = 100u;
	}

	private System.Drawing.Color GetColorFrom8070(EffectData effect)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_000f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0010: Unknown result type (might be due to invalid IL or missing references)
		//IL_0012: Invalid comparison between Unknown and I4
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_0017: Invalid comparison between Unknown and I4
		//IL_002d: Unknown result type (might be due to invalid IL or missing references)
		System.Drawing.Color result = System.Drawing.Color.FromArgb(0, 0, 0);
		EFFECT_ID effect_id = effect.effect_id;
		if ((int)effect_id != 1)
		{
			if ((int)effect_id == 10)
			{
				return (System.Drawing.Color)(object)new EffectDataPulsingBreathingWaveform(effect).color;
			}
			return result;
		}
		return (System.Drawing.Color)(object)new EffectDataFixed(effect).color;
	}

	private System.Drawing.Color GetColorFrom8071(EffectData effect)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_000f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0010: Unknown result type (might be due to invalid IL or missing references)
		//IL_0012: Invalid comparison between Unknown and I4
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_0017: Invalid comparison between Unknown and I4
		//IL_002d: Unknown result type (might be due to invalid IL or missing references)
		System.Drawing.Color result = System.Drawing.Color.FromArgb(0, 0, 0);
		EFFECT_ID effect_id = effect.effect_id;
		if ((int)effect_id != 1)
		{
			if ((int)effect_id == 10)
			{
				return (System.Drawing.Color)(object)new EffectDataPulsingBreathingWaveform(effect).color;
			}
			return result;
		}
		return (System.Drawing.Color)(object)new EffectDataFixed(effect).color;
	}

	private void SetLightingFlag(int effectId)
	{
		//IL_0058: Unknown result type (might be due to invalid IL or missing references)
		//IL_005e: Invalid comparison between Unknown and I4
		if (!_profile_data.HasComponent((ComponentId)19) || !((DeviceBase)_hidppDevice).HasFeature(32881).Result)
		{
			return;
		}
		Feature8071 feature = ((DeviceBase)_hidppDevice).GetFeature<Feature8071>();
		bool flag = false;
		DeviceInfo result = feature.GetDeviceInfo().Result;
		for (int i = 0; i < result.multi_cluster_effect_count; i++)
		{
			if ((int)feature.GetEffectInfo(255, i).Result.effect_id == effectId)
			{
				flag = true;
				break;
			}
		}
		if (flag)
		{
			_profile_data.SetLightingFlags(3);
		}
		else
		{
			_profile_data.SetLightingFlags(0);
		}
	}

	private void SetGenericEffectSmoothStarBreathing()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		EffectDataSmoothStarBreathing val = new EffectDataSmoothStarBreathing();
		val.first_choice_color = System.Drawing.Color.FromArgb(0, 0, 0);
		val.second_choice_color = System.Drawing.Color.FromArgb(0, 0, 0);
		val.period = 0;
		val.intensity = 100;
		_profile_data.SetCluster0Active((EffectData)(object)val);
		_profile_data.SetCluster1Active((EffectData)(object)val);
		_profile_data.SetCluster0Passive((EffectData)(object)val);
		_profile_data.SetCluster1Passive((EffectData)(object)val);
	}

	private void SetGenericEffectColorWaveConfig()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		EffectDataColorWaveConfigurable val = new EffectDataColorWaveConfigurable();
		val.saturation = 255;
		val.period = 5000;
		val.intensity = 0;
		val.animation = (ANIMATION)1;
		_profile_data.SetCluster0Active((EffectData)(object)val);
		_profile_data.SetCluster1Active((EffectData)(object)val);
		val.intensity = 50;
		_profile_data.SetCluster0Passive((EffectData)(object)val);
		_profile_data.SetCluster1Passive((EffectData)(object)val);
	}

	private void SetGenericEffectColorCyclingConfig()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		EffectDataColorCycleConfigurable val = new EffectDataColorCycleConfigurable();
		val.saturation = 255;
		val.period = 5000;
		val.intensity = 0;
		_profile_data.SetCluster0Active((EffectData)(object)val);
		_profile_data.SetCluster1Active((EffectData)(object)val);
		val.intensity = 50;
		_profile_data.SetCluster0Passive((EffectData)(object)val);
		_profile_data.SetCluster1Passive((EffectData)(object)val);
	}

	private void SetGenericEffectSnipePulse()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		EffectDataSnipePulseCyanPink val = new EffectDataSnipePulseCyanPink();
		val.period = 0;
		val.intensity = 100;
		_profile_data.SetCluster0Active((EffectData)(object)val);
		_profile_data.SetCluster1Active((EffectData)(object)val);
		val.intensity = 50;
		_profile_data.SetCluster0Passive((EffectData)(object)val);
		_profile_data.SetCluster1Passive((EffectData)(object)val);
	}

	private void SetGenericEffectNeuralWave()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		EffectDataNeuralWaveCyanPink val = new EffectDataNeuralWaveCyanPink();
		val.period = 0;
		val.intensity = 100;
		_profile_data.SetCluster0Active((EffectData)(object)val);
		_profile_data.SetCluster1Active((EffectData)(object)val);
		val.intensity = 50;
		_profile_data.SetCluster0Passive((EffectData)(object)val);
		_profile_data.SetCluster1Passive((EffectData)(object)val);
	}

	private void SetGenericEffectColorWave()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		//IL_0060: Unknown result type (might be due to invalid IL or missing references)
		//IL_0066: Expected O, but got Unknown
		EffectDataColorWave val = new EffectDataColorWave();
		val.start_color = System.Drawing.Color.FromArgb(0, 0, 0, 0);
		val.stop_color = System.Drawing.Color.FromArgb(0, 0, 0, 0);
		val.period = 5000;
		val.animation = (ANIMATION)1;
		val.intensity = 100;
		_profile_data.SetLogoLighting((EffectData)(object)val);
		_profile_data.SetSideLighting((EffectData)(object)val);
		EffectDataColorWave val2 = new EffectDataColorWave();
		val2.start_color = System.Drawing.Color.FromArgb(0, 0, 0, 0);
		val2.stop_color = System.Drawing.Color.FromArgb(0, 0, 0, 0);
		val2.period = 5000;
		val2.animation = (ANIMATION)1;
		val2.intensity = 50;
		_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val2);
		_profile_data.SetSidePowerSaveLighting((EffectData)(object)val2);
		val2.intensity = 100;
		_profile_data.SetCluster0Active((EffectData)(object)val2);
		_profile_data.SetCluster1Active((EffectData)(object)val2);
		val2.intensity = 50;
		_profile_data.SetCluster0Passive((EffectData)(object)val2);
		_profile_data.SetCluster1Passive((EffectData)(object)val2);
	}

	private void SetGenericEffectBreathing(System.Drawing.Color previous_color)
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		//IL_003d: Unknown result type (might be due to invalid IL or missing references)
		//IL_0043: Expected O, but got Unknown
		//IL_007a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0080: Expected O, but got Unknown
		EffectDataPulsingBreathingWaveform val = new EffectDataPulsingBreathingWaveform();
		val.color = previous_color;
		val.intensity = 100;
		val.period = 5000;
		_profile_data.SetLogoLighting((EffectData)(object)val);
		_profile_data.SetSideLighting((EffectData)(object)val);
		EffectDataPulsingBreathingWaveform val2 = new EffectDataPulsingBreathingWaveform();
		val2.color = previous_color;
		val2.intensity = 50;
		val2.period = 5000;
		_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val2);
		_profile_data.SetSidePowerSaveLighting((EffectData)(object)val2);
		EffectDataPulsingBreathingWaveform val3 = new EffectDataPulsingBreathingWaveform();
		val3.color = previous_color;
		val3.intensity = 100;
		val3.period = 5000;
		_profile_data.SetCluster0Active((EffectData)(object)val3);
		_profile_data.SetCluster1Active((EffectData)(object)val3);
		_profile_data.SetCluster0Passive((EffectData)(object)val2);
		_profile_data.SetCluster1Passive((EffectData)(object)val2);
	}

	private void SetGenericEffectCycling()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		//IL_0031: Unknown result type (might be due to invalid IL or missing references)
		//IL_0037: Expected O, but got Unknown
		//IL_0062: Unknown result type (might be due to invalid IL or missing references)
		//IL_0068: Expected O, but got Unknown
		EffectDataCycling val = new EffectDataCycling();
		val.intensity = 100;
		val.period = 5000;
		_profile_data.SetLogoLighting((EffectData)(object)val);
		_profile_data.SetSideLighting((EffectData)(object)val);
		EffectDataCycling val2 = new EffectDataCycling();
		val2.intensity = 50;
		val2.period = 5000;
		_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val2);
		_profile_data.SetSidePowerSaveLighting((EffectData)(object)val2);
		EffectDataCycling val3 = new EffectDataCycling();
		val3.intensity = 100;
		val3.period = 5000;
		_profile_data.SetCluster0Active((EffectData)(object)val3);
		_profile_data.SetCluster1Active((EffectData)(object)val3);
		_profile_data.SetCluster0Passive((EffectData)(object)val2);
		_profile_data.SetCluster1Passive((EffectData)(object)val2);
	}

	private void SetGenericEffectFixed(System.Drawing.Color previous_color)
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		//IL_0031: Unknown result type (might be due to invalid IL or missing references)
		//IL_0037: Expected O, but got Unknown
		//IL_0081: Unknown result type (might be due to invalid IL or missing references)
		//IL_0087: Expected O, but got Unknown
		EffectDataFixed val = new EffectDataFixed();
		val.color = previous_color;
		val.color_animation = (COLOR_ANIMATION)2;
		_profile_data.SetLogoLighting((EffectData)(object)val);
		_profile_data.SetSideLighting((EffectData)(object)val);
		EffectDataFixed val2 = new EffectDataFixed();
		val2.color = System.Drawing.Color.FromArgb(previous_color.R / 2, previous_color.G / 2, previous_color.B / 2);
		val2.color_animation = (COLOR_ANIMATION)2;
		_profile_data.SetLogoPowerSaveLighting((EffectData)(object)val2);
		_profile_data.SetSidePowerSaveLighting((EffectData)(object)val2);
		EffectDataFixed val3 = new EffectDataFixed();
		val3.color = previous_color;
		val3.color_animation = (COLOR_ANIMATION)2;
		_profile_data.SetCluster0Active((EffectData)(object)val3);
		_profile_data.SetCluster1Active((EffectData)(object)val3);
		_profile_data.SetCluster0Passive((EffectData)(object)val2);
		_profile_data.SetCluster1Passive((EffectData)(object)val2);
	}

	private void SetGenericEffectDisabled()
	{
		//IL_0000: Unknown result type (might be due to invalid IL or missing references)
		//IL_0006: Expected O, but got Unknown
		//IL_001e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0024: Expected O, but got Unknown
		EffectData val = new EffectData();
		_profile_data.SetLogoLighting(val);
		_profile_data.SetSideLighting(val);
		EffectData val2 = new EffectData();
		_profile_data.SetLogoPowerSaveLighting(val2);
		_profile_data.SetSidePowerSaveLighting(val2);
		_profile_data.SetCluster0Active(val2);
		_profile_data.SetCluster1Active(val2);
		_profile_data.SetCluster0Passive(val2);
		_profile_data.SetCluster1Passive(val2);
	}

	public async Task Write()
	{
		try
		{
			await _f8100.WriteProfileData(_profile_directory_entry.Sector, _profile_data);
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in profile write, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			Application.Current.Dispatcher.Invoke(delegate
			{
				MessageBox.Show($"Device raised an exception during profile write: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		await _profile_directory_entry.Controller.Write();
		foreach (DPI dPI in DPIs)
		{
			dPI.SavedValue = dPI.Value;
			if (dPI.IsDefault)
			{
				SavedDefaultDPI = dPI;
			}
		}
		_original_profile_data = _profile_data.Clone();
		Dirty = false;
	}

	public void Reset()
	{
		_profile_data = _original_profile_data.Clone();
		Application.Current.Dispatcher.Invoke(delegate
		{
			populateFields();
		}, DispatcherPriority.Render, _cancellation_token_source.Token);
		Dirty = false;
	}

	public async Task LoadOOBProfile()
	{
		OnboardProfilesInfo obj = await _f8100.GetOnboardProfilesInfo();
		if (obj.profile_count_oob < 1)
		{
			throw new Exception("Device does not have any stored OOB profiles");
		}
		int sector = _profile_directory_entry.Sector;
		int num = ((obj.profile_count_oob < sector) ? 1 : sector);
		OnboardProfile profile = _f8100.GetProfile(num + 256);
		_original_profile_data.GetDpiDefaultResolution();
		profile.GetDpiDefaultResolution();
		_profile_data = profile;
		_original_profile_data = profile.Clone();
		try
		{
			await _f8100.WriteProfileData(sector, _profile_data);
		}
		catch (ResponseError val)
		{
			ResponseError val2 = val;
			ResponseError e = val2;
			Console.WriteLine("Exception caught in profile write, {0}\nError code: {1}\nRequest: {2}\nResponse {3}", ((Exception)(object)e).Message, e.ErrorCode, e.Request, e.Response);
			Application.Current.Dispatcher.Invoke(delegate
			{
				MessageBox.Show($"Device raised an exception during profile write: {((Exception)(object)e).Message}\nError code: {e.ErrorCode}\nRequest: {e.Request}\nResponse {e.Response}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
			});
		}
		await _profile_directory_entry.Controller.Write();
		Application.Current.Dispatcher.Invoke(delegate
		{
			populateFields();
			Dirty = false;
			EventHandler<OnModifiedStateChangedEventArgs> eventHandler = this.OnModifiedStateChanged;
			OnModifiedStateChangedEventArgs e2 = new OnModifiedStateChangedEventArgs
			{
				IsModified = false
			};
			eventHandler?.Invoke(this, e2);
		}, DispatcherPriority.Render, _cancellation_token_source.Token);
	}

	private string GetProfileDisplayName()
	{
		if (base.ProfileID == 0)
		{
			return "";
		}
		if (!(_profile_data.GetProfileName().Trim() != "") || !(_profile_data.GetProfileName() != "PROFILE_NAME_DEFAULT"))
		{
			return string.Format(Resources.Profile_Label, base.ProfileID);
		}
		return _profile_data.GetProfileName();
	}
}
