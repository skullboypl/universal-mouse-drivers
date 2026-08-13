using System;

namespace OnboardMemoryManager.Messages;

public class ShowHITSCodeImportDialog
{
	public Func<string, bool> OnImportCallback { get; set; }

	public ShowHITSCodeImportDialog(Func<string, bool> onImportCallback)
	{
		OnImportCallback = onImportCallback;
	}
}
