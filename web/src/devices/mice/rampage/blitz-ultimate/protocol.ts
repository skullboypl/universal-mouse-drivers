/**
 * Rampage Blitz Ultimate wire protocol (forked copy — do not import King Ultra protocol) - reverse-engineered from HIDUsb-64.dll + OEM .NET.
 *
 * In-memory queue entry is 20 bytes. OEM UsbServer WriteFile sends 17 bytes
 * from offset +3; on the Blitz Ultimate receiver that maps to:
 *   WriteFile[0] = Report ID 0x08  (HID Output report id=8, payload n=16)
 *   WriteFile[1..16] = command body + checksum
 *
 * Logical frame:
 *   [0] 0x01  [1] 0x01 (TX flag)  [2] aux
 *   [3] 0x08 = report id on wire
 *   [4] UsbCommandID … [19] checksum over [3..18]
 *
 * WebHID: sendReport(8, frame[4..19])  // 16 bytes, no report-id in data
 */

export type ProtocolCommand =
  | { op: 'set_dpi'; stageIndex: number; value: number }
  | { op: 'set_active_dpi'; stageIndex: number }
  | { op: 'set_dpi_stage_count'; count: number }
  | { op: 'set_report_rate'; hz: number }
  | {
      op: 'set_button'
      flashIndex: number
      type: number
      param1: number
      param2: number
    }
  | { op: 'set_debounce'; ms: number; enabled: boolean }
  | { op: 'set_lod'; mm: number }
  | { op: 'set_sensor_mode'; mode: 'lp' | 'hp' | 'corded' }
  | { op: 'set_peak'; enabled: boolean; timeoutMin: number }
  | { op: 'set_sensor_flags'; ripple: boolean; angle: boolean; motionSync: boolean }
  | { op: 'set_sleep'; minutes: number }
  | { op: 'set_long_distance'; enabled: boolean }
  /** CS_UsbServer_GetLongRangeMode / UsbCommandID = 23. */
  | { op: 'get_long_distance' }
  | { op: 'set_profile'; configId: number }
  | { op: 'set_pc_driver'; active: boolean }
  | { op: 'read_encryption' }
  | { op: 'read_info' }
  | { op: 'read_online' }
  | { op: 'read_config' }
  | { op: 'read_flash'; address: number; length: number; allFlag?: number }
  | { op: 'read_flash_all' }
  | { op: 'read_current_dpi' }
  | { op: 'read_report_rate' }
  | { op: 'read_version' }
  /** Mouse firmware — UsbCommandId.ReadVersionID (0x12). */
  | { op: 'read_mouse_version' }
  /** Receiver/dongle firmware — UsbCommandId.GetDongleVersion (0xB3). */
  | { op: 'read_dongle_version' }
  /** @deprecated use read_mouse_version / read_dongle_version */
  | { op: 'read_slave_version' }
  | { op: 'clear_settings' }

/** OEM Language: 0.7mm→3, 1mm→1, 2mm→2 */
export function lodMmToCode(mm: number): number {
  if (mm <= 0.75) return 3
  if (mm <= 1.5) return 1
  return 2
}

export function lodCodeToMm(code: number): 0.7 | 1 | 2 {
  if (code === 3) return 0.7
  if (code === 2) return 2
  return 1
}

/** OEM ModeSelect: LP=0, HP=1, Corded=0x10 */
export function sensorModeToCode(mode: 'lp' | 'hp' | 'corded'): number {
  if (mode === 'hp') return 1
  if (mode === 'corded') return 0x10
  return 0
}

export function sensorModeFromCode(code: number): 'lp' | 'hp' | 'corded' {
  if (code === 0x10) return 'corded'
  if (code === 1) return 'hp'
  return 'lp'
}

/**
 * OEM time combos (FullPerformance / PowerSaveTime): units of 10 seconds.
 * Language XML: 30sec→3, 1min→6, 15min→90, …
 */
export function peakTimeoutToCode(minutes: number): number {
  return Math.max(1, Math.round(minutes * 6))
}

export function peakCodeToMinutes(code: number): number {
  const mins = code / 6
  const steps = [0.5, 1, 2, 5, 10, 15]
  return steps.reduce((best, s) =>
    Math.abs(s - mins) < Math.abs(best - mins) ? s : best,
  )
}

/** Mouse sleep (allLedOffTime / PowerSaveTime) - same 10s units as Peak. */
export function sleepMinutesToCode(minutes: number): number {
  return peakTimeoutToCode(minutes)
}

export function sleepCodeToMinutes(code: number): number {
  // OEM customComboBox_PowerSaveTime values (10s units → minutes).
  const mins = code / 6
  const steps = [
    1 / 6, // 10sec
    0.5, // 30sec
    1, 3, 5, 10, 15, 20, 25, 30, 35, 40,
  ]
  return steps.reduce((best, s) =>
    Math.abs(s - mins) < Math.abs(best - mins) ? s : best,
  )
}

export interface EncodedReport {
  reportId: number
  /**
   * Feature-style payload without reportId (19 bytes = frame[1..19]).
   * Kept for Feature-report fallback.
   */
  data: Uint8Array
  /**
   * OEM WriteFile / HID Output payload (17 bytes = frame[3..19]).
   * This is what actually reaches the mouse in the stock driver.
   */
  outputData: Uint8Array
}

/** Mirror of DriverLib.UsbCommandID */
export const UsbCommandId = {
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
  GetCurrentConfig: 14,
  SetCurrentConfig: 15,
  ReadCIDMID: 16,
  /**
   * CS_UsbServer_ReadVersion / UsbFinder_GetVersion — cmd 0x12.
   * Live King Ultra (F54F): reply maj/min = mouse firmware (OEM "Mouse Firmware ver").
   */
  ReadVersionID: 18,
  /**
   * UsbFinder_GetSlaveVersion — packed as local_30=0xB308 → wire cmd 0xB3.
   * (Enum name SetDeviceVidPid=11 is a different command; 0x0B never replies.)
   * Live King Ultra: reply maj/min = receiver/dongle firmware (OEM "Receiver Firmware ver").
   */
  GetDongleVersion: 0xb3,
  SetLongRangeMode: 22,
  GetLongRangeMode: 23,
} as const

/** MouseConfig flash addresses (value byte; +1 holds pair checksum). */
export const FlashAddr = {
  reportRate: 0x00,
  maxDpi: 0x02,
  currentDpi: 0x04,
  xSpindown: 0x06,
  ySpindown: 0x08,
  silenceHeight: 0x0a,
  dpiStage0: 0x0c,
  /** KeyFunMap[0] type byte; each key is 4 bytes (type,p1,p2,ck). */
  keyFun0: 0x60,
  /** MacroKey[0] packed blob; stride 0x180 (see macroFlash.ts). */
  macroKey0: 0x300,
  keyDebounceTime: 0xa9,
  motionSyncEnable: 0xab,
  allLedOffTime: 0xad,
  linearCorrectionEnable: 0xaf,
  rippleControlEnable: 0xb1,
  moveOffLedEnable: 0xb3,
  sensorCustomSleepEnable: 0xb5,
  sensorSleepTime: 0xb7,
  sensorPowerSavingEnable: 0xb9,
} as const

const REPORT_ID = 0x01
const FRAME_LEN = 20

/**
 * When true, OR 0x80 into flags/dataLen (OEM DAT_18002851d).
 * On King Ultra 8K (F54F) live probe: 0x80 ⇒ empty dongle echoes; clear bit
 * ⇒ real encryption reply + flash R/W. Default OFF.
 */
let dongleOnline = false

export function setDongleOnline(online: boolean) {
  dongleOnline = online
}

export function getDongleOnline(): boolean {
  return dongleOnline
}

/** FUN_18000f060 - byte sum, then 0x55 - sum. */
export function protocolChecksum(bytes: ArrayLike<number>, start: number, end: number): number {
  let sum = 0
  for (let i = start; i < end; i++) sum = (sum + (bytes[i] & 0xff)) & 0xff
  return (0x55 - sum) & 0xff
}

export function pairChecksum(value: number): number {
  return protocolChecksum([value & 0xff], 0, 1)
}

/** DriverLib.REPORT_RATE (+ 8000 from UI Tag=64). */
export function hzToReportRateCode(hz: number): number | null {
  const map: Record<number, number> = {
    125: 8,
    250: 4,
    500: 2,
    1000: 1,
    2000: 0x10,
    4000: 0x20,
    8000: 0x40,
  }
  return map[hz] ?? null
}

export function reportRateCodeToHz(code: number): number | null {
  if (code >= 16) return (code / 16) * 2000
  if (code > 0 && 1000 % code === 0) return 1000 / code
  return null
}

/** PAW3950 encode from OEM ValueToDPI (Discord tables absent for 3950). */
export function encodeDpi3950(dpi: number): { xDpi: number; yDpi: number; dpiEx: number } {
  const step = 50
  const raw = Math.max(0, Math.round(dpi / step) - 1)
  const hi = (raw >> 8) & 0xff
  const dpiEx = (hi << 2) | (hi << 6)
  const xDpi = raw & 0xff
  return { xDpi, yDpi: xDpi, dpiEx: dpiEx & 0xff }
}

export function decodeDpi3950(xDpi: number, dpiEx: number): number {
  const hiFromEx = (dpiEx >> 2) & 0x03
  const raw = ((hiFromEx & 0xff) << 8) | (xDpi & 0xff)
  return (raw + 1) * 50
}

function onlineFlags(base: number): number {
  return dongleOnline ? base | 0x80 : base
}

/** Build full 20-byte frame; returns feature + OEM Output payloads. */
export function buildFrame(opts: {
  commandId: number
  /** Byte[2] - host-only; not on WriteFile wire */
  aux?: number
  /** Flash address (lo at [7], hi at [6] - matches CompareUpdate / ReadFlash) */
  address?: number
  /** Low 7 bits of byte[8] - payload length */
  dataLen: number
  /** Bytes starting at [9] */
  payload?: number[]
}): EncodedReport {
  const frame = new Uint8Array(FRAME_LEN)
  const addr = opts.address ?? 0
  frame[0] = REPORT_ID
  frame[1] = 0x01
  frame[2] = opts.aux ?? 0
  frame[3] = 0x08
  frame[4] = opts.commandId & 0xff
  frame[5] = 0
  frame[6] = (addr >> 8) & 0xff
  frame[7] = addr & 0xff
  frame[8] = onlineFlags(opts.dataLen & 0x7f)
  const payload = opts.payload ?? []
  for (let i = 0; i < payload.length && 9 + i < FRAME_LEN - 1; i++) {
    frame[9 + i] = payload[i] & 0xff
  }
  frame[19] = protocolChecksum(frame, 3, 19)
  return {
    reportId: REPORT_ID,
    data: frame.slice(1),
    outputData: frame.slice(3),
  }
}

/** Write one MouseConfig-style flash cell (value + pair checksum). */
export function encodeWriteFlashByte(address: number, value: number): EncodedReport {
  const v = value & 0xff
  return buildFrame({
    commandId: UsbCommandId.WriteFlashData,
    address,
    dataLen: 2,
    payload: [v, pairChecksum(v)],
  })
}

/** Write DPI stage triple at flash 0x0C + stage*4. */
export function encodeWriteDpiStage(stageIndex: number, dpi: number): EncodedReport {
  const { xDpi, yDpi, dpiEx } = encodeDpi3950(dpi)
  const addr = FlashAddr.dpiStage0 + stageIndex * 4
  const body = [xDpi, yDpi, dpiEx]
  const ck = protocolChecksum(body, 0, 3)
  return buildFrame({
    commandId: UsbCommandId.WriteFlashData,
    address: addr,
    dataLen: 4,
    payload: [...body, ck],
  })
}

export function encodeReadFlash(address: number, length: number, allFlag = 0): EncodedReport {
  // UsbServer_ReadFalshData: aux=allFlag (host-only), addr hi/lo, len≤10
  return buildFrame({
    commandId: UsbCommandId.ReadFlashData,
    aux: allFlag & 0xff,
    address,
    dataLen: Math.min(length, 10),
  })
}

/**
 * OEM UsbServer_ReadEncryption / FUN_18000f160 - first packet after Start.
 * Wire: cmd=1, dataLen=8 (|0x80 wireless), payload[0..3]=rand bytes, rest 0.
 */
export function encodeReadEncryption(challenge?: number[]): EncodedReport {
  const rnd =
    challenge ??
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 256))
  return buildFrame({
    commandId: UsbCommandId.EncryptionData,
    dataLen: 8,
    payload: rnd,
  })
}

export function encodeCommand(cmd: ProtocolCommand): EncodedReport | null {
  switch (cmd.op) {
    case 'set_report_rate': {
      const code = hzToReportRateCode(cmd.hz)
      if (code == null) return null
      return encodeWriteFlashByte(FlashAddr.reportRate, code)
    }
    case 'set_dpi':
      if (cmd.stageIndex < 0 || cmd.stageIndex > 7) return null
      return encodeWriteDpiStage(cmd.stageIndex, cmd.value)
    case 'set_active_dpi':
      if (cmd.stageIndex < 0 || cmd.stageIndex > 7) return null
      return encodeWriteFlashByte(FlashAddr.currentDpi, cmd.stageIndex)
    case 'set_dpi_stage_count':
      if (cmd.count < 1 || cmd.count > 8) return null
      return encodeWriteFlashByte(FlashAddr.maxDpi, cmd.count)
    case 'set_debounce': {
      // OEM only stores time @ 0xA9. Disabled ⇒ write 0 (no debounce).
      const ms = cmd.enabled ? cmd.ms & 0xff : 0
      return encodeWriteFlashByte(FlashAddr.keyDebounceTime, ms)
    }
    case 'set_lod': {
      // OEM Language XML: 0.7mm→3, 1mm→1, 2mm→2
      const code = lodMmToCode(cmd.mm)
      return encodeWriteFlashByte(FlashAddr.silenceHeight, code)
    }
    case 'set_sensor_mode':
      return encodeWriteFlashByte(
        FlashAddr.sensorPowerSavingEnable,
        sensorModeToCode(cmd.mode),
      )
    case 'set_peak': {
      // Peak = sensorCustomSleepTimeEnable + sensorSleepTime (10s units)
      return encodeWriteFlashByte(
        FlashAddr.sensorCustomSleepEnable,
        cmd.enabled ? 1 : 0,
      )
    }
    case 'set_sensor_flags':
      // Multi-byte: return motion sync first; driver should send the rest via patch helpers
      return encodeWriteFlashByte(
        FlashAddr.motionSyncEnable,
        cmd.motionSync ? 1 : 0,
      )
    case 'set_sleep':
      // OEM Sleep mode → mouseConfig.allLedOffTime @ 0xAD (NOT sensorSleepTime/Peak).
      return encodeWriteFlashByte(
        FlashAddr.allLedOffTime,
        sleepMinutesToCode(cmd.minutes),
      )
    case 'set_long_distance':
      // OEM CS_UsbServer_SetLongRangeMode: cmd=0x16, dataLen=0x0A, payload[0]=enable
      return buildFrame({
        commandId: UsbCommandId.SetLongRangeMode,
        dataLen: 0x0a,
        payload: [cmd.enabled ? 1 : 0],
      })
    case 'get_long_distance':
      // OEM CS_UsbFinder_GetLongRangeMode: cmd=0x17, dataLen=0; reply payload[0]
      return buildFrame({
        commandId: UsbCommandId.GetLongRangeMode,
        dataLen: 0,
      })
    case 'set_profile':
      return buildFrame({
        commandId: UsbCommandId.SetCurrentConfig,
        dataLen: 1,
        payload: [cmd.configId & 0xff],
      })
    case 'set_pc_driver':
      // UsbCommandID.PCDriverStatus = 2 - OEM enables host session before writes
      return buildFrame({
        commandId: UsbCommandId.PCDriverStatus,
        dataLen: 1,
        payload: [cmd.active ? 1 : 0],
      })
    case 'read_encryption':
      return encodeReadEncryption()
    case 'read_config':
      return buildFrame({
        commandId: UsbCommandId.GetCurrentConfig,
        dataLen: 0,
      })
    case 'read_flash':
      return encodeReadFlash(cmd.address, cmd.length, cmd.allFlag ?? 0)
    case 'read_flash_all':
      // UsbServer_ReadAllFlashData(0, 0xC0, allFlag=1)
      return encodeReadFlash(0, 0xc0, 1)
    case 'read_current_dpi':
      // UsbServer_ReadCurrentDPI → ReadFlash(addr=4, len=1)
      return encodeReadFlash(FlashAddr.currentDpi, 2, 0)
    case 'read_report_rate':
      return encodeReadFlash(FlashAddr.reportRate, 2, 0)
    case 'read_version':
    case 'read_mouse_version':
      // CS_UsbServer_ReadVersion / UsbFinder_GetVersion — cmd 0x12 → mouse FW
      return buildFrame({
        commandId: UsbCommandId.ReadVersionID,
        dataLen: 0,
      })
    case 'read_dongle_version':
      // UsbFinder_GetSlaveVersion — cmd 0xB3 → receiver/dongle FW
      return buildFrame({
        commandId: UsbCommandId.GetDongleVersion,
        dataLen: 0,
      })
    case 'read_slave_version':
      // Legacy alias (was wrongly 0x0B); now same as dongle/receiver.
      return buildFrame({
        commandId: UsbCommandId.GetDongleVersion,
        dataLen: 0,
      })
    case 'read_info':
      return buildFrame({
        commandId: UsbCommandId.BatteryLevel,
        dataLen: 0,
      })
    case 'read_online':
      return buildFrame({
        commandId: UsbCommandId.DeviceOnLine,
        dataLen: 0,
      })
    case 'clear_settings':
      return buildFrame({
        commandId: UsbCommandId.ClearSetting,
        dataLen: 0,
      })
    case 'set_button':
      return encodeWriteKeyFun(cmd.flashIndex, cmd.type, cmd.param1, cmd.param2)
    default:
      return null
  }
}

/** KeyFunMap entry: flash 0x60 + index×4 = [type, param1, param2, checksum]. */
export function encodeWriteKeyFun(
  flashIndex: number,
  type: number,
  param1: number,
  param2: number,
): EncodedReport | null {
  if (flashIndex < 0 || flashIndex > 15) return null
  const addr = FlashAddr.keyFun0 + flashIndex * 4
  const body = [type & 0xff, param1 & 0xff, param2 & 0xff]
  const ck = protocolChecksum(body, 0, 3)
  return buildFrame({
    commandId: UsbCommandId.WriteFlashData,
    address: addr,
    dataLen: 4,
    payload: [...body, ck],
  })
}

export function keyFunFlashBytes(
  type: number,
  param1: number,
  param2: number,
): number[] {
  const body = [type & 0xff, param1 & 0xff, param2 & 0xff]
  return [...body, protocolChecksum(body, 0, 3)]
}

/** Extra flash writes for sensor flags (call after encodeCommand set_sensor_flags). */
export function encodeSensorFlagWrites(flags: {
  ripple: boolean
  angle: boolean
  motionSync: boolean
}): EncodedReport[] {
  return [
    encodeWriteFlashByte(FlashAddr.motionSyncEnable, flags.motionSync ? 1 : 0),
    encodeWriteFlashByte(FlashAddr.linearCorrectionEnable, flags.angle ? 1 : 0),
    encodeWriteFlashByte(FlashAddr.rippleControlEnable, flags.ripple ? 1 : 0),
  ]
}

/**
 * Parse WebHID input report payload (16 bytes, reportId already stripped).
 * Wire layout: cmd, status, addrHi, addrLo, flags|len, data[10], ck
 *
 * Dongle-local echo sets status=1 and often leaves data empty - that is NOT
 * proof the mouse flash changed (see FUN_180011a40 WriteFlash compare).
 */
export function decodeInputReport(data: Uint8Array): {
  commandId: number
  status: number
  address: number
  flags: number
  payload: Uint8Array
  /** True when payload bytes are all zero (typical offline / dongle echo). */
  emptyPayload: boolean
  batteryPercent?: number
  charging?: boolean
  batVoltage?: number
} | null {
  if (data.length < 6) return null
  const commandId = data[0] & 0xff
  const status = data[1] & 0xff
  const address = ((data[2] & 0xff) << 8) | (data[3] & 0xff)
  const flags = data[4] & 0xff
  const payloadLen = flags & 0x7f
  // Keep raw data window - dongle echoes often keep dataLen=0 even when
  // later mouse replies put bytes at [5..]. Prefer declared len, min 10.
  const take = Math.min(Math.max(payloadLen, 10), 10, Math.max(0, data.length - 5))
  const payload = data.slice(5, 5 + take)
  let emptyPayload = true
  for (let i = 0; i < payload.length; i++) {
    if (payload[i] !== 0) {
      emptyPayload = false
      break
    }
  }
  const out: {
    commandId: number
    status: number
    address: number
    flags: number
    payload: Uint8Array
    emptyPayload: boolean
    batteryPercent?: number
    charging?: boolean
    batVoltage?: number
  } = { commandId, status, address, flags, payload, emptyPayload }

  if (commandId === UsbCommandId.BatteryLevel && payload.length >= 2) {
    // CS_GetDeviceBatteryStatus: level, isCharging, voltage hi/lo
    out.batteryPercent = Math.min(100, payload[0] & 0xff)
    out.charging = payload[1] === 1
    if (payload.length >= 4) {
      out.batVoltage = ((payload[2] & 0xff) << 8) | (payload[3] & 0xff)
    }
  }
  return out
}

/** Bytes we expect to land in flash for a DPI stage write. */
export function dpiStageFlashBytes(dpi: number): number[] {
  const { xDpi, yDpi, dpiEx } = encodeDpi3950(dpi)
  const body = [xDpi, yDpi, dpiEx]
  return [...body, protocolChecksum(body, 0, 3)]
}

export function flashBytesMatch(
  got: ArrayLike<number>,
  expect: ArrayLike<number>,
  n: number,
): boolean {
  if (got.length < n || expect.length < n) return false
  for (let i = 0; i < n; i++) {
    if ((got[i] & 0xff) !== (expect[i] & 0xff)) return false
  }
  return true
}

export function decodeInfoReport(data: Uint8Array): {
  batteryPercent?: number
  charging?: boolean
} | null {
  const parsed = decodeInputReport(data)
  if (!parsed || parsed.batteryPercent == null) return null
  return {
    batteryPercent: parsed.batteryPercent,
    charging: parsed.charging,
  }
}

/**
 * CS_UsbFinder_GetLongRangeMode: reply byte at wire offset 6 (payload[0]
 * after report-id strip) is the enable flag.
 */
export function decodeLongRangeReport(data: Uint8Array): boolean | null {
  const parsed = decodeInputReport(data)
  if (!parsed || parsed.commandId !== UsbCommandId.GetLongRangeMode) return null
  if (parsed.payload.length < 1) return null
  return (parsed.payload[0] & 0xff) !== 0
}

/**
 * OEM UI shows BCD nibbles (0x15 → "15", 0x18 → "18").
 * Plain decimal bytes (nibbles > 9) fall back to the raw value.
 */
export function bcdByteToDecimal(n: number): number {
  const v = n & 0xff
  const hi = (v >> 4) & 0xf
  const lo = v & 0xf
  if (hi > 9 || lo > 9) return v
  return hi * 10 + lo
}

/** OEM UI: `v{major}.{minor}` from UsbFinder CONCAT11 bytes (BCD). */
export function formatFirmwareVersion(major: number, minor: number): string {
  return `v${bcdByteToDecimal(major)}.${bcdByteToDecimal(minor)}`
}

/**
 * Parse version reply (cmd 0x12 mouse / 0xB3 receiver).
 * UsbFinder CONCAT11(packet[6], packet[7]) with report id present =
 * payload[0], payload[1] after report id is stripped.
 */
export function decodeVersionReport(
  data: Uint8Array,
  expectCmd?: number,
): { firmware: string; commandId: number } | null {
  const parsed = decodeInputReport(data)
  if (!parsed) return null
  if (
    parsed.commandId !== UsbCommandId.ReadVersionID &&
    parsed.commandId !== UsbCommandId.GetDongleVersion
  ) {
    return null
  }
  if (expectCmd != null && parsed.commandId !== expectCmd) return null
  if (parsed.payload.length < 2 || parsed.emptyPayload) return null
  const major = parsed.payload[0] & 0xff
  const minor = parsed.payload[1] & 0xff
  if (major === 0 && minor === 0) return null
  return {
    commandId: parsed.commandId,
    firmware: formatFirmwareVersion(major, minor),
  }
}
