using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace OnboardMemoryManager;

public class CustomConfirmationDialogPage : Page, IComponentConnector
{
	internal Button CancelButton;

	internal Button RestoreButton;

	private bool _contentLoaded;

	public event RoutedEventHandler CancelClicked;

	public event RoutedEventHandler RestoreClick;

	public CustomConfirmationDialogPage()
	{
		InitializeComponent();
	}

	private void CancelButton_Click(object sender, RoutedEventArgs e)
	{
		this.CancelClicked?.Invoke(this, e);
	}

	private void Restore_Click(object sender, RoutedEventArgs e)
	{
		this.RestoreClick?.Invoke(this, e);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/pages/restoredefaultsconfirmationpage.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			CancelButton = (Button)target;
			CancelButton.Click += CancelButton_Click;
			break;
		case 2:
			RestoreButton = (Button)target;
			RestoreButton.Click += Restore_Click;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
