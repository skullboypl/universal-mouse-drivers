using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Resources;
using System.Threading;
using OnboardMemoryManager.Properties;

namespace OnboardMemoryManager.Controllers;

public class LocalesController
{
	public readonly List<LocaleInfo> Locales = new List<LocaleInfo>();

	private List<string> _availableLocales;

	public event PropertyChangedEventHandler PropertyChanged;

	public LocalesController()
	{
		CultureInfo[] cultures = CultureInfo.GetCultures(CultureTypes.AllCultures);
		foreach (string item in ListAvailableLocales())
		{
			CultureInfo[] array = cultures;
			foreach (CultureInfo cultureInfo in array)
			{
				if (cultureInfo.Name == item)
				{
					Locales.Add(new LocaleInfo
					{
						Name = cultureInfo.Name,
						Title = cultureInfo.NativeName.ToUpper()
					});
					break;
				}
			}
		}
		Locales.Sort((LocaleInfo a, LocaleInfo b) => string.Compare(a.Title, b.Title));
	}

	public string GetLocale()
	{
		string name = Thread.CurrentThread.CurrentUICulture.Name;
		string twoLetterISOLanguageName = Thread.CurrentThread.CurrentUICulture.TwoLetterISOLanguageName;
		List<string> list = ListAvailableLocales();
		foreach (string item in list)
		{
			if (item == name)
			{
				return name;
			}
		}
		foreach (string item2 in list)
		{
			if (item2 == twoLetterISOLanguageName)
			{
				return twoLetterISOLanguageName;
			}
		}
		return null;
	}

	public void SetLocale(string Locale)
	{
		CultureInfo currentUICulture = new CultureInfo(Locale);
		Thread.CurrentThread.CurrentUICulture = currentUICulture;
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(Locale));
	}

	public List<string> ListAvailableLocales()
	{
		if (_availableLocales == null)
		{
			_availableLocales = new List<string>();
			ResourceManager resourceManager = new ResourceManager(typeof(Resources));
			CultureInfo[] cultures = CultureInfo.GetCultures(CultureTypes.AllCultures);
			foreach (CultureInfo cultureInfo in cultures)
			{
				try
				{
					if (resourceManager.GetResourceSet(cultureInfo, createIfNotExists: true, tryParents: false) != null && cultureInfo.TwoLetterISOLanguageName != "iv")
					{
						_availableLocales.Add(cultureInfo.Name);
					}
				}
				catch (CultureNotFoundException ex)
				{
					Console.WriteLine(cultureInfo?.ToString() + " is not available or is an invalid culture identifier. " + ex.ToString());
				}
			}
		}
		return _availableLocales;
	}
}
