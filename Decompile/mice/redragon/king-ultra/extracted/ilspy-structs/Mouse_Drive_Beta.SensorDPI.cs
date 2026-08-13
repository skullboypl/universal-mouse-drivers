using System.Collections.Generic;

namespace Mouse_Drive_Beta;

public struct SensorDPI
{
	public string Type;

	public int DPIex;

	public List<int> Min;

	public List<int> Max;

	public List<int> Step;

	public List<int> DPIList;

	public List<int> DPIValueList;

	public bool Discord;
}
