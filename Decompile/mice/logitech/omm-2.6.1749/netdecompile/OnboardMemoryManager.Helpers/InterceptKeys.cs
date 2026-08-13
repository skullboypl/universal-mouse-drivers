using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace OnboardMemoryManager.Helpers;

public sealed class InterceptKeys
{
	public enum MODIFIER
	{
		NONE = 0,
		LCTRL = 1,
		RCTRL = 2,
		LALT = 4,
		RALT = 8,
		LWIN = 0x10,
		RWIN = 0x20,
		LSHIFT = 0x40,
		RSHIFT = 0x80
	}

	public enum VK_CODES
	{
		VK_SHIFT = 16,
		VK_CONTROL = 17,
		VK_LWIN = 91,
		VK_RWIN = 92,
		VK_LSHIFT = 160,
		VK_RSHIFT = 161,
		VK_LCONTROL = 162,
		VK_RCONTROL = 163
	}

	public class KeyPressArgs : EventArgs
	{
		public Key KeyCode { get; set; }

		public int ScanCode { get; set; }

		public int VirtualKeyCode { get; set; }

		public int HIDCode { get; set; }

		public int Modifiers { get; set; }
	}

	private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

	private static readonly InterceptKeys _instance;

	private const int WH_KEYBOARD_LL = 13;

	private const int WM_KEYDOWN = 256;

	private const int WM_KEYUP = 257;

	private const int MAPVK_VK_TO_VSC = 0;

	private const int MAPVK_VSC_TO_VK = 1;

	private const int MAPVK_VK_TO_CHAR = 2;

	private const int MAPVK_VSC_TO_VK_EX = 3;

	private const int KEYEVENTF_EXTENDEDKEY = 1;

	private static LowLevelKeyboardProc _proc;

	private static IntPtr _hookID;

	private int _modifiersDown;

	private HashSet<Key> _keysDown = new HashSet<Key>();

	private object _lock = new object();

	public static InterceptKeys Instance => _instance;

	public event EventHandler<KeyPressArgs> OnKeyPress;

	static InterceptKeys()
	{
		_instance = new InterceptKeys();
		_proc = HookCallback;
		_hookID = IntPtr.Zero;
	}

	private InterceptKeys()
	{
	}

	~InterceptKeys()
	{
		StopListener();
	}

	public void StartListener()
	{
		if (_hookID != IntPtr.Zero)
		{
			return;
		}
		_hookID = SetHook(_proc);
		lock (_lock)
		{
			_modifiersDown = 0;
			_keysDown.Clear();
		}
	}

	public void StopListener()
	{
		if (!(_hookID == IntPtr.Zero))
		{
			UnhookWindowsHookEx(_hookID);
			_hookID = IntPtr.Zero;
		}
	}

	private MODIFIER getModifier(Key keyCode)
	{
		return keyCode switch
		{
			Key.LeftCtrl => MODIFIER.LCTRL, 
			Key.RightCtrl => MODIFIER.RCTRL, 
			Key.LeftAlt => MODIFIER.LALT, 
			Key.RightAlt => MODIFIER.RALT, 
			Key.LeftShift => MODIFIER.LSHIFT, 
			Key.RightShift => MODIFIER.RSHIFT, 
			Key.LWin => MODIFIER.LWIN, 
			Key.RWin => MODIFIER.RWIN, 
			_ => MODIFIER.NONE, 
		};
	}

	public static int TranslateVirtualKeyIntoScanCode(int vkCode)
	{
		return (int)MapVirtualKey((uint)vkCode, 0);
	}

	public static char TranslateVirtualKeyIntoChar(Key key, bool isShifted = false)
	{
		char result = ' ';
		int num = KeyInterop.VirtualKeyFromKey(key);
		byte[] array = new byte[256];
		GetKeyboardState(array);
		array[16] = (byte)(isShifted ? 128u : 0u);
		array[160] = (byte)(isShifted ? 129u : 0u);
		array[161] = 0;
		uint wScanCode = MapVirtualKey((uint)num, 0);
		StringBuilder stringBuilder = new StringBuilder(2);
		switch (ToUnicode((uint)num, wScanCode, array, stringBuilder, stringBuilder.Capacity, 0u))
		{
		default:
			if (stringBuilder.Length >= 1)
			{
				result = stringBuilder[0];
			}
			break;
		case -1:
		case 0:
			break;
		}
		return result;
	}

	public static Key TranslateScanCodeIntoKey(int scanCode)
	{
		return KeyInterop.KeyFromVirtualKey((int)MapVirtualKey((uint)scanCode, 3));
	}

	protected void OnKeyDownInternal(int scanCode, int vkCode)
	{
		Key key = KeyInterop.KeyFromVirtualKey(vkCode);
		MODIFIER modifier = getModifier(key);
		if (modifier != MODIFIER.NONE)
		{
			lock (_lock)
			{
				_modifiersDown += (int)modifier;
				return;
			}
		}
		_keysDown.Add(key);
	}

	protected void OnKeyUpInternal(int scanCode, int vkCode)
	{
		Key key = KeyInterop.KeyFromVirtualKey(vkCode);
		MODIFIER modifier = getModifier(key);
		if (modifier == MODIFIER.NONE || _keysDown.Count == 0)
		{
			if (_keysDown.Count == 0)
			{
				_modifiersDown = 0;
			}
			_keysDown.Remove(key);
			EventHandler<KeyPressArgs> eventHandler = this.OnKeyPress;
			KeyPressArgs keyPressArgs = new KeyPressArgs();
			keyPressArgs.KeyCode = key;
			keyPressArgs.ScanCode = scanCode;
			keyPressArgs.VirtualKeyCode = vkCode;
			lock (_lock)
			{
				keyPressArgs.Modifiers = _modifiersDown;
			}
			eventHandler?.Invoke(this, keyPressArgs);
			return;
		}
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			await Task.Delay(125);
			lock (_lock)
			{
				_modifiersDown = (int)(_modifiersDown - modifier);
			}
		});
	}

	private static IntPtr SetHook(LowLevelKeyboardProc proc)
	{
		using Process process = Process.GetCurrentProcess();
		using ProcessModule processModule = process.MainModule;
		return SetWindowsHookEx(13, proc, GetModuleHandle(processModule.ModuleName), 0u);
	}

	private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
	{
		if (nCode >= 0 && (wParam == (IntPtr)256 || wParam == (IntPtr)257))
		{
			int vkCode = Marshal.ReadInt32(lParam);
			int num = Marshal.ReadInt32(lParam, 4);
			if ((Marshal.ReadInt32(lParam, 8) & 1) > 0)
			{
				if (num == 0)
				{
					num = TranslateVirtualKeyIntoScanCode(vkCode);
				}
				num += 57344;
			}
			if (wParam == (IntPtr)256)
			{
				Instance.OnKeyDownInternal(num, vkCode);
			}
			else if (wParam == (IntPtr)257)
			{
				Instance.OnKeyUpInternal(num, vkCode);
			}
			return (IntPtr)1;
		}
		return CallNextHookEx(_hookID, nCode, wParam, lParam);
	}

	[DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

	[DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	[return: MarshalAs(UnmanagedType.Bool)]
	private static extern bool UnhookWindowsHookEx(IntPtr hhk);

	[DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern uint MapVirtualKey(uint uCode, uint uMapType);

	[DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern short GetKeyState(uint nVirtKey);

	[DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

	[DllImport("user32.dll", CharSet = CharSet.Auto)]
	private static extern int ToUnicode(uint wVirtKey, uint wScanCode, byte[] lpKeyState, [Out][MarshalAs(UnmanagedType.LPWStr)] StringBuilder pwszBuff, int cchBuff, uint wFlags);

	[DllImport("user32.dll")]
	public static extern bool GetKeyboardState(byte[] lpKeyState);

	[DllImport("user32.dll")]
	public static extern uint MapVirtualKey(uint uCode, int uMapType);

	[DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern IntPtr GetModuleHandle(string lpModuleName);
}
