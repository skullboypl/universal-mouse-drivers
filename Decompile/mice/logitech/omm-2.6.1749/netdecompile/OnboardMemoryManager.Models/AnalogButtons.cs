using System.Collections.ObjectModel;

namespace OnboardMemoryManager.Models;

public class AnalogButtons
{
	public ObservableCollection<AnalogButton> AnalogButtonsCollection { get; }

	public AnalogMetadata Metadata { get; }

	public AnalogButtons(ObservableCollection<AnalogButton> analogButtonsCollection, AnalogMetadata metadata)
	{
		AnalogButtonsCollection = analogButtonsCollection;
		Metadata = metadata;
	}
}
