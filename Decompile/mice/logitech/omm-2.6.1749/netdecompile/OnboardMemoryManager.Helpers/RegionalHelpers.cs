using System.Runtime.InteropServices;

namespace OnboardMemoryManager.Helpers;

public static class RegionalHelpers
{
	private enum GeoClass
	{
		Nation = 16,
		Region = 14
	}

	public static string Brand
	{
		get
		{
			if (GetUserGeoID(GeoClass.Nation) == 122)
			{
				return "Logicool";
			}
			return "Logitech";
		}
	}

	[DllImport("kernel32.dll", CallingConvention = CallingConvention.StdCall, ExactSpelling = true, SetLastError = true)]
	private static extern int GetUserGeoID(GeoClass geoClass);
}
