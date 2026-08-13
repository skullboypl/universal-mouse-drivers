using System;

namespace OnboardMemoryManager.Helpers;

public static class BunnyHoppingHelper
{
	public static bool IsBunnyHoppingEnabled(byte bunny_hopping_timeout)
	{
		if (bunny_hopping_timeout != 0)
		{
			return bunny_hopping_timeout != byte.MaxValue;
		}
		return false;
	}

	public static uint ConvertTimeoutToMs(byte bunny_hopping_timeout)
	{
		return (uint)(bunny_hopping_timeout * 10);
	}

	public static byte ConvertTimeoutToByte(uint bunny_hopping_timeout)
	{
		return (byte)(bunny_hopping_timeout / 10);
	}

	public static int RoundToNearestHundred(uint value)
	{
		return (int)(Math.Round((double)value / 100.0, 0, MidpointRounding.AwayFromZero) * 100.0);
	}
}
