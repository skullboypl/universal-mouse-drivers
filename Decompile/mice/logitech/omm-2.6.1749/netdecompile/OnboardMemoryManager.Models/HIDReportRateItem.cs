using System.ComponentModel;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDReportRateItem : ReportRateItem, INotifyPropertyChanged
{
	public event PropertyChangedEventHandler PropertyChanged;

	public void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public HIDReportRateItem(HIDProfile hidProfile, string title, ReportRate reportRate)
	{
		//IL_0007: Unknown result type (might be due to invalid IL or missing references)
		base.Rate = reportRate;
		base.Title = title;
	}
}
