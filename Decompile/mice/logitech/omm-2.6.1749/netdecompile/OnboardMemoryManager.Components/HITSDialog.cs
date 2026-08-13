using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace OnboardMemoryManager.Components;

public class HITSDialog : UserControl, IComponentConnector
{
	internal Grid OverlayGrid;

	internal Grid DialogGrid;

	internal BaseTextBox CodeTextBox;

	private bool _contentLoaded;

	public HITSDialog()
	{
		InitializeComponent();
	}

	private void HITSDialog_Unloaded(object sender, RoutedEventArgs e)
	{
		(base.DataContext as IDisposable)?.Dispose();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/components/hitsdialog.xaml", UriKind.Relative);
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
			((HITSDialog)target).Unloaded += HITSDialog_Unloaded;
			break;
		case 2:
			OverlayGrid = (Grid)target;
			break;
		case 3:
			DialogGrid = (Grid)target;
			break;
		case 4:
			CodeTextBox = (BaseTextBox)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
