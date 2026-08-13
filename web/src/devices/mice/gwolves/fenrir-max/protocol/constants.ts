/** G-Wolves USB vendor ID (0x33E4) */
export const GWOLVES_VID = 0x33e4;

/** 16-byte dongle/output report command IDs (_c enum from DriverCore) */
export const DongleCommand = {
  EncryptionData: 1,
  PCDriverStatus: 2,
  DeviceOnLine: 3,
  BatteryLevel: 4,
  DongleEnterPair: 5,
  GetPairState: 6,
  WriteFlashData: 7,
  ReadFlashData: 8,
  ClearSetting: 9,
  StatusChanged: 10,
  SetDeviceVidPid: 11,
  SetDeviceDescriptorString: 12,
  EnterUsbUpdateMode: 13,
  GetCurrentConfig: 14,
  SetCurrentConfig: 15,
  ReadCIDMID: 16,
  EnterMTKMode: 17,
  ReadVersionID: 18,
  Set4KDongleRGB: 20,
  Get4KDongleRGBValue: 21,
  SetLongRangeMode: 22,
  GetLongRangeMode: 23,
} as const;

/** EEPROM / config offsets inside device flash (tt enum) */
export const ConfigOffset = {
  ReportRate: 0,
  maxDpiStage: 2,
  CurrentDPI: 4,
  KeyOperation: 8,
  LOD: 10,
  DPIValue: 12,
  DPIColor: 44,
  DebounceTime: 169,
  MotionSync: 171,
  SleepTime: 173,
  Angle: 175,
  Ripple: 177,
} as const;

/** Polling rate Hz → firmware index (new protocol; 16 = 8000 Hz) */
export const POLLING_RATE_TO_INDEX: Record<number, number> = {
  125: 1,
  250: 2,
  500: 3,
  1000: 4,
  2000: 5,
  4000: 6,
  8000: 16,
};

export const INDEX_TO_POLLING_RATE: Record<number, number> = Object.fromEntries(
  Object.entries(POLLING_RATE_TO_INDEX).map(([hz, idx]) => [idx, Number(hz)])
);

/**
 * Old-protocol (IsNewProtocol=0) poll-rate codes used by OEM getPollRate/setPollRate.
 * Source: mouse.xyz UI `Ve()` mapper in DriverCore card code.
 */
export const OLD_POLLING_RATE_TO_CODE: Record<number, number> = {
  125: 8,
  250: 4,
  500: 2,
  1000: 1,
  2000: 32,
  4000: 64,
  8000: 128,
};

export const OLD_CODE_TO_POLLING_RATE: Record<number, number> = Object.fromEntries(
  Object.entries(OLD_POLLING_RATE_TO_CODE).map(([hz, code]) => [code, Number(hz)])
);
