using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;

namespace OnboardMemoryManager.Helpers;

public sealed class WindowHelpers
{
	private enum ShowWindowEnum
	{
		Hide = 0,
		ShowNormal = 1,
		ShowMinimized = 2,
		ShowMaximized = 3,
		Maximize = 3,
		ShowNormalNoActivate = 4,
		Show = 5,
		Minimize = 6,
		ShowMinNoActivate = 7,
		ShowNoActivate = 8,
		Restore = 9,
		ShowDefault = 10,
		ForceMinimized = 11
	}

	[DllImport("user32.dll")]
	[return: MarshalAs(UnmanagedType.Bool)]
	private static extern bool ShowWindow(IntPtr hWnd, ShowWindowEnum flags);

	[DllImport("user32.dll")]
	private static extern int SetForegroundWindow(IntPtr hwnd);

	public static bool BringMainWindowToFront(Process bProcess)
	{
		if (bProcess.MainWindowHandle == IntPtr.Zero)
		{
			ShowWindow(bProcess.Handle, ShowWindowEnum.Restore);
		}
		return SetForegroundWindow(bProcess.MainWindowHandle) > 0;
	}

	public static void CloseAllPopups()
	{
		foreach (Window window in Application.Current.Windows)
		{
			foreach (Popup item in ComponentTreeTraversers.FindVisualChildren<Popup>(window))
			{
				if (ComponentTreeTraversers.FindParent<ComboBox>(item) == null && item.IsOpen)
				{
					item.IsOpen = false;
				}
			}
		}
	}
}
