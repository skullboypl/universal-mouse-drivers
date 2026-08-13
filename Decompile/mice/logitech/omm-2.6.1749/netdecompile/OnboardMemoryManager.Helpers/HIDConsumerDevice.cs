using System.Collections.Generic;
using System.Windows.Input;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Helpers;

public sealed class HIDConsumerDevice
{
	public class HIDScanCode
	{
		public string KeyName { get; set; }

		public int HIDPage { get; set; }

		public int HIDCode { get; set; }

		public int ScanCode { get; set; }

		public HIDScanCode(string keyName, int hidPage, int hidCode, int scanCode)
		{
			KeyName = keyName;
			HIDPage = hidPage;
			HIDCode = hidCode;
			ScanCode = scanCode;
		}

		public virtual string GetLocalizedKeyName()
		{
			if (HIDCode > 3 && HIDCode < 30)
			{
				return KeyName.Substring(2);
			}
			return KeyName;
		}
	}

	public class ConvertedHIDScanCode : HIDScanCode
	{
		public ConvertedHIDScanCode(string keyName, int hidPage, int hidCode, int scanCode)
			: base(keyName, hidPage, hidCode, scanCode)
		{
		}

		public override string GetLocalizedKeyName()
		{
			Key key = InterceptKeys.TranslateScanCodeIntoKey(base.ScanCode);
			string text = InterceptKeys.TranslateVirtualKeyIntoChar(key).ToString();
			string text2 = InterceptKeys.TranslateVirtualKeyIntoChar(key, isShifted: true).ToString();
			if (text == text2)
			{
				return text;
			}
			if (text2 == "")
			{
				return text;
			}
			if (base.HIDCode > 3 && base.HIDCode < 30)
			{
				return text2;
			}
			return text + " " + text2;
		}
	}

	public class SystemHIDScanCode : HIDScanCode
	{
		public SystemHIDScanCode(string keyName, int hidPage, int hidCode, int scanCode)
			: base(keyName, hidPage, hidCode, scanCode)
		{
		}

		public override string GetLocalizedKeyName()
		{
			return InterceptKeys.TranslateScanCodeIntoKey(base.ScanCode).ToString();
		}
	}

	public class LocalizedHIDScanCode : HIDScanCode
	{
		public LocalizedHIDScanCode(string keyName, int hidPage, int hidCode, int scanCode)
			: base(keyName, hidPage, hidCode, scanCode)
		{
		}

		public override string GetLocalizedKeyName()
		{
			string text = Resources.ResourceManager.GetString(base.KeyName);
			if (text != null)
			{
				return text;
			}
			return base.KeyName;
		}
	}

	private static readonly HIDConsumerDevice _instance;

	public readonly Dictionary<int, HIDScanCode> HidCode;

	public readonly Dictionary<int, HIDScanCode> ScanCode;

	public readonly List<HIDScanCode> _data = new List<HIDScanCode>
	{
		new LocalizedHIDScanCode("Action_Consumer_Key_Power", 1, 129, 57438),
		new LocalizedHIDScanCode("Action_Consumer_Key_Sleep", 1, 130, 57439),
		new SystemHIDScanCode("System Wake", 1, 131, 57443),
		new SystemHIDScanCode("Overrun Error", 7, 1, 255),
		new SystemHIDScanCode("POST Fail", 7, 2, 252),
		new ConvertedHIDScanCode("a A", 7, 4, 30),
		new ConvertedHIDScanCode("b B", 7, 5, 48),
		new ConvertedHIDScanCode("c C", 7, 6, 46),
		new ConvertedHIDScanCode("d D", 7, 7, 32),
		new ConvertedHIDScanCode("e E", 7, 8, 18),
		new ConvertedHIDScanCode("f F", 7, 9, 33),
		new ConvertedHIDScanCode("g G", 7, 10, 34),
		new ConvertedHIDScanCode("h H", 7, 11, 35),
		new ConvertedHIDScanCode("i I", 7, 12, 23),
		new ConvertedHIDScanCode("j J", 7, 13, 36),
		new ConvertedHIDScanCode("k K", 7, 14, 37),
		new ConvertedHIDScanCode("l L", 7, 15, 38),
		new ConvertedHIDScanCode("m M", 7, 16, 50),
		new ConvertedHIDScanCode("n N", 7, 17, 49),
		new ConvertedHIDScanCode("o O", 7, 18, 24),
		new ConvertedHIDScanCode("p P", 7, 19, 25),
		new ConvertedHIDScanCode("q Q", 7, 20, 16),
		new ConvertedHIDScanCode("r R", 7, 21, 19),
		new ConvertedHIDScanCode("s S", 7, 22, 31),
		new ConvertedHIDScanCode("t T", 7, 23, 20),
		new ConvertedHIDScanCode("u U", 7, 24, 22),
		new ConvertedHIDScanCode("v V", 7, 25, 47),
		new ConvertedHIDScanCode("w W", 7, 26, 17),
		new ConvertedHIDScanCode("x X", 7, 27, 45),
		new ConvertedHIDScanCode("y Y", 7, 28, 21),
		new ConvertedHIDScanCode("z Z", 7, 29, 44),
		new ConvertedHIDScanCode("1 !", 7, 30, 2),
		new ConvertedHIDScanCode("2 @", 7, 31, 3),
		new ConvertedHIDScanCode("3 #", 7, 32, 4),
		new ConvertedHIDScanCode("4 $", 7, 33, 5),
		new ConvertedHIDScanCode("5 %", 7, 34, 6),
		new ConvertedHIDScanCode("6 ^", 7, 35, 7),
		new ConvertedHIDScanCode("7 &", 7, 36, 8),
		new ConvertedHIDScanCode("8 *", 7, 37, 9),
		new ConvertedHIDScanCode("9 (", 7, 38, 10),
		new ConvertedHIDScanCode("0 )", 7, 39, 11),
		new SystemHIDScanCode("Return", 7, 40, 28),
		new SystemHIDScanCode("Escape", 7, 41, 1),
		new SystemHIDScanCode("Backspace", 7, 42, 14),
		new SystemHIDScanCode("Tab", 7, 43, 15),
		new SystemHIDScanCode("Space", 7, 44, 57),
		new ConvertedHIDScanCode("- _", 7, 45, 12),
		new ConvertedHIDScanCode("= +", 7, 46, 13),
		new ConvertedHIDScanCode("[ {", 7, 47, 26),
		new ConvertedHIDScanCode("] }", 7, 48, 27),
		new ConvertedHIDScanCode("\\ |", 7, 49, 43),
		new ConvertedHIDScanCode("\\ |", 7, 50, 43),
		new ConvertedHIDScanCode("; :", 7, 51, 39),
		new ConvertedHIDScanCode("' \"", 7, 52, 40),
		new ConvertedHIDScanCode("` ~", 7, 53, 41),
		new ConvertedHIDScanCode(", <", 7, 54, 51),
		new ConvertedHIDScanCode(". >", 7, 55, 52),
		new ConvertedHIDScanCode("/ ?", 7, 56, 53),
		new SystemHIDScanCode("Caps Lock", 7, 57, 58),
		new SystemHIDScanCode("F1", 7, 58, 59),
		new SystemHIDScanCode("F2", 7, 59, 60),
		new SystemHIDScanCode("F3", 7, 60, 61),
		new SystemHIDScanCode("F4", 7, 61, 62),
		new SystemHIDScanCode("F5", 7, 62, 63),
		new SystemHIDScanCode("F6", 7, 63, 64),
		new SystemHIDScanCode("F7", 7, 64, 65),
		new SystemHIDScanCode("F8", 7, 65, 66),
		new SystemHIDScanCode("F9", 7, 66, 67),
		new SystemHIDScanCode("F10", 7, 67, 68),
		new SystemHIDScanCode("F11", 7, 68, 87),
		new SystemHIDScanCode("F12", 7, 69, 88),
		new LocalizedHIDScanCode("Action_Consumer_Key_Print_Screen", 7, 70, 57399),
		new SystemHIDScanCode("Scroll Lock", 7, 71, 70),
		new LocalizedHIDScanCode("Action_Consumer_Key_System_Break", 7, 72, 57414),
		new LocalizedHIDScanCode("Action_Consumer_Key_System_Pause", 7, 72, 57629),
		new SystemHIDScanCode("Insert", 7, 73, 57426),
		new SystemHIDScanCode("Home", 7, 74, 57415),
		new LocalizedHIDScanCode("Action_Consumer_Key_Page_Up", 7, 75, 57417),
		new SystemHIDScanCode("Delete", 7, 76, 57427),
		new SystemHIDScanCode("End", 7, 77, 57423),
		new LocalizedHIDScanCode("Action_Consumer_Key_Page_Down", 7, 78, 57425),
		new SystemHIDScanCode("Right Arrow", 7, 79, 57421),
		new SystemHIDScanCode("Left Arrow", 7, 80, 57419),
		new SystemHIDScanCode("Down Arrow", 7, 81, 57424),
		new SystemHIDScanCode("Up Arrow", 7, 82, 57416),
		new SystemHIDScanCode("Num Lock", 7, 83, 69),
		new HIDScanCode("Keypad /", 7, 84, 57397),
		new HIDScanCode("Keypad *", 7, 85, 55),
		new HIDScanCode("Keypad -", 7, 86, 74),
		new HIDScanCode("Keypad +", 7, 87, 78),
		new HIDScanCode("Keypad Enter", 7, 88, 57372),
		new HIDScanCode("Keypad 1 End", 7, 89, 79),
		new HIDScanCode("Keypad 2 Down", 7, 90, 80),
		new HIDScanCode("Keypad 3 PageDn", 7, 91, 81),
		new HIDScanCode("Keypad 4 Left", 7, 92, 75),
		new HIDScanCode("Keypad 5", 7, 93, 76),
		new HIDScanCode("Keypad 6 Right", 7, 94, 77),
		new HIDScanCode("Keypad 7 Home", 7, 95, 71),
		new HIDScanCode("Keypad 8 Up", 7, 96, 72),
		new HIDScanCode("Keypad 9 PageUp", 7, 97, 73),
		new HIDScanCode("Keypad 0 Insert", 7, 98, 82),
		new HIDScanCode("Keypad . Delete", 7, 99, 83),
		new SystemHIDScanCode("Europe 2", 7, 100, 86),
		new SystemHIDScanCode("App", 7, 101, 57437),
		new SystemHIDScanCode("Keyboard Power", 7, 102, 57438),
		new HIDScanCode("Keypad =", 7, 103, 89),
		new SystemHIDScanCode("F13", 7, 104, 100),
		new SystemHIDScanCode("F14", 7, 105, 101),
		new SystemHIDScanCode("F15", 7, 106, 102),
		new SystemHIDScanCode("F16", 7, 107, 103),
		new SystemHIDScanCode("F17", 7, 108, 104),
		new SystemHIDScanCode("F18", 7, 109, 105),
		new SystemHIDScanCode("F19", 7, 110, 106),
		new SystemHIDScanCode("F20", 7, 111, 107),
		new SystemHIDScanCode("F21", 7, 112, 108),
		new SystemHIDScanCode("F22", 7, 113, 109),
		new SystemHIDScanCode("F23", 7, 114, 110),
		new SystemHIDScanCode("F24", 7, 115, 118),
		new SystemHIDScanCode("Keypad , (Brazilian Keypad .)", 7, 133, 126),
		new SystemHIDScanCode("Keyboard Int'l 1 ろ (Ro)", 7, 135, 115),
		new SystemHIDScanCode("Keyboard Intl'2 かかかか ひひひか ロロロ字 (Katakana/Hiragana)", 7, 136, 112),
		new SystemHIDScanCode("Keyboard Int'l 2 ¥ (Yen)", 7, 137, 125),
		new SystemHIDScanCode("Keyboard Int'l 4 前前前 変変 次前前 ( ) 全前前 (Henkan)", 7, 138, 121),
		new SystemHIDScanCode("Keyboard Int'l 5 無変変 (Muhenkan)", 7, 139, 123),
		new SystemHIDScanCode("Keyboard Int'l 6 (PC9800 Keypad , )", 7, 140, 92),
		new SystemHIDScanCode("Keyboard Lang 1 한옝/ (Hanguel/English)", 7, 144, 242),
		new SystemHIDScanCode("Keyboard Lang 2 한한 (Hanja)", 7, 145, 241),
		new SystemHIDScanCode("Keyboard Lang 3 かかかか (Katakana)", 7, 146, 120),
		new SystemHIDScanCode("Keyboard Lang 4 ひひひか (Hiragana)", 7, 147, 119),
		new SystemHIDScanCode("Keyboard Lang 5 半半全半/ (Zenkaku/Hankaku)", 7, 148, 118),
		new HIDScanCode("Left Control", 7, 224, 29),
		new HIDScanCode("Left Shift", 7, 225, 42),
		new HIDScanCode("Left Alt", 7, 226, 56),
		new HIDScanCode("Left Win", 7, 227, 57435),
		new HIDScanCode("Right Control", 7, 228, 57373),
		new HIDScanCode("Right Shift", 7, 229, 57398),
		new HIDScanCode("Right Alt", 7, 230, 57400),
		new HIDScanCode("Right Win", 7, 231, 57436),
		new LocalizedHIDScanCode("Action_Consumer_Key_Next_Track", 12, 181, 57369),
		new LocalizedHIDScanCode("Action_Consumer_Key_Previous_Track", 12, 182, 57360),
		new SystemHIDScanCode("Stop", 12, 183, 57380),
		new LocalizedHIDScanCode("Action_Consumer_Key_Play_Pause", 12, 205, 57378),
		new LocalizedHIDScanCode("Action_Consumer_Key_Mute", 12, 226, 57376),
		new LocalizedHIDScanCode("Action_Consumer_Key_Volume_Up", 12, 233, 57392),
		new LocalizedHIDScanCode("Action_Consumer_Key_Volume_Down", 12, 234, 57390),
		new SystemHIDScanCode("Media Select", 12, 387, 57453),
		new SystemHIDScanCode("Mail", 12, 394, 57452),
		new SystemHIDScanCode("Calculator", 12, 402, 57377),
		new SystemHIDScanCode("My Computer", 12, 404, 57451),
		new SystemHIDScanCode("WWW Search", 12, 545, 57445),
		new SystemHIDScanCode("WWW Home", 12, 547, 57394),
		new SystemHIDScanCode("WWW Back", 12, 548, 57450),
		new SystemHIDScanCode("WWW Forward", 12, 549, 57449),
		new SystemHIDScanCode("WWW Stop", 12, 550, 57448),
		new SystemHIDScanCode("WWW Refresh", 12, 551, 57447),
		new SystemHIDScanCode("WWW Favorites", 12, 554, 57446)
	};

	public static HIDConsumerDevice Instance => _instance;

	static HIDConsumerDevice()
	{
		_instance = new HIDConsumerDevice();
	}

	private HIDConsumerDevice()
	{
		HidCode = new Dictionary<int, HIDScanCode>();
		ScanCode = new Dictionary<int, HIDScanCode>();
		foreach (HIDScanCode datum in _data)
		{
			HidCode[(datum.HIDPage << 8) | datum.HIDCode] = datum;
			ScanCode[datum.ScanCode] = datum;
		}
	}
}
