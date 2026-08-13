using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Media;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDActionsDefaults
{
	private bool _enabled = true;

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
			}
		}
	}

	public static List<HIDAction> Items
	{
		get
		{
			Application current = Application.Current;
			return new List<HIDAction>
			{
				new HIDAction((REMAPPING_OPCODES)1, 1u),
				new HIDAction((REMAPPING_OPCODES)1, 2u),
				new HIDAction((REMAPPING_OPCODES)1, 4u),
				new HIDAction((REMAPPING_OPCODES)1, 8u),
				new HIDAction((REMAPPING_OPCODES)1, 16u),
				new HIDAction(HIDAction.CONSUMER_KEYS.PLAY_PAUSE),
				new HIDAction(HIDAction.CONSUMER_KEYS.NEXT_TRACK),
				new HIDAction(HIDAction.CONSUMER_KEYS.PREVIOUS_TRACK),
				new HIDAction(HIDAction.CONSUMER_KEYS.MUTE),
				new HIDAction(HIDAction.CONSUMER_KEYS.VOLUME_UP),
				new HIDAction(HIDAction.CONSUMER_KEYS.VOLUME_DOWN),
				new HIDAction((FUNCTION_OPCODES)7, 0u, (Brush)current.FindResource("Color.YellowBrush")),
				new HIDAction((FUNCTION_OPCODES)11, 0u, (Brush)current.FindResource("Color.RedBrush")),
				new HIDAction((FUNCTION_OPCODES)10),
				new HIDAction((FUNCTION_OPCODES)5),
				new HIDAction((FUNCTION_OPCODES)1),
				new HIDAction((FUNCTION_OPCODES)2),
				new HIDAction((FUNCTION_OPCODES)0)
			};
		}
	}

	public static List<HIDAction> GShiftItems => Items.Where((HIDAction item) => (int)item.Macro.function_opcode != 7 && (int)item.Macro.function_opcode != 11).ToList();
}
