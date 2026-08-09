using System.Collections.Generic;

namespace Mouse_Drive_Beta;

public class BatteryHandleParam
{
	public byte level;

	public int sec;

	public byte haveRollingCode;

	public List<byte> rollingCode;
}
