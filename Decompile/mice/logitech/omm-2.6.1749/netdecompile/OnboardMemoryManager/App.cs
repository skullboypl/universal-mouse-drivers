using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using Logitech.ComponentModel;
using OnboardMemoryManager.Controllers;

namespace OnboardMemoryManager;

public class App : Application
{
	public readonly LocalesController LocalesControllerInstance = new LocalesController();

	public readonly DevicesController DevicesControllerInstance;

	private bool _contentLoaded;

	public App()
	{
		ObservableObject.Dispatcher = base.Dispatcher;
		base.Dispatcher.UnhandledException += OnDispatcherUnhandledException;
		DevicesControllerInstance = new DevicesController(base.Dispatcher);
	}

	protected override void OnExit(ExitEventArgs e)
	{
		DevicesControllerInstance.Dispose();
		base.OnExit(e);
	}

	private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
	{
		MessageBox.Show($"An unhandled exception occurred: {e.Exception.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Hand);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			base.StartupUri = new Uri("MainWindow.xaml", UriKind.Relative);
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/app.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[STAThread]
	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public static void Main()
	{
		App app = new App();
		app.InitializeComponent();
		app.Run();
	}
}
