using System;
using System.Windows.Forms;
using CustomControlLibrary;
using DriverLib;

namespace Mouse_Drive_Beta.FileManager;

public class BatteryHandle
{
	public delegate void BatteryChangeEventHandler(object sender, CustomEventArgs e);

	public static byte DisplayPercentage = 0;

	private bool SystemHide;

	private bool IsCharge;

	private bool IsBatVol;

	private bool LowBattery;

	private bool SupChgBat;

	private byte FactPercentage;

	private int FullBatteryCount;

	private int DisconnectCount;

	public static int[] BatVoltage = new int[21]
	{
		3050, 3420, 3480, 3540, 3600, 3660, 3720, 3760, 3800, 3840,
		3880, 3920, 3940, 3960, 3980, 4000, 4020, 4040, 4060, 4080,
		4110
	};

	private Timer Level1Timer;

	private Timer Level2Timer;

	private Timer GetBatteryTimer;

	private bool Level1Enable;

	private bool Level2Enable;

	public event BatteryChangeEventHandler BatteryChange;

	public void SetInitBattery(byte lastLevel, BatteryStatus batteryStatus, int sec, int[] batVol, bool supChgBat, int level1, int level2)
	{
		byte b = 0;
		b = (FactPercentage = batteryStatus.level);
		IsCharge = batteryStatus.isCharging == 1;
		IsBatVol = batteryStatus.BatVoltage > 0;
		SupChgBat = supChgBat;
		if (batVol != null && batVol.Length >= BatVoltage.Length)
		{
			for (int i = 0; i < BatVoltage.Length; i++)
			{
				BatVoltage[i] = batVol[i];
			}
		}
		if (IsBatVol)
		{
			b = (FactPercentage = BatVoltageToLevel(batteryStatus));
		}
		DisplayPercentage = CalculationBattery(lastLevel, b, sec);
		if (Level2Timer == null)
		{
			Level2Timer = new Timer();
			Level2Timer.Interval = level2;
			Level2Timer.Tick += Level2Timer_Tick;
			Level2Timer.Start();
		}
		if (Level1Timer == null)
		{
			Level1Timer = new Timer();
			Level1Timer.Interval = level1;
			Level1Timer.Tick += Level1Timer_Tick;
			Level1Timer.Start();
		}
		if (GetBatteryTimer == null && IsBatVol)
		{
			GetBatteryTimer = new Timer();
			GetBatteryTimer.Interval = 5000;
			GetBatteryTimer.Tick += GetBatteryTimer_Tick;
			GetBatteryTimer.Start();
		}
		if (DisplayPercentage > 95 && IsCharge)
		{
			Level2Enable = false;
		}
		else
		{
			Level1Enable = true;
		}
		this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
	}

	private void GetBatteryTimer_Tick(object sender, EventArgs e)
	{
		if (!SystemHide)
		{
			if (DisconnectCount < 20)
			{
				DisconnectCount++;
			}
			if (DisconnectCount < 12)
			{
				UsbServer.ReadBatteryLevel();
			}
		}
	}

	private void Level1Timer_Tick(object sender, EventArgs e)
	{
		_ = DateTime.Now;
		if (!Level1Enable)
		{
			return;
		}
		if (IsCharge)
		{
			if (FactPercentage > DisplayPercentage && FactPercentage < 100)
			{
				if (FactPercentage - 10 > DisplayPercentage)
				{
					DisplayPercentage++;
				}
				if (DisplayPercentage >= 85)
				{
					Level1Enable = false;
					Level2Enable = true;
				}
			}
		}
		else if (FactPercentage < DisplayPercentage && DisplayPercentage > 0)
		{
			DisplayPercentage--;
		}
		this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
	}

	private void Level2Timer_Tick(object sender, EventArgs e)
	{
		if (Level2Enable)
		{
			if (DisplayPercentage < 99 && IsCharge)
			{
				DisplayPercentage++;
			}
			if (DisplayPercentage > 100)
			{
				DisplayPercentage = 100;
			}
			this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
		}
	}

	public void Exit()
	{
		Level1Timer.Enabled = false;
		Level2Timer.Enabled = false;
		Level1Enable = false;
		Level2Enable = false;
		Level1Timer.Stop();
		Level2Timer.Stop();
		Level1Timer = null;
		Level2Timer = null;
		if (IsBatVol)
		{
			GetBatteryTimer.Enabled = false;
			GetBatteryTimer.Stop();
			GetBatteryTimer = null;
		}
	}

	public void SetDisplayPercentage(BatteryStatus batteryStatus)
	{
		byte b = 0;
		DisconnectCount = 0;
		b = ((!IsBatVol) ? (FactPercentage = batteryStatus.level) : (FactPercentage = BatVoltageToLevel(batteryStatus)));
		IsCharge = batteryStatus.isCharging == 1;
		if (DisplayPercentage >= 85 && b >= 95 && IsCharge)
		{
			if (Level1Enable)
			{
				Level1Enable = false;
			}
			if (!Level2Enable)
			{
				Level2Enable = true;
			}
		}
		else
		{
			if (!Level1Enable)
			{
				Level1Enable = true;
			}
			if (Level2Enable)
			{
				Level2Enable = false;
			}
		}
		if (!IsCharge)
		{
			FullBatteryCount = 0;
			if (batteryStatus.level == 0)
			{
				DisplayPercentage = 0;
			}
			if (DisplayPercentage < 15)
			{
				this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
			}
			else if (batteryStatus.level <= 15 && !LowBattery)
			{
				LowBattery = true;
				DisplayPercentage = 15;
				this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
			}
			if (!SupChgBat)
			{
				return;
			}
			if (b > DisplayPercentage)
			{
				if (b - DisplayPercentage >= 30)
				{
					DisplayPercentage = b;
				}
			}
			else if (DisplayPercentage - b >= 30)
			{
				DisplayPercentage = b;
			}
			return;
		}
		LowBattery = false;
		if (batteryStatus.level == 100)
		{
			if (FullBatteryCount < 10)
			{
				FullBatteryCount++;
				UsbServer.ReadBatteryLevel();
			}
			if (FullBatteryCount == 8)
			{
				DisplayPercentage = 100;
				this.BatteryChange?.Invoke(this, new CustomEventArgs(DisplayPercentage));
			}
		}
		else
		{
			FullBatteryCount = 0;
		}
	}

	public static byte BatVoltageToLevel(BatteryStatus batteryStatus)
	{
		byte b = 0;
		int num = 0;
		int num2 = -1;
		int batVoltage = batteryStatus.BatVoltage;
		if (batVoltage >= BatVoltage[BatVoltage.Length - 1])
		{
			b = (byte)((batteryStatus.isCharging != 1) ? 100 : 99);
		}
		else
		{
			for (int i = 0; i < BatVoltage.Length; i++)
			{
				if (batVoltage < BatVoltage[i])
				{
					num2 = i;
					break;
				}
			}
			if (num2 != -1)
			{
				if (num2 == 0)
				{
					b = 0;
				}
				else
				{
					num = (BatVoltage[num2] - BatVoltage[num2 - 1]) / 5;
					b = (byte)((batVoltage - BatVoltage[num2 - 1]) / num + (num2 - 1) * 5);
				}
				if (b == 0 || b == 15)
				{
					b++;
				}
			}
		}
		return b;
	}

	public static void SetBatVoltage(int[] batVol)
	{
		if (batVol != null && batVol.Length >= BatVoltage.Length)
		{
			for (int i = 0; i < BatVoltage.Length; i++)
			{
				BatVoltage[i] = batVol[i];
			}
		}
	}

	private byte CalculationBattery(byte lastLevel, byte factPercentage, int sec)
	{
		byte b = 0;
		byte b2 = 0;
		byte b3 = 0;
		if (sec > 1800)
		{
			return factPercentage;
		}
		if (sec < 60)
		{
			return lastLevel;
		}
		b2 = (byte)(0.028 * (double)sec);
		b2 = (byte)((b2 + lastLevel > 100) ? 100u : ((uint)(b2 + lastLevel)));
		b3 = (byte)(0.014 * (double)sec);
		b3 = (byte)((b3 <= lastLevel) ? ((byte)((lastLevel - b3 >= 0) ? ((uint)(lastLevel - b3)) : 0u)) : 0);
		if (factPercentage > b2)
		{
			return b2;
		}
		if (factPercentage < b3)
		{
			return b3;
		}
		return lastLevel;
	}

	public void SetSystemHide(bool systemHide)
	{
		SystemHide = systemHide;
	}
}
