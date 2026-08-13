using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Threading;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Components;

public class DPITable : UserControl, IComponentConnector, IStyleConnector
{
	private string _focusedItemText;

	private bool _canForceSelectAll;

	private DispatcherTimer _mouseWheelScrollResetTimer;

	private const int _mouseWheelScrollMin = 100;

	private const int _mouseWheelScrollMinStep = 100;

	private const int _mouseWheelScrollGain = 50;

	private const int _mouseWheelScrollMax = 1000;

	private int _mouseWheelScrollStep = 100;

	private TextBox _mouseWheelActiveInput;

	private OnboardMemoryManager.Models.Profile _profileModel;

	public static DependencyProperty ProfileModelProperty = DependencyProperty.Register("ProfileModel", typeof(OnboardMemoryManager.Models.Profile), typeof(DPITable), new PropertyMetadata(null, onProfileModelPropertyChanged));

	public static readonly DependencyProperty IsAdvancedProperty = DependencyProperty.Register("IsAdvanced", typeof(bool), typeof(DPITable), new PropertyMetadata(OnIsAdvancedPropertyChanged));

	public static readonly DependencyProperty SupportDPIYProperty = DependencyProperty.Register("SupportDPIY", typeof(bool), typeof(DPITable));

	public static readonly DependencyProperty SupportLODProperty = DependencyProperty.Register("SupportLOD", typeof(bool), typeof(DPITable));

	internal ComboSelect SlotsCombo;

	internal Label XAxisLabel;

	internal ListBox DPIXListBox;

	private bool _contentLoaded;

	public OnboardMemoryManager.Models.Profile ProfileModel
	{
		get
		{
			return GetValue(ProfileModelProperty) as OnboardMemoryManager.Models.Profile;
		}
		set
		{
			if (value == _profileModel)
			{
				return;
			}
			SetValue(ProfileModelProperty, value);
			_profileModel = value;
			HIDProfile hidProfileModel = _profileModel as HIDProfile;
			if (hidProfileModel == null)
			{
				return;
			}
			IsAdvanced = hidProfileModel.Advanced;
			SupportDPIY = hidProfileModel.SupportsDPIY;
			SupportLOD = hidProfileModel.SupportsLOD;
			LiftOffDistances = new List<string>
			{
				string.Format(OnboardMemoryManager.Properties.Resources.LiftOffDistance_Low),
				string.Format(OnboardMemoryManager.Properties.Resources.LiftOffDistance_Medium),
				string.Format(OnboardMemoryManager.Properties.Resources.LiftOffDistance_High)
			};
			SlotsCombo.Items.Clear();
			int num = 0;
			System.Action refreshDpiSlotCountSelection = delegate
			{
				int num2 = 0;
				using (IEnumerator<DPI> enumerator2 = hidProfileModel.DPIs.GetEnumerator())
				{
					while (enumerator2.MoveNext() && enumerator2.Current.Enabled)
					{
						num2++;
					}
				}
				if (num2 != 0)
				{
					SlotsCombo.SelectedIndex = num2 - 1;
				}
			};
			hidProfileModel.DPIs.CollectionChanged += delegate
			{
				refreshDpiSlotCountSelection();
			};
			foreach (DPI dPI in hidProfileModel.DPIs)
			{
				_ = dPI;
				if (num < 1)
				{
					SlotsCombo.Items.Add(string.Format(OnboardMemoryManager.Properties.Resources.Slot_Count_Singular));
				}
				else
				{
					SlotsCombo.Items.Add(string.Format(OnboardMemoryManager.Properties.Resources.Slot_Count_Plural, num + 1));
				}
				num++;
			}
			DPIXListBox.ItemsSource = hidProfileModel.DPIs;
			refreshDpiSlotCountSelection();
			_profileModel.PropertyChanged += delegate(object _sender, PropertyChangedEventArgs _e)
			{
				if (_e.PropertyName == "Advanced")
				{
					HIDProfile hIDProfile = _sender as HIDProfile;
					if (_sender != null)
					{
						IsAdvanced = hIDProfile.Advanced;
					}
				}
			};
		}
	}

	public bool IsAdvanced
	{
		get
		{
			return (bool)GetValue(IsAdvancedProperty);
		}
		set
		{
			SetValue(IsAdvancedProperty, value);
		}
	}

	public bool SupportDPIY
	{
		get
		{
			return (bool)GetValue(SupportDPIYProperty);
		}
		set
		{
			SetValue(SupportDPIYProperty, value);
		}
	}

	public bool SupportLOD
	{
		get
		{
			return (bool)GetValue(SupportLODProperty);
		}
		set
		{
			SetValue(SupportLODProperty, value);
		}
	}

	public List<string> LiftOffDistances { get; set; }

	public DPITable()
	{
		InitializeComponent();
	}

	public void OnSlotsSelected(object sender, SelectionChangedEventArgs e)
	{
		if (!(sender is ComboBox { SelectedIndex: var selectedIndex }) || selectedIndex < 0 || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			bool flag = dPI.Order <= selectedIndex;
			if (dPI.Enabled != flag)
			{
				dPI.Enabled = flag;
				hIDProfile.Dirty = true;
				if (dPI.IsDPIShift)
				{
					SetGShift(hIDProfile.DPIs.ElementAt(selectedIndex));
				}
				if (dPI.IsDefault)
				{
					SetDefault(hIDProfile.DPIs.First());
				}
				if (dPI.Selected)
				{
					SetActive(hIDProfile.DPIs.First());
				}
			}
		}
	}

	public void OnTextBoxGotFocus(object sender, RoutedEventArgs e)
	{
		TextBox textBox = e.Source as TextBox;
		if (textBox != null)
		{
			_ = Application.Current;
			_focusedItemText = textBox.Text;
			if (textBox.Text == OnboardMemoryManager.Properties.Resources.Empty)
			{
				textBox.Text = "";
			}
			_canForceSelectAll = true;
			textBox.Dispatcher.BeginInvoke((System.Action)delegate
			{
				textBox.SelectAll();
			});
			DispatcherTimer timer = new DispatcherTimer
			{
				Interval = TimeSpan.FromMilliseconds(500.0)
			};
			timer.Start();
			timer.Tick += delegate
			{
				timer.Stop();
				_canForceSelectAll = false;
			};
		}
	}

	public void OnTextBoxSelectionChanged(object sender, RoutedEventArgs e)
	{
		if (e.Source is TextBox textBox && textBox.SelectionLength != textBox.Text.Count() && _canForceSelectAll)
		{
			textBox.SelectAll();
			_canForceSelectAll = false;
		}
	}

	public void OnTextBoxLostFocus(object sender, RoutedEventArgs e)
	{
		HandleUserInput(e.Source);
		_focusedItemText = "";
	}

	public void OnTextBoxKeyUp(object sender, KeyEventArgs e)
	{
		_ = e.Key;
		_ = 6;
		if (e.Key == Key.Escape)
		{
			TextBox textBox = e.Source as TextBox;
			textBox.Text = _focusedItemText;
			HandleUserInput(textBox);
			Keyboard.ClearFocus();
		}
	}

	public void OnOptionsButtonClick(object sender, RoutedEventArgs e)
	{
		Button button = sender as Button;
		button.ContextMenu.PlacementTarget = button;
		button.ContextMenu.IsOpen = true;
	}

	public void OnMouseWheel(object sender, MouseWheelEventArgs e)
	{
		if (!(sender is TextBox textBox))
		{
			return;
		}
		bool num = IsDPIXTextBox(sender);
		bool flag = IsDPIYTextBox(sender);
		if ((!num && !flag) || !textBox.IsFocused)
		{
			return;
		}
		if (_mouseWheelActiveInput != null && textBox != _mouseWheelActiveInput)
		{
			mouseWheelValueScrollingUnlock(_mouseWheelActiveInput);
		}
		_mouseWheelActiveInput = textBox;
		if (!int.TryParse(textBox.Text, out var result))
		{
			return;
		}
		if (_mouseWheelScrollResetTimer == null)
		{
			_mouseWheelScrollResetTimer = new DispatcherTimer();
			_mouseWheelScrollResetTimer.Tick += delegate
			{
				mouseWheelValueScrollingUnlock(_mouseWheelActiveInput);
			};
			_mouseWheelScrollResetTimer.Interval = TimeSpan.FromMilliseconds(500.0);
		}
		_mouseWheelScrollResetTimer.Start();
		if (_mouseWheelActiveInput.DataContext is DPI dPI)
		{
			result += (int)Math.Round((double)_mouseWheelScrollStep / 100.0, 0) * 100 * Math.Sign(e.Delta);
			textBox.Text = dPI.FindNearestValid(result, flag).ToString();
			_mouseWheelScrollStep += 50;
			_mouseWheelScrollStep = Math.Min(_mouseWheelScrollStep, 1000);
			e.Handled = true;
		}
	}

	private void mouseWheelValueScrollingUnlock(TextBox activeInput = null)
	{
		if (activeInput == null)
		{
			activeInput = _mouseWheelActiveInput;
		}
		if (activeInput != null)
		{
			bool num = _mouseWheelScrollStep != 100;
			_mouseWheelScrollStep = 100;
			if (num)
			{
				_mouseWheelScrollResetTimer.Start();
				return;
			}
			_mouseWheelScrollResetTimer.Stop();
			_mouseWheelActiveInput = null;
			HandleUserInput(activeInput);
		}
	}

	private Button getButtonForMenuItem(object sender)
	{
		if (!(sender is MenuItem menuItem))
		{
			return null;
		}
		if (!(menuItem.Parent is ContextMenu contextMenu))
		{
			return null;
		}
		return contextMenu.PlacementTarget as Button;
	}

	private Border getRowForMenuItem(object sender)
	{
		FrameworkElement frameworkElement = getButtonForMenuItem(sender);
		while (frameworkElement != null && frameworkElement.Name != "DPIRow")
		{
			frameworkElement = frameworkElement.Parent as FrameworkElement;
		}
		if (frameworkElement == null)
		{
			return null;
		}
		return frameworkElement as Border;
	}

	private DPI getDPIModelForMenuItem(object sender)
	{
		Button buttonForMenuItem = getButtonForMenuItem(sender);
		if (buttonForMenuItem == null)
		{
			return null;
		}
		return buttonForMenuItem.DataContext as DPI;
	}

	private DPI getDPIModelForRow(object sender)
	{
		if (!((sender as Border).FindName("DPIOptionsButton") is Button button))
		{
			return null;
		}
		return button.DataContext as DPI;
	}

	private void OnToggleLink(object sender, RoutedEventArgs e)
	{
		if (sender is Button { DataContext: DPI dataContext })
		{
			dataContext.IsLinked = !dataContext.IsLinked;
			if (dataContext.IsLinked)
			{
				dataContext.YValue = dataContext.Value;
			}
		}
	}

	private void OnResetDPIItemClick(object sender, RoutedEventArgs e)
	{
		DPI dPIModelForMenuItem = getDPIModelForMenuItem(sender);
		if (dPIModelForMenuItem == null)
		{
			return;
		}
		Button buttonForMenuItem = getButtonForMenuItem(sender);
		if (buttonForMenuItem != null && ComponentTreeTraversers.FindParent<StackPanel>(buttonForMenuItem) != null)
		{
			if (dPIModelForMenuItem.Value != dPIModelForMenuItem.SavedValue)
			{
				dPIModelForMenuItem.Value = dPIModelForMenuItem.SavedValue;
			}
			if (dPIModelForMenuItem.YValue != dPIModelForMenuItem.SavedYValue)
			{
				dPIModelForMenuItem.YValue = dPIModelForMenuItem.SavedYValue;
			}
			int num = dPIModelForMenuItem.SavedLODValue - 1;
			if (dPIModelForMenuItem.LODValue != num)
			{
				dPIModelForMenuItem.LODValue = num;
			}
		}
	}

	private void OnSetDefaultClick(object sender, RoutedEventArgs e)
	{
		SetDefault(getDPIModelForMenuItem(sender));
	}

	private void SetDefault(DPI dpiModel)
	{
		if (dpiModel == null || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			if (dPI != dpiModel && dPI.IsDefault)
			{
				dPI.IsDefault = false;
				hIDProfile.Dirty = true;
			}
		}
		dpiModel.IsDefault = true;
	}

	private void OnSetGShiftClick(object sender, RoutedEventArgs e)
	{
		SetGShift(getDPIModelForMenuItem(sender));
	}

	private void SetGShift(DPI dpiModel)
	{
		if (dpiModel == null || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			if (dPI != dpiModel && dPI.IsDPIShift)
			{
				dPI.IsDPIShift = false;
				hIDProfile.Dirty = true;
			}
		}
		dpiModel.IsDPIShift = true;
	}

	private void OnSetActiveClick(object sender, RoutedEventArgs e)
	{
		SetActive(getDPIModelForMenuItem(sender));
	}

	private void SetActive(DPI dpiModel)
	{
		if (dpiModel == null || !dpiModel.Enabled || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		HIDMouse device = _profileModel.Device as HIDMouse;
		if (device == null)
		{
			return;
		}
		int index = hIDProfile.DPIs.IndexOf(dpiModel) + 1;
		if (!device.IsInHostMode)
		{
			Task.Run(async delegate
			{
				await device.SetCurrentDPI(index);
			}, device.CancellationTokenSrc.Token);
		}
	}

	private static void onProfileModelPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as DPITable).ProfileModel = e.NewValue as OnboardMemoryManager.Models.Profile;
	}

	private static void OnIsAdvancedPropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		(sender as DPITable).IsAdvanced = (bool)e.NewValue;
	}

	private bool IsDPIXTextBox(object element)
	{
		if (!(element is TextBox textBox))
		{
			return false;
		}
		return textBox.Name == "DPIXTextBox";
	}

	private bool IsDPIYTextBox(object element)
	{
		if (!(element is TextBox textBox))
		{
			return false;
		}
		return textBox.Name == "DPIYTextBox";
	}

	private void HandleUserInput(object element)
	{
		if (!(element is TextBox textBox))
		{
			return;
		}
		bool flag = IsDPIXTextBox(element);
		bool flag2 = IsDPIYTextBox(element);
		if (!flag && !flag2)
		{
			return;
		}
		_ = Application.Current;
		string text = textBox.Text;
		bool flag3 = text.Trim() == "" || text.Trim() == OnboardMemoryManager.Properties.Resources.Empty;
		int result;
		bool flag4 = int.TryParse(text, out result);
		bool flag5 = text.Any(char.IsLetter);
		bool flag6 = Regex.IsMatch(text, "[^a-zA-Z0-9\\s]");
		if (!(textBox.DataContext is DPI dPI) || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		if (flag5 || flag6 || flag3)
		{
			textBox.Text = (dPI.Enabled ? dPI.Value.ToString() : OnboardMemoryManager.Properties.Resources.Empty);
			Validation.ClearInvalid(textBox.GetBindingExpression(TextBox.TextProperty));
		}
		if (dPI.Value == dPI.SavedValue && dPI.YValue == dPI.SavedYValue && dPI.LODValue == dPI.SavedLODValue)
		{
			return;
		}
		if (flag4)
		{
			int num = dPI.FindNearestValid(result, flag2);
			if (num > 0)
			{
				if (flag)
				{
					dPI.Value = num;
					if (dPI.IsLinked)
					{
						dPI.YValue = dPI.Value;
					}
				}
				else if (flag2)
				{
					dPI.YValue = num;
				}
				dPI.Enabled = true;
				hIDProfile.Dirty = true;
				textBox.Text = num.ToString();
			}
			if (_profileModel?.Device is HIDMouse hIDMouse)
			{
				dPI.Selected = dPI.Order == hIDMouse.CurrentDPIIndex;
			}
		}
		else
		{
			textBox.Text = (dPI.Enabled ? dPI.Value.ToString() : OnboardMemoryManager.Properties.Resources.Empty);
		}
	}

	public string Validate()
	{
		return "";
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/dpitable.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	internal Delegate _CreateDelegate(Type delegateType, string handler)
	{
		return Delegate.CreateDelegate(delegateType, this, handler);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			SlotsCombo = (ComboSelect)target;
			break;
		case 2:
			XAxisLabel = (Label)target;
			break;
		case 3:
			DPIXListBox = (ListBox)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 4:
			((TextBox)target).SelectionChanged += OnTextBoxSelectionChanged;
			((TextBox)target).MouseWheel += OnMouseWheel;
			((TextBox)target).KeyUp += OnTextBoxKeyUp;
			((TextBox)target).GotFocus += OnTextBoxGotFocus;
			((TextBox)target).LostFocus += OnTextBoxLostFocus;
			break;
		case 5:
			((Button)target).Click += OnToggleLink;
			break;
		case 6:
			((TextBox)target).SelectionChanged += OnTextBoxSelectionChanged;
			((TextBox)target).MouseWheel += OnMouseWheel;
			((TextBox)target).KeyUp += OnTextBoxKeyUp;
			((TextBox)target).GotFocus += OnTextBoxGotFocus;
			((TextBox)target).LostFocus += OnTextBoxLostFocus;
			break;
		case 7:
			((Button)target).Click += OnOptionsButtonClick;
			break;
		case 8:
			((MenuItem)target).Click += OnSetActiveClick;
			break;
		case 9:
			((MenuItem)target).Click += OnSetDefaultClick;
			break;
		case 10:
			((MenuItem)target).Click += OnSetGShiftClick;
			break;
		case 11:
			((MenuItem)target).Click += OnResetDPIItemClick;
			break;
		}
	}
}
