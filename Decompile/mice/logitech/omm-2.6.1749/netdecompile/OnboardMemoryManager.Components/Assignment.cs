using System;
using System.CodeDom.Compiler;
using System.Collections;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using OnboardMemoryManager.Models;

namespace OnboardMemoryManager.Components;

public class Assignment : UserControl, IComponentConnector
{
	public static DependencyProperty IsRecordingProperty = DependencyProperty.Register("IsRecording", typeof(bool), typeof(Assignment), new PropertyMetadata(onIsRecordingChanged));

	public static DependencyProperty ItemsSourceProperty = DependencyProperty.Register("ItemsSource", typeof(IEnumerable), typeof(Assignment), new PropertyMetadata(onItemSourceChanged));

	public static DependencyProperty SelectedValueProperty = DependencyProperty.Register("SelectedValue", typeof(object), typeof(Assignment), new PropertyMetadata(onSelectedValueChanged));

	internal ComboSelect ComboSelectComponent;

	private bool _contentLoaded;

	public bool IsRecording
	{
		get
		{
			return (bool)GetValue(IsRecordingProperty);
		}
		set
		{
			SetValue(IsRecordingProperty, value);
			if (value)
			{
				RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldLockEvent));
			}
			else
			{
				RaiseEvent(new RoutedEventArgs(MainWindow.OnInterfaceShouldUnlockEvent));
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
			OnPropertyChanged("ItemsSource");
		}
	}

	public object SelectedValue
	{
		get
		{
			return GetValue(SelectedValueProperty);
		}
		set
		{
			SetValue(SelectedValueProperty, value);
			OnPropertyChanged("Title");
			OnPropertyChanged("SelectedValue");
		}
	}

	public bool StandardKeyPopulated
	{
		get
		{
			//IL_0015: Unknown result type (might be due to invalid IL or missing references)
			//IL_001f: Invalid comparison between Unknown and I4
			//IL_0027: Unknown result type (might be due to invalid IL or missing references)
			//IL_002d: Invalid comparison between Unknown and I4
			if (SelectedValue is HIDAction hIDAction && (int)hIDAction.Macro.button_behavior == 128 && (int)hIDAction.Macro.remapping_opcode == 2)
			{
				return hIDAction.Macro.key_code != 0;
			}
			return false;
		}
	}

	public event PropertyChangedEventHandler PropertyChanged;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public Assignment()
	{
		InitializeComponent();
		base.Loaded += onAssignmentLoaded;
	}

	private void onAssignmentLoaded(object sender, RoutedEventArgs e)
	{
	}

	private static void onIsRecordingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Assignment).IsRecording = (bool)e.NewValue;
	}

	private static void onItemSourceChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Assignment).ItemsSource = (IEnumerable)e.NewValue;
	}

	private static void onSelectedValueChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
	{
		(d as Assignment).SelectedValue = e.NewValue;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/assignment.xaml", UriKind.Relative);
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
		if (connectionId == 1)
		{
			ComboSelectComponent = (ComboSelect)target;
		}
		else
		{
			_contentLoaded = true;
		}
	}
}
