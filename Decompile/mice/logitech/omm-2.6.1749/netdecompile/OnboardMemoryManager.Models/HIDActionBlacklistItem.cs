using System.Collections.Generic;

namespace OnboardMemoryManager.Models;

public class HIDActionBlacklistItem
{
	public HIDAction Action;

	public List<int> Exemptions;

	public bool Visible;

	public HIDActionBlacklistItem(HIDAction action, bool visible = false, List<int> exempted_device_equads = null)
	{
		Action = action;
		Visible = visible;
		Exemptions = exempted_device_equads;
	}
}
