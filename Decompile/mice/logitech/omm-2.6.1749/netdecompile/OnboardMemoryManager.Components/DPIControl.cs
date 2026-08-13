using System;
using System.CodeDom.Compiler;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
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

public class DPIControl : UserControl, IComponentConnector, IStyleConnector
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

	public new static readonly DependencyProperty IsEnabledProperty = DependencyProperty.Register("IsEnabled", typeof(bool), typeof(DPIControl), new PropertyMetadata(OnIsEnabledPropertyChanged));

	private OnboardMemoryManager.Models.Profile _profileModel;

	public static DependencyProperty ProfileModelProperty = DependencyProperty.Register("ProfileModel", typeof(OnboardMemoryManager.Models.Profile), typeof(DPIControl), new PropertyMetadata(null, onProfileModelPropertyChanged));

	public static readonly DependencyProperty ItemsSourceProperty = DependencyProperty.Register("ItemsSource", typeof(IEnumerable), typeof(DPIControl), new PropertyMetadata(OnItemsSourcePropertyChanged));

	public static readonly DependencyProperty DraggableProperty = DependencyProperty.Register("Draggable", typeof(bool), typeof(DPIControl), new PropertyMetadata(false));

	internal ListBox ListBoxControl;

	private bool _contentLoaded;

	public new bool IsEnabled
	{
		get
		{
			return (bool)GetValue(IsEnabledProperty);
		}
		set
		{
			SetValue(IsEnabledProperty, value);
			foreach (TextBox textBox in GetTextBoxes())
			{
				textBox.IsEnabled = value;
			}
		}
	}

	public OnboardMemoryManager.Models.Profile ProfileModel
	{
		get
		{
			return GetValue(ProfileModelProperty) as OnboardMemoryManager.Models.Profile;
		}
		set
		{
			if (value != _profileModel)
			{
				SetValue(ProfileModelProperty, value);
				_profileModel = value;
				if (_profileModel is HIDProfile hIDProfile)
				{
					ItemsSource = hIDProfile.DPIs;
				}
			}
		}
	}

	public IEnumerable ItemsSource
	{
		get
		{
			return (IEnumerable)GetValue(ItemsSourceProperty);
		}
		set
		{
			SetValue(ItemsSourceProperty, value);
		}
	}

	public bool Draggable
	{
		get
		{
			return (bool)GetValue(DraggableProperty);
		}
		set
		{
			SetValue(DraggableProperty, value);
		}
	}

	public DPIControl()
	{
		InitializeComponent();
		base.Loaded += OnDPIControlLoaded;
	}

	public void OnDPIControlLoaded(object sender, RoutedEventArgs e)
	{
		Window window = Window.GetWindow(this);
		if (window != null)
		{
			window.MouseUp += OnWindowMouseUp;
			window.MouseDown += OnWindowMouseDown;
		}
	}

	public void OnTextBoxGotFocus(object sender, RoutedEventArgs e)
	{
		TextBox textBox = e.Source as TextBox;
		if (textBox == null)
		{
			return;
		}
		ListBoxItem listBoxItem = ComponentTreeTraversers.FindParent<ListBoxItem>(textBox);
		if (listBoxItem != null)
		{
			_ = Application.Current;
			_focusedItemText = textBox.Text;
			if (textBox.Text == OnboardMemoryManager.Properties.Resources.Empty)
			{
				textBox.Text = "";
			}
			(listBoxItem.DataContext as DPI).Enabled = true;
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

	public void OnMouseWheel(object sender, MouseWheelEventArgs e)
	{
		if (!(sender is TextBox textBox))
		{
			return;
		}
		ListBoxItem listBoxItem = ComponentTreeTraversers.FindParent<ListBoxItem>(textBox);
		if (listBoxItem == null)
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
		DPI dPI = listBoxItem.DataContext as DPI;
		result += (int)Math.Round((double)_mouseWheelScrollStep / 100.0, 0) * 100 * Math.Sign(e.Delta);
		textBox.Text = dPI.FindNearestValid(result).ToString();
		_mouseWheelScrollStep += 50;
		_mouseWheelScrollStep = Math.Min(_mouseWheelScrollStep, 1000);
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

	public void OnTextBoxLostFocus(object sender, RoutedEventArgs e)
	{
		HandleUserInput(e.Source);
		_focusedItemText = "";
	}

	public void OnTextBoxKeyUp(object sender, KeyEventArgs e)
	{
		if (e.Key == Key.Return)
		{
			List<TextBox> list = GetCurrentOrderTextBoxes().ToList();
			int num = list.Count();
			for (int i = 0; i < num; i++)
			{
				if (!list[i].IsFocused)
				{
					continue;
				}
				if (i < num - 1)
				{
					list[i + 1].Focus();
					break;
				}
				TraversalRequest request = new TraversalRequest(FocusNavigationDirection.Next);
				if (Keyboard.FocusedElement is UIElement uIElement)
				{
					uIElement.MoveFocus(request);
				}
				break;
			}
		}
		if (e.Key == Key.Escape)
		{
			TextBox textBox = e.Source as TextBox;
			textBox.Text = _focusedItemText;
			HandleUserInput(textBox);
			Keyboard.ClearFocus();
		}
	}

	private TextBox getTextBoxForMenuItem(object sender)
	{
		if (!(sender is MenuItem menuItem))
		{
			return null;
		}
		if (!(menuItem.Parent is ContextMenu contextMenu))
		{
			return null;
		}
		return contextMenu.PlacementTarget as TextBox;
	}

	private DPI getDPIModelForMenuItem(object sender)
	{
		TextBox textBoxForMenuItem = getTextBoxForMenuItem(sender);
		if (textBoxForMenuItem == null)
		{
			return null;
		}
		return textBoxForMenuItem.DataContext as DPI;
	}

	private void OnClearDPIItemClick(object sender, RoutedEventArgs e)
	{
		TextBox textBoxForMenuItem = getTextBoxForMenuItem(sender);
		if (textBoxForMenuItem != null)
		{
			textBoxForMenuItem.Text = "";
		}
	}

	private void OnSetDefaultClick(object sender, RoutedEventArgs e)
	{
		DPI dPIModelForMenuItem = getDPIModelForMenuItem(sender);
		if (dPIModelForMenuItem == null || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			if (dPI != dPIModelForMenuItem && dPI.IsDefault)
			{
				dPI.IsDefault = false;
				hIDProfile.Dirty = true;
			}
		}
		dPIModelForMenuItem.IsDefault = true;
	}

	private void OnSetGShiftClick(object sender, RoutedEventArgs e)
	{
		DPI dPIModelForMenuItem = getDPIModelForMenuItem(sender);
		if (dPIModelForMenuItem == null || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		foreach (DPI dPI in hIDProfile.DPIs)
		{
			if (dPI != dPIModelForMenuItem && dPI.IsDPIShift)
			{
				dPI.IsDPIShift = false;
				hIDProfile.Dirty = true;
			}
		}
		dPIModelForMenuItem.IsDPIShift = true;
	}

	private void OnSetActiveClick(object sender, RoutedEventArgs e)
	{
		DPI dPIModelForMenuItem = getDPIModelForMenuItem(sender);
		if (dPIModelForMenuItem == null || !(_profileModel is HIDProfile hIDProfile))
		{
			return;
		}
		HIDMouse device = _profileModel.Device as HIDMouse;
		if (device != null)
		{
			int index = hIDProfile.DPIs.IndexOf(dPIModelForMenuItem) + 1;
			Task.Run(async delegate
			{
				await device.SetCurrentDPI(index);
			}, device.CancellationTokenSrc.Token);
		}
	}

	private void HandleUserInput(object element)
	{
		if (!(element is TextBox textBox))
		{
			return;
		}
		ListBoxItem listBoxItem = ComponentTreeTraversers.FindParent<ListBoxItem>(textBox);
		if (listBoxItem == null)
		{
			return;
		}
		_ = Application.Current;
		string text = textBox.Text;
		DPI dPI = listBoxItem.DataContext as DPI;
		bool flag = text.Trim() == "" || text.Trim() == OnboardMemoryManager.Properties.Resources.Empty;
		int result;
		bool flag2 = int.TryParse(text, out result);
		if (dPI == null)
		{
			return;
		}
		if (flag || flag2)
		{
			int value = dPI.Value;
			if (flag2)
			{
				int num = (dPI.Value = dPI.FindNearestValid(result));
				dPI.Enabled = num > 0;
				textBox.Text = (dPI.Enabled ? dPI.Value.ToString() : OnboardMemoryManager.Properties.Resources.Empty);
			}
			else
			{
				dPI.Value = 0;
				dPI.Enabled = false;
			}
			bool flag3 = false;
			foreach (TextBox orderedTextBox in GetOrderedTextBoxes())
			{
				ListBoxItem listBoxItem2 = ComponentTreeTraversers.FindParent<ListBoxItem>(orderedTextBox);
				if (listBoxItem2 != null && (listBoxItem2.DataContext as DPI).Enabled)
				{
					flag3 = true;
					break;
				}
			}
			if (!flag3 && !dPI.Enabled)
			{
				dPI.Enabled = true;
				dPI.Value = value;
				textBox.Text = dPI.Value.ToString();
			}
			bool flag4 = false;
			bool flag5 = false;
			if (!dPI.Enabled)
			{
				flag4 = dPI.IsDPIShift;
				flag5 = dPI.IsDefault;
				dPI.IsDPIShift = false;
				dPI.IsDefault = false;
			}
			if (_profileModel?.Device is HIDMouse hIDMouse)
			{
				dPI.Selected = dPI.Value == hIDMouse.CurrentDPIIndex;
			}
			int num3 = 0;
			{
				foreach (TextBox orderedTextBox2 in GetOrderedTextBoxes())
				{
					ListBoxItem listBoxItem3 = ComponentTreeTraversers.FindParent<ListBoxItem>(orderedTextBox2);
					if (listBoxItem3 != null)
					{
						listBoxItem3.TabIndex = num3;
						dPI = listBoxItem3.DataContext as DPI;
						dPI.Order = num3;
						if (flag4 && dPI.Enabled)
						{
							dPI.IsDPIShift = true;
							flag4 = false;
						}
						if (flag5 && dPI.Enabled)
						{
							dPI.IsDefault = true;
							flag5 = false;
						}
						num3++;
					}
				}
				return;
			}
		}
		dPI.Enabled = dPI.Value > 0;
		textBox.Text = (dPI.Enabled ? dPI.Value.ToString() : OnboardMemoryManager.Properties.Resources.Empty);
	}

	public string Validate()
	{
		bool flag = false;
		foreach (TextBox orderedTextBox in GetOrderedTextBoxes())
		{
			ListBoxItem listBoxItem = ComponentTreeTraversers.FindParent<ListBoxItem>(orderedTextBox);
			if (listBoxItem != null)
			{
				DPI dPI = listBoxItem.DataContext as DPI;
				if (dPI.Value != 0 && dPI.IsDPIValid(dPI.Value))
				{
					flag = true;
				}
			}
		}
		if (!flag)
		{
			return OnboardMemoryManager.Properties.Resources.Validity_Failed_No_DPI_Value;
		}
		return "";
	}

	private IEnumerable<TextBox> GetTextBoxes()
	{
		return ComponentTreeTraversers.FindVisualChildren<TextBox>(this);
	}

	private IEnumerable<TextBox> GetCurrentOrderTextBoxes()
	{
		return GetTextBoxes().OrderBy(delegate(TextBox item)
		{
			ListBoxItem listBoxItem = ComponentTreeTraversers.FindParent<ListBoxItem>(item);
			return (listBoxItem == null) ? double.PositiveInfinity : ((double)(listBoxItem.DataContext as DPI).Order);
		});
	}

	private IEnumerable<TextBox> GetOrderedTextBoxes()
	{
		return GetTextBoxes().OrderBy(delegate(TextBox item)
		{
			if (int.TryParse(item.Text, out var result))
			{
				return result;
			}
			item.Text = OnboardMemoryManager.Properties.Resources.Empty;
			return double.PositiveInfinity;
		});
	}

	public void OnWindowMouseUp(object sender, MouseButtonEventArgs e)
	{
		DispatcherTimer timer = new DispatcherTimer
		{
			Interval = TimeSpan.FromMilliseconds(200.0)
		};
		timer.Start();
		timer.Tick += delegate
		{
			timer.Stop();
			_canForceSelectAll = false;
		};
	}

	public void OnWindowMouseDown(object sender, MouseButtonEventArgs e)
	{
		bool flag = false;
		foreach (TextBox item in ComponentTreeTraversers.FindVisualChildren<TextBox>(this))
		{
			if (item.IsFocused)
			{
				flag = true;
				HandleUserInput(item);
				_focusedItemText = "";
				FrameworkElement frameworkElement = (FrameworkElement)item.Parent;
				while (frameworkElement != null && frameworkElement != null && !((IInputElement)frameworkElement).Focusable)
				{
					frameworkElement = (FrameworkElement)frameworkElement.Parent;
				}
				FocusManager.SetFocusedElement(FocusManager.GetFocusScope(item), frameworkElement);
				break;
			}
		}
		if (flag)
		{
			Keyboard.ClearFocus();
		}
	}

	private static void OnIsEnabledPropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		(sender as DPIControl).IsEnabled = (bool)e.NewValue;
	}

	private static void onProfileModelPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as DPIControl).ProfileModel = e.NewValue as OnboardMemoryManager.Models.Profile;
	}

	private static void OnItemsSourcePropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
	{
		if (sender is DPIControl dPIControl)
		{
			dPIControl.OnItemsSourceChanged((IEnumerable)e.OldValue, (IEnumerable)e.NewValue);
		}
	}

	private void OnItemsSourceChanged(IEnumerable oldValue, IEnumerable newValue)
	{
		if (oldValue is INotifyCollectionChanged notifyCollectionChanged)
		{
			notifyCollectionChanged.CollectionChanged -= NewValueINotifyCollectionChanged_CollectionChanged;
		}
		if (newValue is INotifyCollectionChanged notifyCollectionChanged2)
		{
			notifyCollectionChanged2.CollectionChanged += NewValueINotifyCollectionChanged_CollectionChanged;
		}
	}

	private void NewValueINotifyCollectionChanged_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
	}

	private void OverlayIconEventForwarder(object sender, MouseButtonEventArgs e)
	{
		if (sender is FrameworkElement child)
		{
			ContentPresenter contentPresenter = ComponentTreeTraversers.FindParent<ContentPresenter>(child);
			if (contentPresenter != null)
			{
				ComponentTreeTraversers.FindVisualChild<TextBox>(contentPresenter)?.RaiseEvent(e);
			}
		}
	}

	private void OnOverlayIconRightClick(object sender, MouseButtonEventArgs e)
	{
		if (!(sender is FrameworkElement child))
		{
			return;
		}
		ContentPresenter contentPresenter = ComponentTreeTraversers.FindParent<ContentPresenter>(child);
		if (contentPresenter != null)
		{
			TextBox textBox = ComponentTreeTraversers.FindVisualChild<TextBox>(contentPresenter);
			if (textBox != null)
			{
				textBox.ContextMenu.IsOpen = true;
			}
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/dpicontrol.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		if (connectionId == 1)
		{
			ListBoxControl = (ListBox)target;
		}
		else
		{
			_contentLoaded = true;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 2:
			((TextBox)target).SelectionChanged += OnTextBoxSelectionChanged;
			((TextBox)target).MouseWheel += OnMouseWheel;
			((TextBox)target).KeyUp += OnTextBoxKeyUp;
			((TextBox)target).GotFocus += OnTextBoxGotFocus;
			((TextBox)target).LostFocus += OnTextBoxLostFocus;
			break;
		case 3:
			((MenuItem)target).Click += OnClearDPIItemClick;
			break;
		case 4:
			((MenuItem)target).Click += OnSetDefaultClick;
			break;
		case 5:
			((MenuItem)target).Click += OnSetGShiftClick;
			break;
		case 6:
			((MenuItem)target).Click += OnSetActiveClick;
			break;
		case 7:
			((StackPanel)target).MouseDown += OverlayIconEventForwarder;
			((StackPanel)target).MouseRightButtonUp += OnOverlayIconRightClick;
			break;
		}
	}
}
