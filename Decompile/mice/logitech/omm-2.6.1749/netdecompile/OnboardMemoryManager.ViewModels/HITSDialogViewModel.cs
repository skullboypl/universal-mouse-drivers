using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using Logitech.ComponentModel;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Messages;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.ViewModels;

public class HITSDialogViewModel : ObservableObject, IDisposable
{
	private bool _isVisible;

	private string _title;

	private string _description;

	private string _helperText;

	private string _code;

	private string _actionButtonText;

	private bool _isShareMode;

	private bool _isReadOnly;

	private bool _validateNow;

	private bool _hasText;

	private bool _manualValidationError;

	private bool _hasValidationError;

	private Func<string, bool> _onImport;

	public bool IsVisible
	{
		get
		{
			return _isVisible;
		}
		set
		{
			if (_isVisible != value)
			{
				_isVisible = value;
				OnPropertyChanged("IsVisible");
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
			if (_title != value)
			{
				_title = value;
				OnPropertyChanged("Title");
			}
		}
	}

	public string Description
	{
		get
		{
			return _description;
		}
		set
		{
			if (_description != value)
			{
				_description = value;
				OnPropertyChanged("Description");
			}
		}
	}

	public string HelperText
	{
		get
		{
			return _helperText;
		}
		set
		{
			if (_helperText != value)
			{
				_helperText = value;
				OnPropertyChanged("HelperText");
			}
		}
	}

	public string Code
	{
		get
		{
			return _code;
		}
		set
		{
			if (_code != value || string.IsNullOrEmpty(value))
			{
				_code = value;
				OnPropertyChanged("Code");
			}
		}
	}

	public string ActionButtonText
	{
		get
		{
			return _actionButtonText;
		}
		set
		{
			if (_actionButtonText != value)
			{
				_actionButtonText = value;
				OnPropertyChanged("ActionButtonText");
			}
		}
	}

	public bool IsReadOnly
	{
		get
		{
			return _isReadOnly;
		}
		set
		{
			if (_isReadOnly != value)
			{
				_isReadOnly = value;
				OnPropertyChanged("IsReadOnly");
			}
		}
	}

	public bool ValidateNow
	{
		get
		{
			return _validateNow;
		}
		set
		{
			if (_validateNow != value)
			{
				_validateNow = value;
				OnPropertyChanged("ValidateNow");
			}
		}
	}

	public bool ManualValidationError
	{
		get
		{
			return _manualValidationError;
		}
		set
		{
			if (_manualValidationError != value)
			{
				_manualValidationError = value;
				OnPropertyChanged("ManualValidationError");
				CommandManager.InvalidateRequerySuggested();
			}
		}
	}

	public bool HasText
	{
		get
		{
			return _hasText;
		}
		set
		{
			if (_hasText != value)
			{
				_hasText = value;
				OnPropertyChanged("HasText");
				CommandManager.InvalidateRequerySuggested();
			}
		}
	}

	public bool HasValidationError
	{
		get
		{
			return _hasValidationError;
		}
		set
		{
			if (_hasValidationError != value)
			{
				_hasValidationError = value;
				OnPropertyChanged("HasValidationError");
				CommandManager.InvalidateRequerySuggested();
			}
		}
	}

	public ICommand BackCommand { get; }

	public ICommand ActionCommand { get; }

	public HITSDialogViewModel()
	{
		BackCommand = new RelayCommand(ExecuteBack);
		ActionCommand = new RelayCommand(ExecuteAction, CanExecuteAction);
		Messenger.Instance.Subscribe<ShowHITSCodeImportDialog>(OnShowImportDialog);
		Messenger.Instance.Subscribe<ShowHITSCodeShareDialog>(OnShowShareDialog);
	}

	private void OnShowImportDialog(ShowHITSCodeImportDialog message)
	{
		ShowImportDialog(message.OnImportCallback);
	}

	private void OnShowShareDialog(ShowHITSCodeShareDialog message)
	{
		ShowShareDialog(message.Code);
	}

	public void ShowShareDialog(string code)
	{
		_isShareMode = true;
		Title = Resources.Share_HITS_Code_Title;
		Description = Resources.Share_HITS_Code_Description;
		HelperText = Resources.Share_HITS_Code_Helper_Text;
		ActionButtonText = Resources.Share_HITS_Code_Button_Text.ToUpper();
		Code = code;
		IsReadOnly = true;
		IsVisible = true;
	}

	public void ShowImportDialog(Func<string, bool> onImport)
	{
		_isShareMode = false;
		_onImport = onImport;
		Title = Resources.Import_With_HITS_Code_Title;
		Description = Resources.Import_With_HITS_Code_Description;
		HelperText = Resources.Import_With_HITS_Code_Helper_Text;
		ActionButtonText = Resources.Import_With_HITS_Code_Button_Text.ToUpper();
		Code = string.Empty;
		HasText = false;
		ManualValidationError = false;
		HasValidationError = false;
		IsReadOnly = false;
		IsVisible = true;
	}

	private void TriggerCodeValidation()
	{
		ValidateNow = !ValidateNow;
	}

	private void ExecuteBack()
	{
		Code = string.Empty;
		HasText = false;
		ManualValidationError = false;
		HasValidationError = false;
		IsVisible = false;
		_onImport = null;
	}

	private bool CanExecuteAction()
	{
		if (!_isShareMode)
		{
			if (HasText && !ManualValidationError)
			{
				return !HasValidationError;
			}
			return false;
		}
		return true;
	}

	private void ExecuteAction()
	{
		if (_isShareMode)
		{
			Clipboard.SetText(Code);
			IsVisible = false;
			Code = string.Empty;
			_onImport = null;
			return;
		}
		ManualValidationError = false;
		HasValidationError = false;
		TriggerCodeValidation();
		Application.Current.Dispatcher.Invoke(delegate
		{
		}, DispatcherPriority.DataBind);
		if (!HasValidationError)
		{
			if (_onImport != null && !_onImport(Code?.Trim()))
			{
				ManuallyFailCodeValidation();
				return;
			}
			IsVisible = false;
			Code = string.Empty;
			ManualValidationError = false;
			HasValidationError = false;
			_onImport = null;
		}
	}

	private void ManuallyFailCodeValidation()
	{
		ManualValidationError = true;
		TriggerCodeValidation();
	}

	public void Dispose()
	{
		Messenger.Instance.Unsubscribe<ShowHITSCodeImportDialog>(OnShowImportDialog);
		Messenger.Instance.Unsubscribe<ShowHITSCodeShareDialog>(OnShowShareDialog);
	}
}
