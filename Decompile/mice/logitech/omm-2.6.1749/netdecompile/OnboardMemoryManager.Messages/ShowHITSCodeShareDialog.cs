namespace OnboardMemoryManager.Messages;

public class ShowHITSCodeShareDialog
{
	public string Code { get; set; }

	public ShowHITSCodeShareDialog(string code)
	{
		Code = code;
	}
}
