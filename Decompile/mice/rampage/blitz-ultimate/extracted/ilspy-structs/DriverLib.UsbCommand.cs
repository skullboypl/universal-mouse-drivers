namespace DriverLib;

public struct UsbCommand
{
	public byte ReportId;

	public byte id;

	public byte CommandStatus;

	public int address;

	public byte[] command;

	public byte[] receivedData;
}
