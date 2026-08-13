namespace DriverLib;

public enum UsbCommandID
{
	EncryptionData = 1,
	PCDriverStatus = 2,
	DeviceOnLine = 3,
	BatteryLevel = 4,
	DongleEnterPair = 5,
	GetPairState = 6,
	WriteFlashData = 7,
	ReadFlashData = 8,
	ClearSetting = 9,
	StatusChanged = 10,
	SetDeviceVidPid = 11,
	SetDeviceDescriptorString = 12,
	EnterUsbUpdateMode = 13,
	GetCurrentConfig = 14,
	SetCurrentConfig = 15,
	ReadCIDMID = 16,
	EnterMTKMode = 17,
	ReadVersionID = 18,
	Set4KDongleRGB = 20,
	Get4KDongleRGBValue = 21,
	SetLongRangeMode = 22,
	GetLongRangeMode = 23,
	WriteKBCIdMID = 240,
	ReadKBCIdMID = 241
}
