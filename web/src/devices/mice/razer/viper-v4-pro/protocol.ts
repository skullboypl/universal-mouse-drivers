/**
 * Razer Viper V4 Pro control channel (90-byte feature report id 0).
 *
 * Clean-room encode/decode from the public OpenMouse `@openmouse/protocol/razer-v4`
 * surface and OpenRazer #2760 Synapse 4 captures (wired `0x00e5`, HyperSpeed
 * `0x00e6`). This is not a decompilation of Razer Synapse binaries.
 */

export const VIPER_V4_VENDOR_ID = 0x1532
export const VIPER_V4_PID_WIRED = 0x00e5
export const VIPER_V4_PID_DONGLE = 0x00e6

export const VIPER_V4_REPORT_ID = 0
export const VIPER_V4_REPORT_LENGTH = 90
export const VIPER_V4_MAX_DPI_STAGES = 5
export const VIPER_V4_DPI_MIN = 100
export const VIPER_V4_DPI_MAX = 50_000
export const VIPER_V4_DPI_STEP = 50

/** Status byte in response[0]. */
export const VIPER_V4_STATUS_BUSY = 0x01
export const VIPER_V4_STATUS_OK = 0x02

export const VIPER_V4_POLLING_CODES = new Map<number, number>([
  [125, 0x40],
  [500, 0x10],
  [1000, 0x08],
  [2000, 0x04],
  [4000, 0x02],
  [8000, 0x01],
])

export const VIPER_V4_POLL_RATES_HZ = [125, 500, 1000, 2000, 4000, 8000] as const
export const VIPER_V4_SLEEP_SECONDS = [60, 300, 600, 900] as const

export type ViperV4DpiStage = { x: number; y: number }
export type ViperV4DpiState = {
  activeStage: number
  stages: ViperV4DpiStage[]
}

export function razerV4Crc(report: Uint8Array): number {
  let crc = 0
  for (let index = 2; index <= 87; index += 1) crc ^= report[index] ?? 0
  return crc
}

export function buildRazerV4Report(
  commandClass: number,
  commandId: number,
  dataSize: number,
  args: Uint8Array = new Uint8Array(),
  /** Synapse increments per SET; default 0x1f matches OpenRazer HyperSpeed. */
  transactionId = 0x1f,
): Uint8Array {
  if (args.length > 80) throw new Error('Razer V4 command payload is too large')
  if (!Number.isInteger(dataSize) || dataSize < 0 || dataSize > 80) {
    throw new Error('Razer V4 command data size is invalid')
  }
  const report = new Uint8Array(VIPER_V4_REPORT_LENGTH)
  report[1] = transactionId & 0xff
  report[5] = dataSize
  report[6] = commandClass
  report[7] = commandId
  report.set(args, 8)
  report[88] = razerV4Crc(report)
  return report
}

export function decodeRazerV4PollingCode(code: number): number | null {
  for (const [rate, candidate] of VIPER_V4_POLLING_CODES) {
    if (candidate === code) return rate
  }
  return null
}

export function encodeRazerV4PollingCode(rateHz: number): number | null {
  return VIPER_V4_POLLING_CODES.get(rateHz) ?? null
}

export function normalizeViperV4Dpi(value: number): number {
  if (!Number.isFinite(value)) return VIPER_V4_DPI_MIN
  const stepped =
    Math.round(value / VIPER_V4_DPI_STEP) * VIPER_V4_DPI_STEP
  return Math.max(VIPER_V4_DPI_MIN, Math.min(VIPER_V4_DPI_MAX, stepped))
}

export function isValidViperV4Dpi(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= VIPER_V4_DPI_MIN &&
    value <= VIPER_V4_DPI_MAX &&
    value % VIPER_V4_DPI_STEP === 0
  )
}

export function decodeRazerV4DpiState(args: Uint8Array): ViperV4DpiState {
  const count = Math.min(args[2] ?? 0, VIPER_V4_MAX_DPI_STAGES)
  const stages: ViperV4DpiStage[] = []
  for (let index = 0; index < count; index += 1) {
    const offset = 3 + index * 7
    stages.push({
      x: ((args[offset + 1] ?? 0) << 8) | (args[offset + 2] ?? 0),
      y: ((args[offset + 3] ?? 0) << 8) | (args[offset + 4] ?? 0),
    })
  }
  if (!stages.length) throw new Error('Viper V4 Pro reported no DPI stages')
  return {
    activeStage: Math.min(
      Math.max((args[1] ?? 1) - 1, 0),
      stages.length - 1,
    ),
    stages,
  }
}

export function encodeRazerV4DpiWriteArgs(state: ViperV4DpiState): Uint8Array {
  const args = new Uint8Array(3 + state.stages.length * 7)
  args[0] = 1
  args[1] = state.activeStage + 1
  args[2] = state.stages.length
  state.stages.forEach((stage, index) => {
    const offset = 3 + index * 7
    args[offset] = index
    args[offset + 1] = (stage.x >> 8) & 0xff
    args[offset + 2] = stage.x & 0xff
    args[offset + 3] = (stage.y >> 8) & 0xff
    args[offset + 4] = stage.y & 0xff
  })
  return args
}

export function decodeBatteryPercent(raw: number): number {
  return Math.round((raw * 100) / 255)
}

/**
 * Synapse maps percent with round-half-up onto 0..255.
 * Verified: 5%→0x0d, 25%→0x40, 50%→0x80, 100%→0xff (OpenRazer #2760 pcaps).
 */
export function encodeLowPowerPercent(percent: number): number {
  const clamped = Math.max(5, Math.min(100, Math.round(percent)))
  return Math.round((clamped * 255) / 100)
}

export function decodeLowPowerPercent(raw: number): number {
  return Math.round((raw * 100) / 255)
}

export function readU16BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0)
}

export function encodeU16BE(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff])
}

/** Dongle LED modes from OpenRazer #2760 indicator capture. */
export const VIPER_V4_DONGLE_LED_MODES = [
  { id: 0, label: 'Always Off', labelPl: 'Zawsze wyłączony' },
  { id: 1, label: 'Battery Level', labelPl: 'Poziom baterii' },
  { id: 2, label: 'Connection Quality', labelPl: 'Jakość połączenia' },
  { id: 3, label: 'Polling Rate', labelPl: 'Polling rate' },
  { id: 4, label: 'DPI Stage', labelPl: 'Stopień DPI' },
] as const

export type ViperV4DongleLedMode = (typeof VIPER_V4_DONGLE_LED_MODES)[number]['id']

export type ViperV4DongleLeds = [ViperV4DongleLedMode, ViperV4DongleLedMode, ViperV4DongleLedMode]

export function decodeDongleLeds(args: Uint8Array): ViperV4DongleLeds {
  const clamp = (v: number): ViperV4DongleLedMode =>
    (v >= 0 && v <= 4 ? v : 0) as ViperV4DongleLedMode
  return [clamp(args[0] ?? 0), clamp(args[1] ?? 0), clamp(args[2] ?? 0)]
}

export function encodeDongleLeds(leds: ViperV4DongleLeds): Uint8Array {
  return Uint8Array.of(leds[0], leds[1], leds[2])
}

/**
 * Physical button ids (Synapse `fwID` / GET probe `02/8c`).
 * Hypershift layer uses the same ids with mode byte = 1.
 * Source: Synapse MW chunk 6120 (rzDevice25) + OpenRazer #2760 enum pcap.
 */
export const VIPER_V4_BUTTON_IDS = {
  left: 0x01,
  right: 0x02,
  middle: 0x03,
  back: 0x04,
  forward: 0x05,
  scrollUp: 0x09,
  scrollDown: 0x0a,
  dpiCycle: 0x60,
} as const

/** Synapse `QF` mouse button codes used as ButtonCode fnDataByte[0]. */
export const VIPER_V4_MOUSE_FN = {
  left: 1,
  right: 2,
  middle: 3,
  back: 4,
  forward: 5,
  scrollUp: 9,
  scrollDown: 10,
} as const

/**
 * Synapse `Vh` function-id enum (rzDevice25 / product 229 MW).
 * Wire payload: `[profile, buttonId, mode, fnId, fnDataSize, ...fnData]`
 */
export const VIPER_V4_FN = {
  Off: 0,
  ButtonCode: 1,
  KeyCode: 2,
  MacroTypeI: 3,
  DPI: 6,
  Profile: 7,
  MediaKeys: 10,
  DoubleClick: 11,
  ModeButtonkey: 12,
  TurboModeButton: 14,
} as const

export const VIPER_V4_BTN_MODE = {
  normal: 0,
  hypershift: 1,
} as const

export const VIPER_V4_DPI_FN = {
  up: 1,
  down: 2,
  clutch: 5,
  cycleUp: 6,
  cycleDown: 7,
} as const

/** Profile slot Synapse uses for live OBM writes (capture + MW default). */
export const VIPER_V4_BTN_PROFILE = 1

/** Verified SET size from OpenRazer #2760 wireless-config (Synapse pads to 80). */
export const VIPER_V4_BTN_PAYLOAD_SIZE = 10

export type ViperV4ButtonAssignment =
  | { kind: 'off' }
  | { kind: 'mouse'; mouseFn: number }
  | { kind: 'keyboard'; usageId: number; modifiers?: number }
  | { kind: 'dpi'; dpiFn: number }
  | { kind: 'doubleClick' }

/**
 * Encode Set Single Button Assignment (`02/0c`).
 * Decompiled from Synapse `setSingleButtonAssignment` /
 * `mouseGroupToFnDataByte` / `keyboardGroupToFnDataByte` (chunk 6120).
 * Verified shape: Forward→F = `01 05 00 02 02 00 09 00 00 00`.
 */
export function encodeButtonAssignment(
  buttonId: number,
  assignment: ViperV4ButtonAssignment,
  opts?: { hypershift?: boolean; profileId?: number },
): Uint8Array {
  const profileId = opts?.profileId ?? VIPER_V4_BTN_PROFILE
  const mode = opts?.hypershift
    ? VIPER_V4_BTN_MODE.hypershift
    : VIPER_V4_BTN_MODE.normal
  let fnId: number = VIPER_V4_FN.Off
  let fnData = new Uint8Array(0)
  switch (assignment.kind) {
    case 'off':
      break
    case 'mouse':
      fnId = VIPER_V4_FN.ButtonCode
      fnData = Uint8Array.of(assignment.mouseFn & 0xff)
      break
    case 'keyboard':
      fnId = VIPER_V4_FN.KeyCode
      fnData = Uint8Array.of(
        (assignment.modifiers ?? 0) & 0xff,
        assignment.usageId & 0xff,
      )
      break
    case 'dpi':
      fnId = VIPER_V4_FN.DPI
      fnData = Uint8Array.of(assignment.dpiFn & 0xff)
      break
    case 'doubleClick':
      fnId = VIPER_V4_FN.DoubleClick
      fnData = Uint8Array.of(1)
      break
  }
  const args = new Uint8Array(VIPER_V4_BTN_PAYLOAD_SIZE)
  args[0] = profileId & 0xff
  args[1] = buttonId & 0xff
  args[2] = mode & 0xff
  args[3] = fnId & 0xff
  args[4] = fnData.length & 0xff
  args.set(fnData.subarray(0, Math.max(0, VIPER_V4_BTN_PAYLOAD_SIZE - 5)), 5)
  return args
}

/** @deprecated alias — prefer encodeButtonAssignment */
export function encodeKeyboardButtonMapping(
  buttonId: number,
  usageId: number,
  hypershift = false,
): Uint8Array {
  return encodeButtonAssignment(
    buttonId,
    { kind: 'keyboard', usageId },
    { hypershift },
  )
}

export function encodeMouseButtonMapping(
  buttonId: number,
  mouseFn: number,
  hypershift = false,
): Uint8Array {
  return encodeButtonAssignment(
    buttonId,
    { kind: 'mouse', mouseFn },
    { hypershift },
  )
}

export function encodeDpiButtonMapping(
  buttonId: number,
  dpiFn: number,
  hypershift = false,
): Uint8Array {
  return encodeButtonAssignment(buttonId, { kind: 'dpi', dpiFn }, { hypershift })
}

export function encodeOffButtonMapping(
  buttonId: number,
  hypershift = false,
): Uint8Array {
  return encodeButtonAssignment(buttonId, { kind: 'off' }, { hypershift })
}

/** GET probe args for `02/8c` (enumeration shape). */
export function encodeButtonReadArgs(
  buttonId: number,
  hypershift = false,
): Uint8Array {
  const args = new Uint8Array(VIPER_V4_BTN_PAYLOAD_SIZE)
  args[0] = VIPER_V4_BTN_PROFILE
  args[1] = buttonId & 0xff
  args[2] = hypershift ? VIPER_V4_BTN_MODE.hypershift : VIPER_V4_BTN_MODE.normal
  return args
}

export function decodeButtonAssignment(
  args: Uint8Array,
): {
  profileId: number
  buttonId: number
  hypershift: boolean
  assignment: ViperV4ButtonAssignment
} {
  const profileId = args[0] ?? 0
  const buttonId = args[1] ?? 0
  const hypershift = (args[2] ?? 0) === VIPER_V4_BTN_MODE.hypershift
  const fnId = args[3] ?? 0
  const size = Math.min(args[4] ?? 0, Math.max(0, args.length - 5))
  const data = args.slice(5, 5 + size)
  let assignment: ViperV4ButtonAssignment = { kind: 'off' }
  if (fnId === VIPER_V4_FN.ButtonCode && size >= 1) {
    assignment = { kind: 'mouse', mouseFn: data[0] ?? 0 }
  } else if (fnId === VIPER_V4_FN.KeyCode && size >= 2) {
    assignment = {
      kind: 'keyboard',
      modifiers: data[0] ?? 0,
      usageId: data[1] ?? 0,
    }
  } else if (fnId === VIPER_V4_FN.DPI && size >= 1) {
    assignment = { kind: 'dpi', dpiFn: data[0] ?? 0 }
  } else if (fnId === VIPER_V4_FN.DoubleClick) {
    assignment = { kind: 'doubleClick' }
  } else if (fnId === VIPER_V4_FN.Off || size === 0) {
    assignment = { kind: 'off' }
  }
  return { profileId, buttonId, hypershift, assignment }
}

/**
 * Synapse Smart Tracking presets (product 229 UI).
 * trackingDistance slider is 1..3 (Low / Medium / High); default Medium=2.
 * Asymmetric: lift-off 2..26 (default 13), landing 1..25 (default 12).
 */
export const VIPER_V4_TRACKING_PRESETS = [
  { id: 1, label: 'Low', labelPl: 'Niski' },
  { id: 2, label: 'Medium', labelPl: 'Średni' },
  { id: 3, label: 'High', labelPl: 'Wysoki' },
] as const

export const VIPER_V4_LIFTOFF_MIN = 2
export const VIPER_V4_LIFTOFF_MAX = 26
export const VIPER_V4_LANDING_MIN = 1
export const VIPER_V4_LANDING_MAX = 25
export const VIPER_V4_ROTATION_MIN = -44
export const VIPER_V4_ROTATION_MAX = 44

/**
 * Proximity / Smart Tracking / Dyn Sens / Angle — Synapse MW `6120` +
 * Winonat1 `orca5PlusCalibrationEngine` (chunk 2545) + taskRunner.
 * Class `0x0b` = Proximity Sensor.
 */
export const VIPER_V4_PROXIMITY_CLASS_ID = 0
export const VIPER_V4_PROXIMITY_SENSOR_ID = 4 /* Avago_Proximity_sensor */
export const VIPER_V4_BTN_PROFILE_ID = 1

export const VIPER_V4_LIFT_MODE = {
  universalCutOff: 1,
  universalHysteresis: 2,
  presetCutOff: 3,
  presetHysteresis: 4,
  manualCutOff: 5,
  manualHysteresis: 6,
} as const

/** Dynamic Sensitivity state (Synapse `TK.Bh`). */
export const VIPER_V4_DYN_STATE = { off: 0, on: 1 } as const

/** Dynamic Sensitivity mode (Synapse `TK.dx` / `fi.Dk`). */
export const VIPER_V4_DYN_MODE = {
  classic: 0,
  natural: 1,
  jump: 2,
  custom: 3,
} as const

export type ViperV4DynModeId = keyof typeof VIPER_V4_DYN_MODE | 'off'

export type ViperV4SmartTracking = {
  isAsymmetric: boolean
  /** Synapse UI 1..3 (Low/Med/High). */
  trackingDistance: 1 | 2 | 3
  liftOffDistance: number
  landingDistance: number
}

export type ViperV4Rotation = {
  isEnabled: boolean
  /** Degrees −44…+44 (Synapse Advanced). */
  value: number
}

export type ViperV4DynamicSensitivity = {
  state: number
  mode: number
}

/** Signed angle → wire byte (JS Uint8Array two's complement). */
export function encodeAngleTuneByte(degrees: number): number {
  const clamped = Math.max(
    VIPER_V4_ROTATION_MIN,
    Math.min(VIPER_V4_ROTATION_MAX, Math.round(degrees)),
  )
  return clamped & 0xff
}

export function decodeAngleTuneByte(byte: number): number {
  const b = byte & 0xff
  return b > 127 ? b - 256 : b
}

/**
 * Angle Tune SET `0b/14` — taskRunner: `(1, enabled?1:0, value)`.
 * Synapse disable capture is `01 00 00` — angle byte must be 0 when off,
 * otherwise some firmwares keep rotation active.
 */
export function encodeAngleTune(
  rotation: ViperV4Rotation,
  profileId = VIPER_V4_BTN_PROFILE_ID,
): Uint8Array {
  return Uint8Array.of(
    profileId & 0xff,
    rotation.isEnabled ? 1 : 0,
    rotation.isEnabled ? encodeAngleTuneByte(rotation.value) : 0,
  )
}

export function decodeAngleTune(args: Uint8Array): ViperV4Rotation {
  return {
    isEnabled: (args[1] ?? 0) !== 0,
    value: decodeAngleTuneByte(args[2] ?? 0),
  }
}

/** Acceleration State SET `0b/10` — `(profileId, state)`. */
export function encodeDynSensState(
  state: number,
  profileId = VIPER_V4_BTN_PROFILE_ID,
): Uint8Array {
  return Uint8Array.of(profileId & 0xff, state & 0xff)
}

/** Acceleration Mode SET `0b/11` — `(profileId, mode)`. */
export function encodeDynSensMode(
  mode: number,
  profileId = VIPER_V4_BTN_PROFILE_ID,
): Uint8Array {
  return Uint8Array.of(profileId & 0xff, mode & 0xff)
}

export function dynModeIdToWire(id: ViperV4DynModeId): ViperV4DynamicSensitivity {
  if (id === 'off') return { state: VIPER_V4_DYN_STATE.off, mode: VIPER_V4_DYN_MODE.classic }
  return { state: VIPER_V4_DYN_STATE.on, mode: VIPER_V4_DYN_MODE[id] }
}

export function dynWireToModeId(wire: ViperV4DynamicSensitivity): ViperV4DynModeId {
  if (wire.state === VIPER_V4_DYN_STATE.off) return 'off'
  if (wire.mode === VIPER_V4_DYN_MODE.natural) return 'natural'
  if (wire.mode === VIPER_V4_DYN_MODE.jump) return 'jump'
  if (wire.mode === VIPER_V4_DYN_MODE.custom) return 'custom'
  return 'classic'
}

/** Proximity Sensor State SET `0b/03` — orca5Plus enables before lift. */
export function encodeProximitySensorState(
  enabled: boolean,
  classId = VIPER_V4_PROXIMITY_CLASS_ID,
  sensorId = VIPER_V4_PROXIMITY_SENSOR_ID,
): Uint8Array {
  return Uint8Array.of(classId & 0xff, sensorId & 0xff, enabled ? 1 : 0)
}

/**
 * Lift Setting SET `0b/0b`.
 * Smart (symmetric): mode=Universal_Lift_Cut_off(1), height=trackingDistance-1.
 * Asymmetric: mode=Preset_Calibration_Hysteresis(4), height=0.
 */
export function encodeLiftSetting(
  tracking: ViperV4SmartTracking,
  classId = VIPER_V4_PROXIMITY_CLASS_ID,
  sensorId = VIPER_V4_PROXIMITY_SENSOR_ID,
): Uint8Array {
  if (tracking.isAsymmetric) {
    return Uint8Array.of(
      classId & 0xff,
      sensorId & 0xff,
      VIPER_V4_LIFT_MODE.presetHysteresis,
      0,
    )
  }
  const height = Math.max(0, Math.min(2, tracking.trackingDistance - 1))
  return Uint8Array.of(
    classId & 0xff,
    sensorId & 0xff,
    VIPER_V4_LIFT_MODE.universalCutOff,
    height,
  )
}

/**
 * Configuration SET `0b/05` size 10 — asymmetric only.
 * Bytes `[classId, sensorId, liftOff-1, landing-1, …0]`.
 */
export function encodeProximityConfiguration(
  tracking: ViperV4SmartTracking,
  classId = VIPER_V4_PROXIMITY_CLASS_ID,
  sensorId = VIPER_V4_PROXIMITY_SENSOR_ID,
): Uint8Array {
  const args = new Uint8Array(10)
  args[0] = classId & 0xff
  args[1] = sensorId & 0xff
  const lift = Math.max(
    VIPER_V4_LIFTOFF_MIN,
    Math.min(VIPER_V4_LIFTOFF_MAX, Math.round(tracking.liftOffDistance)),
  )
  const land = Math.max(
    VIPER_V4_LANDING_MIN,
    Math.min(VIPER_V4_LANDING_MAX, Math.round(tracking.landingDistance)),
  )
  args[2] = (lift - 1) & 0xff
  args[3] = (land - 1) & 0xff
  return args
}

/** Command ids used by the native driver (class / id). */
export const VIPER_V4_CMD = {
  pollingWrite: { class: 0x00, id: 0x40 },
  pollingRead: { class: 0x00, id: 0xc0 },
  buttonWrite: { class: 0x02, id: 0x0c },
  buttonRead: { class: 0x02, id: 0x8c },
  dpiWrite: { class: 0x04, id: 0x06 },
  dpiRead: { class: 0x04, id: 0x86 },
  batteryRead: { class: 0x07, id: 0x80 },
  lowPowerWrite: { class: 0x07, id: 0x01 },
  lowPowerRead: { class: 0x07, id: 0x81 },
  sleepWrite: { class: 0x07, id: 0x03 },
  sleepRead: { class: 0x07, id: 0x83 },
  chargingRead: { class: 0x07, id: 0x84 },
  dongleLedWrite: { class: 0x07, id: 0x15 },
  dongleLedRead: { class: 0x07, id: 0x95 },
  /** Proximity Sensor State — orca5Plus enable before lift. */
  proximityStateWrite: { class: 0x0b, id: 0x03 },
  proximityStateRead: { class: 0x0b, id: 0x83 },
  /** Lift Setting — Smart Tracking distance / asymmetric mode select. */
  liftSettingWrite: { class: 0x0b, id: 0x0b },
  liftSettingRead: { class: 0x0b, id: 0x8b },
  /** Proximity Configuration — asymmetric lift/land (0-based). */
  proximityConfigWrite: { class: 0x0b, id: 0x05 },
  proximityConfigRead: { class: 0x0b, id: 0x85 },
  /** Acceleration State — Dynamic Sensitivity on/off. */
  dynSensStateWrite: { class: 0x0b, id: 0x10 },
  dynSensStateRead: { class: 0x0b, id: 0x90 },
  /** Acceleration Mode — Classic/Natural/Jump/Custom. */
  dynSensModeWrite: { class: 0x0b, id: 0x11 },
  dynSensModeRead: { class: 0x0b, id: 0x91 },
  /** Angle Tune — Sensor Rotation. */
  angleTuneWrite: { class: 0x0b, id: 0x14 },
  angleTuneRead: { class: 0x0b, id: 0x94 },
} as const

/**
 * Synapse feature coverage — wire from MW decompile (6120/2545) +
 * OpenRazer #2760 enumeration cross-check.
 */
export const VIPER_V4_FEATURE_MATRIX = {
  dpiStages: 'verified',
  pollingRate: 'verified',
  sleepTimeout: 'verified',
  lowPowerThreshold: 'verified',
  battery: 'verified',
  charging: 'verified',
  dongleLeds: 'verified',
  buttonRemap: 'verified',
  hypershift: 'partial',
  smartPollingSwitcher: 'needsCapture',
  smartTrackingLod: 'decompiled',
  asymmetricCutoff: 'decompiled',
  dynamicSensitivity: 'decompiled',
  sensorRotation: 'decompiled',
  sensitivityMatcher: 'hostOnly',
} as const
