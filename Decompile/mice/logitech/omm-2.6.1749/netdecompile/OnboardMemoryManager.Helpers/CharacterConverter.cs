using System.Runtime.InteropServices;
using System.Text;

namespace OnboardMemoryManager.Helpers;

public class CharacterConverter
{
	[DllImport("user32.dll", CharSet = CharSet.Unicode)]
	private static extern int ToUnicode(uint virtualKeyCode, uint scanCode, byte[] keyboardState, StringBuilder receivingBuffer, int bufferSize, uint flags);

	public static string CharCodeToString(uint keyCode)
	{
		StringBuilder stringBuilder = new StringBuilder(256);
		ToUnicode(keyCode, 0u, new byte[256], stringBuilder, stringBuilder.Capacity, 0u);
		return stringBuilder.ToString();
	}
}
