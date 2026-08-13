using System.Collections.ObjectModel;
using System.ComponentModel;

namespace OnboardMemoryManager.Models;

public class Assignment : INotifyPropertyChanged
{
	private int visibleIndex;

	private Action action;

	private ObservableCollection<Action> _actions;

	private bool _enabled = true;

	private bool _profileCycleWarning;

	public int VisibleIndex
	{
		get
		{
			return visibleIndex;
		}
		set
		{
			if (value != visibleIndex)
			{
				visibleIndex = value;
				OnPropertyChanged("VisibleIndex");
			}
		}
	}

	public Action Action
	{
		get
		{
			return action;
		}
		set
		{
			if (value != action)
			{
				action = value;
				OnPropertyChanged("Action");
			}
		}
	}

	public bool IsEnabled
	{
		get
		{
			return _enabled;
		}
		set
		{
			if (value != _enabled)
			{
				_enabled = value;
				OnPropertyChanged("Enabled");
			}
		}
	}

	public bool ProfileCycleWarning
	{
		get
		{
			return _profileCycleWarning;
		}
		set
		{
			if (value != _profileCycleWarning)
			{
				_profileCycleWarning = value;
				OnPropertyChanged("ProfileCycleWarning");
			}
		}
	}

	public ObservableCollection<Action> Actions
	{
		get
		{
			return _actions;
		}
		set
		{
			if (value != _actions)
			{
				_actions = value;
				OnPropertyChanged("Actions");
			}
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	public Assignment()
	{
		Actions = new ObservableCollection<Action>();
	}

	public Assignment(int visible_index, int action_index, bool enabled = true)
	{
		Actions = new ObservableCollection<Action>();
		visibleIndex = visible_index;
		if (action_index > -1 && action_index < Actions.Count)
		{
			action = Actions[action_index];
		}
		_enabled = enabled;
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}
}
