namespace OnboardMemoryManager.Components;

public class ComboSelectItemSeparator : ComboSelectDataItem
{
	public ComboSelectItemSeparator()
	{
		base.IsSelectable = false;
	}

	public override bool Equals(object obj)
	{
		if (!(obj is ComboSelectItemSeparator))
		{
			return false;
		}
		return true;
	}

	public override int GetHashCode()
	{
		return base.GetHashCode();
	}
}
