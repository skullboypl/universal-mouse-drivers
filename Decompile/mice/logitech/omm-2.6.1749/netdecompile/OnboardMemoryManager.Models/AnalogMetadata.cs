namespace OnboardMemoryManager.Models;

public class AnalogMetadata
{
	public const uint AnalogButtonLevelMin = 1u;

	public const uint HapticLevelMin = 0u;

	public const uint RapidTriggerSensitivityMin = 1u;

	public uint AnalogButtonLevelResolution { get; }

	public uint HapticsResolution { get; }

	public uint RapidTriggerSensitivityResolution { get; }

	public double AnalogButtonLevelMinDouble => 1.0;

	public double HapticLevelMinDouble => 0.0;

	public double RapidTriggerSensitivityMinDouble => 1.0;

	public AnalogMetadata(uint analogButtonLevelResolution, uint hapticsResolution, uint rapidTriggerSensitivityResolution)
	{
		AnalogButtonLevelResolution = analogButtonLevelResolution;
		HapticsResolution = hapticsResolution;
		RapidTriggerSensitivityResolution = rapidTriggerSensitivityResolution;
	}
}
