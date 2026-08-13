using System.Collections.ObjectModel;
using System.Linq;
using OnboardMemoryManager.Properties;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDAssignment : Assignment
{
	private int _index;

	private readonly bool _initializedEnabled;

	private readonly bool _isGshift;

	public int Index => _index;

	public bool InitializedEnabled => _initializedEnabled;

	public bool isGshift => _isGshift;

	public HIDAssignment(OnboardMacro macro, int visible_index, int index, bool enabled, bool isGshift)
	{
		base.VisibleIndex = visible_index;
		_index = index;
		_initializedEnabled = enabled;
		_isGshift = isGshift;
		base.IsEnabled = enabled;
		base.Actions = new ObservableCollection<Action>((_isGshift ? HIDActionsDefaults.GShiftItems : HIDActionsDefaults.Items).Cast<Action>().ToList());
		base.Action = base.Actions.FirstOrDefault((Action item) => item != null && item is HIDAction && (item as HIDAction).Macro == macro);
		if (base.Action != null)
		{
			return;
		}
		base.Action = new HIDAction(macro);
		if (base.Action.Title == Resources.Action_Invalid)
		{
			base.Action = base.Actions.First((Action item) => item is HIDAction && (int)(item as HIDAction).Macro.button_behavior == 144 && (int)(item as HIDAction).Macro.function_opcode == 0);
		}
		else
		{
			base.Actions.Add(base.Action);
		}
	}
}
