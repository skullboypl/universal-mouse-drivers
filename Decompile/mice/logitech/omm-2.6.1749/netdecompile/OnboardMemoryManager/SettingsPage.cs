using System;
using System.CodeDom.Compiler;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Web;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Navigation;
using OnboardMemoryManager.Components;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager;

public class SettingsPage : Page, IComponentConnector
{
	private bool initialized;

	public string SelectedLocaleValue;

	internal ComboSelect LocaleCombo;

	private bool _contentLoaded;

	public string SelectedLocale
	{
		get
		{
			return SelectedLocaleValue;
		}
		set
		{
			if (!(SelectedLocaleValue != value))
			{
				return;
			}
			SelectedLocaleValue = value;
			if (initialized)
			{
				try
				{
					(Application.Current as App).LocalesControllerInstance.SetLocale(value);
				}
				catch (CultureNotFoundException ex)
				{
					Console.WriteLine("Unexpected error setting culture. " + ex.ToString());
				}
			}
			OnPropertyChanged("SelectedLocale");
		}
	}

	public static string CurrentVersion
	{
		get
		{
			Version version = Assembly.GetExecutingAssembly().GetName().Version;
			return $"{version.Major}.{version.Minor}.{version.Build}";
		}
	}

	public static Uri UpdateURI
	{
		get
		{
			string arg = OnboardMemoryManager.Properties.Resources.ResourceManager.GetString(RegionalHelpers.Brand + "_Update_URL");
			NameValueCollection nameValueCollection = HttpUtility.ParseQueryString(string.Empty);
			nameValueCollection.Add("version", CurrentVersion);
			return new Uri($"{arg}?{nameValueCollection.ToString()}");
		}
	}

	public string VersionString => string.Format(OnboardMemoryManager.Properties.Resources.Version, CurrentVersion);

	public event PropertyChangedEventHandler PropertyChanged;

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public SettingsPage()
	{
		InitializeComponent();
		App app = Application.Current as App;
		LocaleCombo.ItemsSource = app.LocalesControllerInstance.Locales;
		SelectedLocale = app.LocalesControllerInstance.GetLocale();
		base.Loaded += OnLoaded;
	}

	private void OnLoaded(object sender, RoutedEventArgs e)
	{
		base.Loaded -= OnLoaded;
		initialized = true;
	}

	public void OnLocaleSelected(object sender, SelectionChangedEventArgs e)
	{
		if (initialized)
		{
			MainWindow mainWindow = Application.Current.MainWindow as MainWindow;
			if (mainWindow.Navigation_Frame.CanGoBack)
			{
				mainWindow.Navigation_Frame.GoBack();
			}
		}
	}

	private void Hyperlink_RequestNavigate(object sender, RequestNavigateEventArgs e)
	{
		Process.Start(new ProcessStartInfo(e.Uri.AbsoluteUri));
		e.Handled = true;
	}

	private void BackButton_Clicked(object sender, RoutedEventArgs e)
	{
		(Application.Current.MainWindow as MainWindow).NavigateBack();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/OnboardMemoryManager;component/src/pages/settingspage.xaml", UriKind.Relative);
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
			((Hyperlink)target).RequestNavigate += Hyperlink_RequestNavigate;
			break;
		case 2:
			LocaleCombo = (ComboSelect)target;
			break;
		case 3:
			((Hyperlink)target).RequestNavigate += Hyperlink_RequestNavigate;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
