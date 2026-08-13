using System.Windows;
using System.Windows.Media;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Properties;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDAction : Action
{
	public enum CONSUMER_KEYS
	{
		POWER = 304,
		SLEEP = 306,
		PLAY_PAUSE = 3277,
		PREVIOUS_TRACK = 3253,
		NEXT_TRACK = 3254,
		MUTE = 3298,
		VOLUME_UP = 3305,
		VOLUME_DOWN = 3306
	}

	private OnboardMacro _macro;

	public OnboardMacro Macro => _macro;

	public override string Title => getTitleFromMacro();

	public HIDAction(REMAPPING_OPCODES opcode, uint value, Brush foreground = null)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		//IL_0011: Expected O, but got Unknown
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0027: Unknown result type (might be due to invalid IL or missing references)
		//IL_0028: Unknown result type (might be due to invalid IL or missing references)
		//IL_002d: Unknown result type (might be due to invalid IL or missing references)
		//IL_002f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0041: Expected I4, but got Unknown
		_macro = new OnboardMacro();
		_macro.button_behavior = (BUTTON_BEHAVIOR)128;
		_macro.remapping_opcode = opcode;
		switch (opcode - 1)
		{
		case 0:
			_macro.mouse_button = (int)value;
			break;
		case 1:
			_macro.key_code = (int)value;
			break;
		case 2:
			_macro.consumer_key = (int)value;
			break;
		}
		base.Foreground = ((foreground == null) ? ((Brush)Application.Current.FindResource("ColorBrush.OnSurface")) : foreground);
	}

	public HIDAction(CONSUMER_KEYS consumer_key, Brush foreground = null)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		//IL_0011: Expected O, but got Unknown
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0028: Unknown result type (might be due to invalid IL or missing references)
		_macro = new OnboardMacro();
		_macro.button_behavior = (BUTTON_BEHAVIOR)128;
		_macro.remapping_opcode = (REMAPPING_OPCODES)3;
		_macro.consumer_key = (int)consumer_key;
		base.Foreground = ((foreground == null) ? ((Brush)Application.Current.FindResource("ColorBrush.OnSurface")) : foreground);
	}

	public HIDAction(int keycode, int modifier = 0, Brush foreground = null)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		//IL_0011: Expected O, but got Unknown
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0028: Unknown result type (might be due to invalid IL or missing references)
		_macro = new OnboardMacro();
		_macro.button_behavior = (BUTTON_BEHAVIOR)128;
		_macro.remapping_opcode = (REMAPPING_OPCODES)2;
		_macro.key_code = keycode;
		_macro.modifier = modifier;
		base.Foreground = ((foreground == null) ? ((Brush)Application.Current.FindResource("ColorBrush.OnSurface")) : foreground);
	}

	public HIDAction(FUNCTION_OPCODES function, uint enabled_profile = 0u, Brush foreground = null)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		//IL_0011: Expected O, but got Unknown
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0027: Unknown result type (might be due to invalid IL or missing references)
		//IL_0028: Unknown result type (might be due to invalid IL or missing references)
		_macro = new OnboardMacro();
		_macro.button_behavior = (BUTTON_BEHAVIOR)144;
		_macro.function_opcode = function;
		_macro.enabled_profile = (int)enabled_profile;
		base.Foreground = ((foreground == null) ? ((Brush)Application.Current.FindResource("ColorBrush.OnSurface")) : foreground);
	}

	public HIDAction(OnboardMacro macro, Brush foreground = null)
	{
		_macro = macro;
		base.Foreground = ((foreground == null) ? ((Brush)Application.Current.FindResource("ColorBrush.OnSurface")) : foreground);
	}

	public override bool Equals(object obj)
	{
		if (!(obj is HIDAction hIDAction))
		{
			return false;
		}
		return Macro == hIDAction.Macro;
	}

	public override int GetHashCode()
	{
		return base.GetHashCode();
	}

	public void RegenerateTitle()
	{
		Title = getTitleFromMacro();
	}

	private string getTitleFromMacro()
	{
		//IL_0006: Unknown result type (might be due to invalid IL or missing references)
		//IL_000b: Unknown result type (might be due to invalid IL or missing references)
		//IL_000c: Unknown result type (might be due to invalid IL or missing references)
		//IL_000f: Invalid comparison between Unknown and I4
		//IL_001e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0021: Invalid comparison between Unknown and I4
		//IL_0011: Unknown result type (might be due to invalid IL or missing references)
		//IL_0023: Unknown result type (might be due to invalid IL or missing references)
		//IL_0029: Invalid comparison between Unknown and I4
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_0017: Invalid comparison between Unknown and I4
		//IL_0053: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Unknown result type (might be due to invalid IL or missing references)
		//IL_0059: Unknown result type (might be due to invalid IL or missing references)
		//IL_005b: Unknown result type (might be due to invalid IL or missing references)
		//IL_006d: Expected I4, but got Unknown
		//IL_002b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0031: Invalid comparison between Unknown and I4
		//IL_036d: Unknown result type (might be due to invalid IL or missing references)
		//IL_0372: Unknown result type (might be due to invalid IL or missing references)
		//IL_0374: Unknown result type (might be due to invalid IL or missing references)
		//IL_0377: Unknown result type (might be due to invalid IL or missing references)
		//IL_03c1: Expected I4, but got Unknown
		BUTTON_BEHAVIOR button_behavior = _macro.button_behavior;
		if ((int)button_behavior <= 16)
		{
			if ((int)button_behavior == 0)
			{
				return Resources.Action_Macro_Unsupported;
			}
			if ((int)button_behavior == 16)
			{
				return Resources.Action_Stop_Macro;
			}
		}
		else
		{
			if ((int)button_behavior == 32)
			{
				return Resources.Action_Stop_All_Macros;
			}
			if ((int)button_behavior == 128)
			{
				REMAPPING_OPCODES remapping_opcode = _macro.remapping_opcode;
				switch (remapping_opcode - 1)
				{
				case 0:
					return _macro.mouse_button switch
					{
						0 => Resources.Action_Invalid, 
						1 => Resources.Click_Primary, 
						4 => Resources.Click_Middle, 
						2 => Resources.Click_Secondary, 
						8 => Resources.Click_Back, 
						16 => Resources.Click_Forwards, 
						_ => string.Format(Resources.Click_Generic, _macro.mouse_button), 
					};
				case 1:
					lock (HIDConsumerDevice.Instance)
					{
						string text = "";
						if ((_macro.modifier & 1) > 0 || (_macro.modifier & 0x10) > 0)
						{
							text = text + ((text == "") ? "" : " ") + Resources.Action_Modifier_Ctrl;
						}
						if ((_macro.modifier & 4) > 0 || (_macro.modifier & 0x40) > 0)
						{
							text = text + ((text == "") ? "" : " ") + Resources.Action_Modifier_Alt;
						}
						if ((_macro.modifier & 8) > 0 || (_macro.modifier & 0x80) > 0)
						{
							text = text + ((text == "") ? "" : " ") + Resources.Action_Modifier_Gui;
						}
						if ((_macro.modifier & 2) > 0 || (_macro.modifier & 0x20) > 0)
						{
							text = text + ((text == "") ? "" : " ") + Resources.Action_Modifier_Shift;
						}
						text += ((text == "") ? "" : " + ");
						if (!HIDConsumerDevice.Instance.HidCode.ContainsKey(0x700 | _macro.key_code))
						{
							return "";
						}
						HIDConsumerDevice.HIDScanCode hIDScanCode = HIDConsumerDevice.Instance.HidCode[0x700 | _macro.key_code];
						text += hIDScanCode.GetLocalizedKeyName();
						return (_macro.key_code == 0) ? "" : text;
					}
				case 2:
					lock (HIDConsumerDevice.Instance)
					{
						lock (HIDConsumerDevice.Instance)
						{
							if (!HIDConsumerDevice.Instance.HidCode.ContainsKey(_macro.consumer_key))
							{
								return Resources.Action_Consumer_Key_Unknown;
							}
							return HIDConsumerDevice.Instance.HidCode[_macro.consumer_key].GetLocalizedKeyName();
						}
					}
				default:
					return Resources.Action_Invalid;
				}
			}
			if ((int)button_behavior == 144)
			{
				FUNCTION_OPCODES function_opcode = _macro.function_opcode;
				return (function_opcode - 1) switch
				{
					0 => Resources.Action_Tilt_Left, 
					1 => Resources.Action_Tilt_Right, 
					2 => Resources.Action_Next_DPI, 
					3 => Resources.Action_Previous_DPI, 
					4 => Resources.Action_Cycle_DPIs, 
					5 => Resources.Action_Default_DPI, 
					6 => Resources.Action_DPI_Shift, 
					7 => Resources.Action_Next_Profile, 
					8 => Resources.Action_Previous_Profile, 
					9 => Resources.Action_Cycle_Profiles, 
					10 => Resources.Action_G_Shift, 
					12 => string.Format(Resources.Action_Enable_Profile, _macro.enabled_profile), 
					13 => Resources.Action_Toggle_Performance_Mode, 
					14 => Resources.Action_Host_Button, 
					15 => Resources.Action_Scroll_Down, 
					16 => Resources.Action_Scroll_Up, 
					_ => Resources.Action_Invalid, 
				};
			}
		}
		return Resources.Action_Invalid;
	}
}
