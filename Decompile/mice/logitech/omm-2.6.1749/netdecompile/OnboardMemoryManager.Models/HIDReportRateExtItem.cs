using System.ComponentModel;
using logi.hidppio;

namespace OnboardMemoryManager.Models;

public class HIDReportRateExtItem : ReportRateExtItem, INotifyPropertyChanged
{
	private HIDProfile _hidProfile;

	public event PropertyChangedEventHandler PropertyChanged;

	public void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	public HIDReportRateExtItem(HIDProfile hidProfile, string title, ReportRateExtended reportRateExt)
	{
		//IL_0015: Unknown result type (might be due to invalid IL or missing references)
		_hidProfile = hidProfile;
		base.Title = title;
		base.ReportRateExt = reportRateExt;
	}
}
