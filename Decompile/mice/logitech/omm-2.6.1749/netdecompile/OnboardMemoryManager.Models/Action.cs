using OnboardMemoryManager.Components;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Models;

public class Action : ComboSelectDataItem
{
	private int _id;

	public int ID
	{
		get
		{
			return _id;
		}
		set
		{
			if (value != _id)
			{
				_id = value;
				OnPropertyChanged("ID");
			}
		}
	}

	public override string Title
	{
		get
		{
			string text = Resources.ResourceManager.GetString(base.Title);
			if (text != null)
			{
				return text;
			}
			return base.Title;
		}
		set
		{
			base.Title = value;
		}
	}
}
