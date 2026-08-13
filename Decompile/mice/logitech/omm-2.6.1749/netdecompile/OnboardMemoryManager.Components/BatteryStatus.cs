using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using OnboardMemoryManager.Controllers;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Components;

public class BatteryStatus : Image
{
	private static string s_batteryEmptyIconPath = "svg_icon_battery_empty";

	private static string s_batteryAlmostEmptyIconPath = "svg_icon_battery_almost_empty";

	private static string s_batteryHalfIconPath = "svg_icon_battery_half";

	private static string s_batteryAlmostFullIconPath = "svg_icon_battery_almost_full";

	private static string s_batteryFullIconPath = "svg_icon_battery_full";

	private static string s_batteryChargingIconPath = "svg_icon_battery_charging";

	private static string s_batteryPoweredByPowerplayPath = "svg_icon_powerplay_powered";

	private DrawingImage _currentStatusImage;

	public static readonly DependencyProperty BatteryLevelProperty = DependencyProperty.Register("BatteryLevel", typeof(Battery.BATTERY_LEVEL), typeof(BatteryStatus));

	public static readonly DependencyProperty ChargeStateProperty = DependencyProperty.Register("ChargeState", typeof(Battery.CHARGE_STATE), typeof(BatteryStatus));

	public static readonly DependencyProperty PercentProperty = DependencyProperty.Register("Percent", typeof(int), typeof(BatteryStatus));

	public static readonly DependencyProperty IsBatteryRemovedProperty = DependencyProperty.Register("IsBatteryRemoved", typeof(bool), typeof(BatteryStatus));

	public Battery.BATTERY_LEVEL BatteryLevel
	{
		get
		{
			return (Battery.BATTERY_LEVEL)GetValue(BatteryLevelProperty);
		}
		set
		{
			if (BatteryLevel != value)
			{
				SetValue(BatteryLevelProperty, value);
				EvaluateCurrentStatusImage();
			}
		}
	}

	public Battery.CHARGE_STATE ChargeState
	{
		get
		{
			return (Battery.CHARGE_STATE)GetValue(ChargeStateProperty);
		}
		set
		{
			if (ChargeState != value)
			{
				SetValue(ChargeStateProperty, value);
				EvaluateCurrentStatusImage();
			}
		}
	}

	public int Percent
	{
		get
		{
			return (int)GetValue(PercentProperty);
		}
		set
		{
			SetValue(PercentProperty, value);
			setToolTip();
		}
	}

	public bool IsBatteryRemoved
	{
		get
		{
			return (bool)GetValue(IsBatteryRemovedProperty);
		}
		set
		{
			SetValue(IsBatteryRemovedProperty, value);
			EvaluateCurrentStatusImage();
			setToolTip();
		}
	}

	public BatteryStatus()
	{
		base.Loaded += onLoaded;
	}

	private void EvaluateCurrentStatusImage()
	{
		if (BatteryLevel == Battery.BATTERY_LEVEL.UNDEFINED)
		{
			base.Visibility = Visibility.Hidden;
			return;
		}
		base.Visibility = Visibility.Visible;
		if (ChargeState == Battery.CHARGE_STATE.CHARGING)
		{
			SetCurrentStatusImage(s_batteryChargingIconPath);
			return;
		}
		if (IsBatteryRemoved)
		{
			SetCurrentStatusImage(s_batteryPoweredByPowerplayPath);
			return;
		}
		switch (BatteryLevel)
		{
		case Battery.BATTERY_LEVEL.FULL:
			SetCurrentStatusImage(s_batteryFullIconPath);
			break;
		case Battery.BATTERY_LEVEL.HIGH:
			SetCurrentStatusImage(s_batteryAlmostFullIconPath);
			break;
		case Battery.BATTERY_LEVEL.MEDIUM:
			SetCurrentStatusImage(s_batteryHalfIconPath);
			break;
		case Battery.BATTERY_LEVEL.LOW:
			SetCurrentStatusImage(s_batteryAlmostEmptyIconPath);
			break;
		case Battery.BATTERY_LEVEL.EMPTY:
			SetCurrentStatusImage(s_batteryEmptyIconPath);
			break;
		default:
			base.Visibility = Visibility.Hidden;
			break;
		}
	}

	private void SetCurrentStatusImage(string iconPath)
	{
		_currentStatusImage = FindResource(iconPath) as DrawingImage;
		base.Source = _currentStatusImage;
	}

	private void onLoaded(object sender, RoutedEventArgs e)
	{
		RenderOptions.SetBitmapScalingMode(this, BitmapScalingMode.HighQuality);
		EvaluateCurrentStatusImage();
	}

	private void setToolTip()
	{
		if (IsBatteryRemoved)
		{
			base.ToolTip = OnboardMemoryManager.Properties.Resources.Battery_Powered_Powerplay_Text;
		}
		else
		{
			base.ToolTip = string.Format(OnboardMemoryManager.Properties.Resources.Battery_Status_Text, Percent, (ChargeState == Battery.CHARGE_STATE.CHARGING) ? OnboardMemoryManager.Properties.Resources.Battery_Charging : OnboardMemoryManager.Properties.Resources.Battery_Discharging);
		}
	}
}
