using Logitech.ComponentModel;

namespace OnboardMemoryManager.Controllers;

public class LocaleInfo : ObservableObject
{
	private string _name;

	private string _title;

	public string Name
	{
		get
		{
			return _name;
		}
		set
		{
			if (value != _name)
			{
				_name = value;
				OnPropertyChanged("Name");
			}
		}
	}

	public string Title
	{
		get
		{
			return _title;
		}
		set
		{
			if (value != _title)
			{
				_title = value;
				OnPropertyChanged("Title");
			}
		}
	}
}
