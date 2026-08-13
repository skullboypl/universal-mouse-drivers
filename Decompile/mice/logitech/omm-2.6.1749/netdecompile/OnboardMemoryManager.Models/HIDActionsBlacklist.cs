using System.Collections.Generic;
using System.Windows;

namespace OnboardMemoryManager.Models;

public class HIDActionsBlacklist
{
	public static List<HIDActionBlacklistItem> Items
	{
		get
		{
			_ = Application.Current;
			return new List<HIDActionBlacklistItem>();
		}
	}
}
