namespace OnboardMemoryManager;

public sealed class DevicePageSingleton
{
	private static readonly DevicePageSingleton _instance;

	public static DevicePageSingleton Instance => _instance;

	public string CurrentSelection { get; set; }

	static DevicePageSingleton()
	{
		_instance = new DevicePageSingleton();
	}
}
