using System.ComponentModel;
using System.Windows.Media;

namespace OnboardMemoryManager.Components;

public class ComboSelectDataItem : INotifyPropertyChanged
{
	private string title;

	private Brush foreground = Brushes.White;

	private bool is_selectable = true;

	public virtual string Title
	{
		get
		{
			return title;
		}
		set
		{
			if (value != title)
			{
				title = value;
				OnPropertyChanged("Title");
			}
		}
	}

	public Brush Foreground
	{
		get
		{
			return foreground;
		}
		set
		{
			if (value != foreground)
			{
				foreground = value;
				OnPropertyChanged("Foreground");
			}
		}
	}

	public bool IsSelectable
	{
		get
		{
			return is_selectable;
		}
		set
		{
			if (value != is_selectable)
			{
				is_selectable = value;
				OnPropertyChanged("IsSelectable");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	public override bool Equals(object obj)
	{
		if (!(obj is ComboSelectDataItem comboSelectDataItem))
		{
			return false;
		}
		return Title == comboSelectDataItem.Title;
	}

	public override int GetHashCode()
	{
		return base.GetHashCode();
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}
}
