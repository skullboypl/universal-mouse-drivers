using System;
using System.Security.Permissions;
using System.Windows.Threading;

namespace Logitech.Windows.Threading;

public static class DispatcherExtensions
{
	public static void InvokeEx(this Dispatcher dispatcher, Action action)
	{
		dispatcher.InvokeEx(DispatcherPriority.Send, action);
	}

	public static void InvokeEx<T>(this Dispatcher dispatcher, Action<T> action, T arg)
	{
		dispatcher.InvokeEx(DispatcherPriority.Send, action, arg);
	}

	public static void InvokeEx<T1, T2>(this Dispatcher dispatcher, Action<T1, T2> action, T1 arg1, T2 arg2)
	{
		dispatcher.InvokeEx(DispatcherPriority.Send, action, arg1, arg2);
	}

	public static void InvokeEx<T1, T2, T3>(this Dispatcher dispatcher, Action<T1, T2, T3> action, T1 arg1, T2 arg2, T3 arg3)
	{
		dispatcher.InvokeEx(DispatcherPriority.Send, action, arg1, arg2, arg3);
	}

	public static void InvokeEx<T1, T2, T3, T4>(this Dispatcher dispatcher, Action<T1, T2, T3, T4> action, T1 arg1, T2 arg2, T3 arg3, T4 arg4)
	{
		dispatcher.InvokeEx(DispatcherPriority.Send, action, arg1, arg2, arg3, arg4);
	}

	public static void InvokeEx(this Dispatcher dispatcher, DispatcherPriority priority, Action action)
	{
		if (action != null)
		{
			if (dispatcher.CheckAccess())
			{
				action();
			}
			else
			{
				dispatcher.Invoke(priority, action);
			}
		}
	}

	public static void InvokeEx<T>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T> action, T arg)
	{
		if (action != null)
		{
			if (dispatcher.CheckAccess())
			{
				action(arg);
			}
			else
			{
				dispatcher.Invoke(priority, action, arg);
			}
		}
	}

	public static void InvokeEx<T1, T2>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2> action, T1 arg1, T2 arg2)
	{
		if (action != null)
		{
			if (dispatcher.CheckAccess())
			{
				action(arg1, arg2);
				return;
			}
			dispatcher.Invoke(priority, action, arg1, arg2);
		}
	}

	public static void InvokeEx<T1, T2, T3>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2, T3> action, T1 arg1, T2 arg2, T3 arg3)
	{
		if (action != null)
		{
			if (dispatcher.CheckAccess())
			{
				action(arg1, arg2, arg3);
				return;
			}
			dispatcher.Invoke(priority, action, arg1, arg2, arg3);
		}
	}

	public static void InvokeEx<T1, T2, T3, T4>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2, T3, T4> action, T1 arg1, T2 arg2, T3 arg3, T4 arg4)
	{
		if (action != null)
		{
			if (dispatcher.CheckAccess())
			{
				action(arg1, arg2, arg3, arg4);
				return;
			}
			dispatcher.Invoke(priority, action, arg1, arg2, arg3, arg4);
		}
	}

	public static void BeginInvokeEx(this Dispatcher dispatcher, Action action)
	{
		dispatcher.BeginInvokeEx(DispatcherPriority.Normal, action);
	}

	public static void BeginInvokeEx<T>(this Dispatcher dispatcher, Action<T> action, T arg)
	{
		dispatcher.BeginInvokeEx(DispatcherPriority.Normal, action, arg);
	}

	public static void BeginInvokeEx<T1, T2>(this Dispatcher dispatcher, Action<T1, T2> action, T1 arg1, T2 arg2)
	{
		dispatcher.BeginInvokeEx(DispatcherPriority.Normal, action, arg1, arg2);
	}

	public static void BeginInvokeEx<T1, T2, T3>(this Dispatcher dispatcher, Action<T1, T2, T3> action, T1 arg1, T2 arg2, T3 arg3)
	{
		dispatcher.BeginInvokeEx(DispatcherPriority.Normal, action, arg1, arg2, arg3);
	}

	public static void BeginInvokeEx<T1, T2, T3, T4>(this Dispatcher dispatcher, Action<T1, T2, T3, T4> action, T1 arg1, T2 arg2, T3 arg3, T4 arg4)
	{
		dispatcher.BeginInvokeEx(DispatcherPriority.Normal, action, arg1, arg2, arg3, arg4);
	}

	public static void BeginInvokeEx(this Dispatcher dispatcher, DispatcherPriority priority, Action action)
	{
		if (action != null)
		{
			dispatcher.BeginInvoke(priority, action);
		}
	}

	public static void BeginInvokeEx<T>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T> action, T arg)
	{
		if (action != null)
		{
			dispatcher.BeginInvoke(priority, action, arg);
		}
	}

	public static void BeginInvokeEx<T1, T2>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2> action, T1 arg1, T2 arg2)
	{
		if (action != null)
		{
			dispatcher.BeginInvoke(priority, action, arg1, arg2);
		}
	}

	public static void BeginInvokeEx<T1, T2, T3>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2, T3> action, T1 arg1, T2 arg2, T3 arg3)
	{
		if (action != null)
		{
			dispatcher.BeginInvoke(priority, action, arg1, arg2, arg3);
		}
	}

	public static void BeginInvokeEx<T1, T2, T3, T4>(this Dispatcher dispatcher, DispatcherPriority priority, Action<T1, T2, T3, T4> action, T1 arg1, T2 arg2, T3 arg3, T4 arg4)
	{
		if (action != null)
		{
			dispatcher.BeginInvoke(priority, action, arg1, arg2, arg3, arg4);
		}
	}

	[SecurityPermission(SecurityAction.Demand, Flags = SecurityPermissionFlag.UnmanagedCode)]
	public static void DoEvents()
	{
		DispatcherFrame dispatcherFrame = new DispatcherFrame();
		Dispatcher.CurrentDispatcher.BeginInvoke(DispatcherPriority.Background, new DispatcherOperationCallback(ExitFrame), dispatcherFrame);
		Dispatcher.PushFrame(dispatcherFrame);
	}

	private static object ExitFrame(object f)
	{
		(f as DispatcherFrame).Continue = false;
		return null;
	}
}
