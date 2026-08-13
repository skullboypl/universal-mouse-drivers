using System;
using System.Windows.Input;

namespace OnboardMemoryManager.Helpers;

public class RelayCommand : ICommand
{
	private readonly Action<object> _execute;

	private readonly Func<object, bool> _canExecute;

	public event EventHandler CanExecuteChanged
	{
		add
		{
			CommandManager.RequerySuggested += value;
		}
		remove
		{
			CommandManager.RequerySuggested -= value;
		}
	}

	public RelayCommand(Action<object> execute, Func<object, bool> canExecute = null)
	{
		if (execute == null)
		{
			throw new ArgumentNullException("execute");
		}
		_execute = execute;
		_canExecute = canExecute;
	}

	public RelayCommand(Action execute, Func<bool> canExecute = null)
		: this((execute != null) ? ((Action<object>)delegate
		{
			execute();
		}) : null, (canExecute != null) ? ((Func<object, bool>)((object _) => canExecute())) : null)
	{
	}

	public bool CanExecute(object parameter)
	{
		if (_canExecute != null)
		{
			return _canExecute(parameter);
		}
		return true;
	}

	public void Execute(object parameter)
	{
		_execute(parameter);
	}
}
