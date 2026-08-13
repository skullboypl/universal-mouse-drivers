using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Components;

public class ConnectionStatus : Image
{
	private static string s_connectionUsb = "svg_icon_connection_usb";

	private static string s_connectionLightspeed = "svg_icon_connection_lightspeed";

	private static string s_connectionBluetooth = "svg_icon_connection_bluetooth";

	private DrawingImage _currentStatusImage;

	public static readonly DependencyProperty ActiveConnectionTypeProperty = DependencyProperty.Register("ActiveConnectionType", typeof(HIDDevice.ConnectionType), typeof(ConnectionStatus));

	public HIDDevice.ConnectionType ActiveConnectionType
	{
		get
		{
			return (HIDDevice.ConnectionType)GetValue(ActiveConnectionTypeProperty);
		}
		set
		{
			if (ActiveConnectionType != value)
			{
				SetValue(ActiveConnectionTypeProperty, value);
				EvaluateCurrentStatusImage();
			}
		}
	}

	public ConnectionStatus()
	{
		base.Loaded += onLoaded;
	}

	private void EvaluateCurrentStatusImage()
	{
		if (ActiveConnectionType == HIDDevice.ConnectionType.UNKNOWN)
		{
			base.Visibility = Visibility.Hidden;
			return;
		}
		base.Visibility = Visibility.Visible;
		switch (ActiveConnectionType)
		{
		case HIDDevice.ConnectionType.USB:
			SetCurrentStatusImage(s_connectionUsb);
			break;
		case HIDDevice.ConnectionType.BLUETOOTH:
			SetCurrentStatusImage(s_connectionBluetooth);
			break;
		case HIDDevice.ConnectionType.LIGHTSPEED:
			SetCurrentStatusImage(s_connectionLightspeed);
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
}
