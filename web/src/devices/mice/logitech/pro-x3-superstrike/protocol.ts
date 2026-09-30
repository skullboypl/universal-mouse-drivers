export type X3BatteryState =
  | 'discharging'
  | 'charging'
  | 'full'
  | 'error'
  | 'unknown'

export type X3BatteryReading = {
  percent: number | null
  nextLevel: number | null
  statusCode: number
  state: X3BatteryState
  charging: boolean
}

export type X3ExtendedDpiReading = {
  sensorIndex: number
  dpiX: number | null
  dpiY: number | null
  lodLevel: 1 | 2 | 3 | null
}

/** HID++ 0x2202 fn5 GetSensorDpi response. Read-only on X3. */
export function decodeX3ExtendedDpi(params: Uint8Array): X3ExtendedDpiReading {
  const dpiX = params.length >= 3 ? ((params[1] ?? 0) << 8) | (params[2] ?? 0) : 0
  const dpiY = params.length >= 7 ? ((params[5] ?? 0) << 8) | (params[6] ?? 0) : 0
  const lod = params[9] ?? 0
  return {
    sensorIndex: params[0] ?? 0,
    dpiX: dpiX >= 50 && dpiX <= 100000 ? dpiX : null,
    dpiY: dpiY >= 50 && dpiY <= 100000 ? dpiY : null,
    lodLevel: lod === 1 || lod === 2 || lod === 3 ? lod : null,
  }
}

const X3_REPORT_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const

/** HID++ 0x8061 fn2 GetReportRate response (index, not milliseconds). */
export function decodeX3ExtendedReportRate(params: Uint8Array): number | null {
  const index = params[0]
  return index != null && index < X3_REPORT_RATES.length
    ? X3_REPORT_RATES[index]!
    : null
}

/** HID++ Unified Battery 0x1004, function 1 (GetStatus). */
export function decodeX3UnifiedBatteryStatus(
  params: Uint8Array,
): X3BatteryReading {
  const rawPercent = params[0]
  const percent =
    rawPercent != null && rawPercent <= 100 ? rawPercent : null
  const nextLevel = params[1] ?? null
  const statusCode = params[2] ?? 0xff
  let state: X3BatteryState
  switch (statusCode) {
    case 0:
      state = 'discharging'
      break
    case 1:
    case 3:
      state = 'charging'
      break
    case 2:
      state = 'full'
      break
    case 4:
    case 5:
      state = 'error'
      break
    default:
      state = 'unknown'
  }
  return {
    percent,
    nextLevel,
    statusCode,
    state,
    charging: state === 'charging',
  }
}

export type X3Variant = 'midnight-black' | 'magenta-eclipse' | 'unknown'

export const X3_VARIANTS = {
  'midnight-black': {
    label: 'Midnight Black',
    officialSku: '910-007876',
    /** Local asset - see identity.ts provenance comment for source + fetch date. */
    imageUrl: '/devices/pro-x3-superstrike/mouse-midnight-black.png',
  },
  'magenta-eclipse': {
    label: 'Magenta Eclipse',
    officialSku: '910-007826',
    imageUrl: '/devices/pro-x3-superstrike/mouse-magenta-eclipse.png',
  },
  unknown: {
    label: 'Unknown',
    officialSku: null,
    imageUrl: null,
  },
} as const

/**
 * Color is not encoded in VID:PID. Only map model identifiers confirmed against
 * physical/SKU evidence; unrecognized firmware must remain unknown.
 */
export function resolveX3Variant(modelIdHex: string): X3Variant {
  const normalized = modelIdHex.replace(/[^0-9a-f]/gi, '').toUpperCase()
  const confirmedModelIds: Readonly<Record<string, X3Variant>> = {}
  return confirmedModelIds[normalized] ?? 'unknown'
}

export type HitsCapabilities = {
  leftPresent: boolean
  rightPresent: boolean
  actuationMax: number
  hapticsMax: number
  rapidTriggerMax: number
}

/**
 * Feature 0x1B0C, function 0 (GetCapabilities). Confirmed against a physical
 * X3: response `00 03 28 14 14` -> mask 0x0003 (left+right), actuation
 * resolution 40, haptic resolution 32, RT sensitivity resolution 32.
 * See Decompile/mice/logitech/omm-2.7.4428/RESEARCH.md.
 */
export function decodeHitsCapabilities(params: Uint8Array): HitsCapabilities {
  const mask = ((params[0] ?? 0) << 8) | (params[1] ?? 0)
  return {
    leftPresent: (mask & 0x0001) !== 0,
    rightPresent: (mask & 0x0002) !== 0,
    actuationMax: params[2] ?? 0,
    hapticsMax: params[3] ?? 0,
    rapidTriggerMax: params[4] ?? 0,
  }
}

export interface HitsButtonSetting {
  /** UI value: 1..(raw actuation resolution / 4). */
  actuationPoint: number
  rapidTriggerEnabled: boolean
  /** UI value: 1..(raw RT resolution / 4). */
  rapidTriggerSensitivity: number
  /** UI value: 0..(raw haptics resolution / 4). */
  hapticLevel: number
}

export interface HitsButtonConfig extends HitsButtonSetting {
  buttonIndex: number
}

/** HID++ 0x1B0C fn2 GetConfig: button + three packed setting bytes. */
export function decodeHitsButtonConfig(params: Uint8Array): HitsButtonConfig | null {
  if (params.length < 4) return null
  const buttonIndex = params[0]!
  const packed = params.subarray(1, 4)
  if ((packed[0]! & 0x03) !== 0 || (packed[1]! & 0x02) !== 0 || (packed[2]! & 0x03) !== 0) {
    return null
  }
  return { buttonIndex, ...unpackHitsButton(packed, 0) }
}

/**
 * Convert a capability resolution to the legacy UMD control scale.
 *
 * Do not use this helper to validate or locate profile components. OMM feeds
 * the capability resolution directly into its model clamps, while the current
 * product UI intentionally presents a coarser control. Those are separate
 * concerns and a range match is not evidence that arbitrary sector bytes are
 * component 0x19.
 */
export function hitsUiMax(rawResolution: number | null | undefined): number {
  return Math.max(1, Math.floor((rawResolution ?? 0) / 4))
}

/**
 * Locate an exact two-button component by its currently displayed settings.
 * This is deliberately strict: only one exact six-byte match is accepted.
 */
export function findExactHitsBlock(
  sector: Uint8Array,
  left: HitsButtonSetting,
  right: HitsButtonSetting,
): number | null {
  const needle = Uint8Array.of(...packHitsButton(left), ...packHitsButton(right))
  const matches: number[] = []
  for (let offset = 0; offset <= sector.length - needle.length - 2; offset++) {
    let same = true
    for (let i = 0; i < needle.length; i++) {
      if (sector[offset + i] !== needle[i]) { same = false; break }
    }
    if (same) matches.push(offset)
  }
  return matches.length === 1 ? matches[0]! : null
}

/**
 * Locate component 0x19 from its confirmed two-record schema and device
 * capability ranges. Reserved bit 1 must be clear; numeric fields are stored
 * in quarter steps. Only a single structurally valid match is accepted.
 */
export interface HitsComponentDescriptor {
  componentId: 0x19
  offset: number
  analogButtonCount: number
}

export function findValidatedHitsBlock(
  sector: Uint8Array,
  actuationUiMax: number,
  rapidTriggerUiMax: number,
  hapticsUiMax: number,
  descriptor?: HitsComponentDescriptor,
): number | null {
  // A byte-pattern/range scan produced a false positive at 0x26 on a physical
  // X3: 14 08 0c decodes to 5/2/3, while OMM reported 1/2/2. Only an offset
  // supplied by verified profile-format/component metadata may be considered.
  if (!descriptor || descriptor.componentId !== 0x19 || descriptor.analogButtonCount !== 2) {
    return null
  }
  if (descriptor.offset < 0 || descriptor.offset + 6 > sector.length - 2) return null

  const validRecord = (offset: number) => {
    const a = sector[offset]!
    const rt = sector[offset + 1]!
    const h = sector[offset + 2]!
    const actuation = a >> 2
    const sensitivity = rt >> 2
    const haptic = h >> 2
    return (a & 0x03) === 0 && (rt & 0x02) === 0 && (h & 0x03) === 0 &&
      actuation >= 1 && actuation <= actuationUiMax &&
      sensitivity >= 1 && sensitivity <= rapidTriggerUiMax &&
      haptic >= 0 && haptic <= hapticsUiMax
  }
  return validRecord(descriptor.offset) && validRecord(descriptor.offset + 3)
    ? descriptor.offset
    : null
}

/**
 * Onboard profile component 0x19 (analog_buttons), 3-byte stride per button:
 * byte0 = actuation << 2, byte1 bit0 = RT enable + bits2-7 = sensitivity << 2,
 * byte2 = haptic << 2. Confirmed via OMM native disassembly (getter/setter
 * bodies in logi_nethidppio.dll). The block's position inside the sector is
 * fixed by the profile format - see X3_HITS_COMPONENT below.
 */
export function packHitsButton(setting: HitsButtonSetting): [number, number, number] {
  const byte0 = (setting.actuationPoint & 0x3f) << 2
  const byte1 =
    (setting.rapidTriggerEnabled ? 0x01 : 0x00) |
    ((setting.rapidTriggerSensitivity & 0x3f) << 2)
  const byte2 = (setting.hapticLevel & 0x3f) << 2
  return [byte0 & 0xff, byte1 & 0xff, byte2 & 0xff]
}

export function unpackHitsButton(bytes: Uint8Array, offset: number): HitsButtonSetting {
  const byte0 = bytes[offset] ?? 0
  const byte1 = bytes[offset + 1] ?? 0
  const byte2 = bytes[offset + 2] ?? 0
  return {
    actuationPoint: byte0 >> 2,
    rapidTriggerEnabled: (byte1 & 0x01) !== 0,
    rapidTriggerSensitivity: byte1 >> 2,
    hapticLevel: byte2 >> 2,
  }
}

export interface AnalogButtonOffsetCandidate {
  offset: number
  deltaBytes: number
  /** How well the diff matches the known "value << 2" encoding (1 = perfect). */
  confidence: number
}

/**
 * Empirically locate the analog_buttons (0x19) block by diffing two real
 * sector dumps that differ by exactly one OEM-side HITS change (see the
 * "Remaining controlled validation" section of RESEARCH.md). Never guesses:
 * if the diff doesn't cleanly match the known 3-byte encoding, returns no
 * candidate rather than a low-confidence offset.
 */
export function findAnalogButtonBlockOffset(
  before: Uint8Array,
  after: Uint8Array,
): AnalogButtonOffsetCandidate[] {
  if (before.length !== after.length) return []
  const changed: number[] = []
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) changed.push(i)
  }
  // A single-field HITS edit touches exactly one byte inside one 3-byte block.
  if (changed.length !== 1) return []
  const idx = changed[0]!
  const delta = (after[idx]! - before[idx]! + 256) % 256
  // value << 2 means every legal step changes the byte by a multiple of 4.
  if (delta === 0 || delta % 4 !== 0) return []
  const confidence = delta <= 4 * 63 ? 1 : 0.5
  return [{ offset: idx, deltaBytes: delta, confidence }]
}

/**
 * Onboard profile layout for `PROFILE_FORMAT_ANALOG_BUTTONS` (8), recovered
 * from the native layout builder in OMM 2.7.4428's `logi_nethidppio.dll`
 * (function rva 0xE7E30, format-8 branch at 0xE81DA): after building the
 * previous format's components it registers component 0x19 with
 * offset 0x26, size 6, count 2. Two records x 3 bytes, indexed by the
 * capability bitfield order (left = 0, right = 1). See RESEARCH.md.
 */
export const X3_PROFILE_FORMAT_ANALOG_BUTTONS = 8
export const X3_HITS_COMPONENT = {
  componentId: 0x19,
  offset: 0x26,
  recordSize: 3,
  count: 2,
} as const

export type OnboardProfilesInfo = {
  memoryModel: number
  profileFormat: number
  macroFormat: number
  profileCount: number
  buttonCount: number
  sectorCount: number
  sectorSize: number
}

/** HID++ 0x8100 fn0 (GetDescription) response, same layout OMM's Feature8100 exposes. */
export function decodeOnboardProfilesInfo(info: Uint8Array): OnboardProfilesInfo {
  return {
    memoryModel: info[0] ?? 0,
    profileFormat: info[1] ?? 0,
    macroFormat: info[2] ?? 0,
    profileCount: info[3] ?? 0,
    buttonCount: info[5] ?? 0,
    sectorCount: info[6] ?? 0,
    sectorSize: ((info[7] ?? 0) << 8) | (info[8] ?? 0),
  }
}

/** CRC-16/CCITT-FALSE (init 0xFFFF, poly 0x1021) - identical to OMM's native routine. */
export function crc16CcittFalse(data: Uint8Array): number {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]! << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}

/** OMM validates every sector: CRC over all bytes but the last two, stored big-endian. */
export function sectorCrcIsValid(sector: Uint8Array): boolean {
  if (sector.length < 4) return false
  const stored = ((sector[sector.length - 2] ?? 0) << 8) | (sector[sector.length - 1] ?? 0)
  return crc16CcittFalse(sector.subarray(0, sector.length - 2)) === stored
}

export function finalizeSector(sector: Uint8Array): Uint8Array {
  const out = new Uint8Array(sector)
  const crc = crc16CcittFalse(out.subarray(0, out.length - 2))
  out[out.length - 2] = (crc >> 8) & 0xff
  out[out.length - 1] = crc & 0xff
  return out
}

export type HitsLimits = {
  actuationMax: number
  rapidTriggerMax: number
  hapticsMax: number
}

/** Same clamps as OMM's `CreateAnalogButton`: 1..res, 1..res, 0..res. */
export function hitsSettingIsInRange(setting: HitsButtonSetting, limits: HitsLimits): boolean {
  return (
    setting.actuationPoint >= 1 && setting.actuationPoint <= limits.actuationMax &&
    setting.rapidTriggerSensitivity >= 1 && setting.rapidTriggerSensitivity <= limits.rapidTriggerMax &&
    setting.hapticLevel >= 0 && setting.hapticLevel <= limits.hapticsMax
  )
}

export function readHitsRecords(sector: Uint8Array): HitsButtonSetting[] {
  const { offset, recordSize, count } = X3_HITS_COMPONENT
  return Array.from({ length: count }, (_, i) => unpackHitsButton(sector, offset + i * recordSize))
}

export type HitsWriteGate = { ok: true } | { ok: false; reason: string; reasonPl: string }

/**
 * Every condition that must hold before a byte of the profile sector is
 * touched. The offset is only trusted when the device itself reports
 * profile format 8, and the sector it returned is a well-formed profile.
 */
export function checkHitsWriteGate(
  info: OnboardProfilesInfo,
  sector: Uint8Array,
  limits: HitsLimits,
): HitsWriteGate {
  const { offset, recordSize, count } = X3_HITS_COMPONENT
  if (info.profileFormat !== X3_PROFILE_FORMAT_ANALOG_BUTTONS) {
    return {
      ok: false,
      reason: `The device reports profile format ${info.profileFormat}; the HITS layout is only known for format ${X3_PROFILE_FORMAT_ANALOG_BUTTONS}.`,
      reasonPl: `Urządzenie zgłasza format profilu ${info.profileFormat}, a układ HITS znany jest tylko dla formatu ${X3_PROFILE_FORMAT_ANALOG_BUTTONS}.`,
    }
  }
  if (info.sectorSize < 64 || info.sectorSize > 4096 || sector.length !== info.sectorSize) {
    return {
      ok: false,
      reason: 'The sector size reported by the device does not match the sector that was read.',
      reasonPl: 'Rozmiar sektora z urządzenia jest niespójny z odczytanym sektorem.',
    }
  }
  if (offset + recordSize * count > sector.length - 2) {
    return {
      ok: false,
      reason: 'The HITS component does not fit inside the sector.',
      reasonPl: 'Komponent HITS nie mieści się w sektorze.',
    }
  }
  if (!sectorCrcIsValid(sector)) {
    return {
      ok: false,
      reason: 'The profile sector has an invalid CRC - not overwriting it.',
      reasonPl: 'Sektor profilu ma nieprawidłowe CRC - nie nadpisuję go.',
    }
  }
  const structurallyValid = readHitsRecords(sector).every((rec, i) => {
    const raw = sector.subarray(offset + i * recordSize, offset + (i + 1) * recordSize)
    return (raw[0]! & 0x03) === 0 && (raw[1]! & 0x02) === 0 && (raw[2]! & 0x03) === 0 &&
      hitsSettingIsInRange(rec, limits)
  })
  if (!structurallyValid) {
    return {
      ok: false,
      reason: 'The component 0x19 bytes in this sector do not have the expected structure.',
      reasonPl: 'Bajty komponentu 0x19 w tym sektorze nie mają oczekiwanej struktury.',
    }
  }
  return { ok: true }
}

/** Returns a new sector with one button record replaced and the CRC recomputed. */
export function patchHitsRecord(
  sector: Uint8Array,
  buttonIndex: number,
  setting: HitsButtonSetting,
): Uint8Array {
  const { offset, recordSize, count } = X3_HITS_COMPONENT
  if (!Number.isInteger(buttonIndex) || buttonIndex < 0 || buttonIndex >= count) {
    throw new Error(`HITS button index ${buttonIndex} is out of range`)
  }
  const next = new Uint8Array(sector)
  next.set(packHitsButton(setting), offset + buttonIndex * recordSize)
  return finalizeSector(next)
}

/**
 * Remaining components of the format-8 profile sector, from the same native
 * layout builder (rva 0xE7E30 -> 0xEB630 -> 0xEB250). Encodings come from the
 * native getters/setters and were cross-checked against the ROM profile and
 * the flash profile G HUB writes on a physical X3 (dev log 2026-09-28):
 * report rates are raw `ReportRateExtended` bytes; the DPI v6 table is
 * `x u16 LE, y u16 LE, lod u8` x 5 with the default and G-shift indexes in
 * the two bytes before it; bunny hopping is one byte (timeout / 10 ms,
 * 0 = off); buttons are 4-byte records (`button_fn_component::set_buttons`).
 */
export const X3_PROFILE = {
  reportRateWireless: 0,
  reportRateWired: 1,
  dpiDefaultIndex: 2,
  dpiShiftIndex: 3,
  dpiTable: { offset: 4, count: 5, stride: 5 },
  bunnyHopping: 0x25,
  buttons: { offset: 0x30, recordSize: 4, slots: 12 },
} as const

export const X3_POLL_RATES_HZ = [125, 250, 500, 1000, 2000, 4000, 8000] as const
export const X3_DPI_LIMITS = { min: 100, max: 48000, step: 50 } as const
export const X3_BHOP_LIMITS = { minMs: 100, maxMs: 1000, stepMs: 10 } as const

export function decodeProfileRate(byte: number | undefined): number | null {
  return byte != null && byte < X3_POLL_RATES_HZ.length ? X3_POLL_RATES_HZ[byte]! : null
}

export function encodeProfileRate(hz: number): number | null {
  const index = (X3_POLL_RATES_HZ as readonly number[]).indexOf(hz)
  return index >= 0 ? index : null
}

export function readProfileRates(sector: Uint8Array): { wireless: number | null; wired: number | null } {
  return {
    wireless: decodeProfileRate(sector[X3_PROFILE.reportRateWireless]),
    wired: decodeProfileRate(sector[X3_PROFILE.reportRateWired]),
  }
}

export function patchProfileRate(
  sector: Uint8Array,
  link: 'wireless' | 'wired',
  hz: number,
): Uint8Array {
  const code = encodeProfileRate(hz)
  if (code == null) throw new Error(`Unsupported polling rate ${hz} Hz`)
  const next = new Uint8Array(sector)
  next[link === 'wireless' ? X3_PROFILE.reportRateWireless : X3_PROFILE.reportRateWired] = code
  return finalizeSector(next)
}

/** A slot with `dpiX === 0` is disabled (G HUB stores unused slots as all zeros). */
export type X3DpiStage = { dpiX: number; dpiY: number; lod: number }
export type X3DpiProfile = { defaultIndex: number; shiftIndex: number; stages: X3DpiStage[] }

export function readDpiProfile(sector: Uint8Array): X3DpiProfile {
  const { offset, count, stride } = X3_PROFILE.dpiTable
  const stages = Array.from({ length: count }, (_, i) => {
    const at = offset + i * stride
    return {
      dpiX: (sector[at] ?? 0) | ((sector[at + 1] ?? 0) << 8),
      dpiY: (sector[at + 2] ?? 0) | ((sector[at + 3] ?? 0) << 8),
      lod: sector[at + 4] ?? 0,
    }
  })
  return {
    defaultIndex: sector[X3_PROFILE.dpiDefaultIndex] ?? 0,
    shiftIndex: sector[X3_PROFILE.dpiShiftIndex] ?? 0,
    stages,
  }
}

export function normalizeDpi(value: number): number {
  const stepped = Math.round(value / X3_DPI_LIMITS.step) * X3_DPI_LIMITS.step
  return Math.min(X3_DPI_LIMITS.max, Math.max(X3_DPI_LIMITS.min, stepped))
}

export function patchDpiProfile(sector: Uint8Array, profile: X3DpiProfile): Uint8Array {
  const { offset, count, stride } = X3_PROFILE.dpiTable
  if (profile.stages.length !== count) throw new Error(`Expected ${count} DPI stages`)
  const enabled = (i: number) => (profile.stages[i]?.dpiX ?? 0) > 0
  const indexOk = (i: number) => Number.isInteger(i) && i >= 0 && i < count && enabled(i)
  if (!indexOk(profile.defaultIndex) || !indexOk(profile.shiftIndex)) {
    throw new Error('Default and shift DPI must point at enabled stages')
  }
  const next = new Uint8Array(sector)
  next[X3_PROFILE.dpiDefaultIndex] = profile.defaultIndex
  next[X3_PROFILE.dpiShiftIndex] = profile.shiftIndex
  profile.stages.forEach((stage, i) => {
    const at = offset + i * stride
    if (stage.dpiX <= 0) {
      next.fill(0, at, at + stride)
      return
    }
    if (stage.lod < 1 || stage.lod > 3) throw new Error(`LOD ${stage.lod} out of range`)
    const x = normalizeDpi(stage.dpiX)
    const y = normalizeDpi(stage.dpiY > 0 ? stage.dpiY : stage.dpiX)
    next[at] = x & 0xff
    next[at + 1] = (x >> 8) & 0xff
    next[at + 2] = y & 0xff
    next[at + 3] = (y >> 8) & 0xff
    next[at + 4] = stage.lod
  })
  return finalizeSector(next)
}

export type X3BunnyHop = { enabled: boolean; timeoutMs: number }

/** OMM `BunnyHoppingHelper`: byte = ms / 10; 0 and 0xFF mean off. */
export function readBunnyHop(sector: Uint8Array): X3BunnyHop {
  const byte = sector[X3_PROFILE.bunnyHopping] ?? 0
  const ms = byte * 10
  return {
    enabled: byte !== 0 && byte !== 0xff,
    timeoutMs: ms >= X3_BHOP_LIMITS.minMs && ms <= X3_BHOP_LIMITS.maxMs ? ms : X3_BHOP_LIMITS.minMs,
  }
}

export function patchBunnyHop(sector: Uint8Array, value: X3BunnyHop): Uint8Array {
  const next = new Uint8Array(sector)
  const ms = Math.min(X3_BHOP_LIMITS.maxMs, Math.max(X3_BHOP_LIMITS.minMs, value.timeoutMs))
  next[X3_PROFILE.bunnyHopping] = value.enabled ? Math.round(ms / X3_BHOP_LIMITS.stepMs) : 0
  return finalizeSector(next)
}

/** Actions the X3 button list offers (OMM `HIDActionsDefaults`). */
export type X3ButtonAction =
  | 'left' | 'right' | 'middle' | 'back' | 'forward'
  | 'media_play_pause' | 'media_prev' | 'media_next'
  | 'media_mute' | 'media_vol_up' | 'media_vol_down'
  | 'dpi_shift' | 'g_shift' | 'profile_cycle' | 'dpi_cycle'
  | 'scroll_left' | 'scroll_right' | 'disabled'

const MOUSE_MASK: Record<'left' | 'right' | 'middle' | 'back' | 'forward', number> = {
  left: 0x0001, right: 0x0002, middle: 0x0004, back: 0x0008, forward: 0x0010,
}
const CONSUMER_CODE: Record<'media_play_pause' | 'media_prev' | 'media_next' | 'media_mute' | 'media_vol_up' | 'media_vol_down', number> = {
  media_play_pause: 205, media_prev: 181, media_next: 182, media_mute: 226, media_vol_up: 233, media_vol_down: 234,
}
const FUNCTION_OPCODE: Record<'disabled' | 'scroll_left' | 'scroll_right' | 'dpi_cycle' | 'dpi_shift' | 'profile_cycle' | 'g_shift', number> = {
  disabled: 0, scroll_left: 1, scroll_right: 2, dpi_cycle: 5, dpi_shift: 7, profile_cycle: 10, g_shift: 11,
}

/** Same bytes OMM's native `set_buttons` writes; functions leave bytes 2-3 at 0xFF. */
export function encodeButtonRecord(action: X3ButtonAction): Uint8Array {
  if (action in MOUSE_MASK) {
    const mask = MOUSE_MASK[action as keyof typeof MOUSE_MASK]
    return Uint8Array.of(0x80, 0x01, mask >> 8, mask & 0xff)
  }
  if (action in CONSUMER_CODE) {
    const code = CONSUMER_CODE[action as keyof typeof CONSUMER_CODE]
    return Uint8Array.of(0x80, 0x03, code >> 8, code & 0xff)
  }
  return Uint8Array.of(0x90, FUNCTION_OPCODE[action as keyof typeof FUNCTION_OPCODE], 0xff, 0xff)
}

/** Returns null for records UMD cannot express (macros, key + modifier): they are preserved as-is. */
export function decodeButtonRecord(record: Uint8Array): X3ButtonAction | null {
  const b0 = record[0] ?? 0xff
  const b1 = record[1] ?? 0
  const word = ((record[2] ?? 0) << 8) | (record[3] ?? 0)
  if (b0 === 0x80 && b1 === 0x01) {
    const found = (Object.entries(MOUSE_MASK) as [keyof typeof MOUSE_MASK, number][]).find(([, m]) => m === word)
    return found ? found[0] : null
  }
  if (b0 === 0x80 && b1 === 0x03) {
    const found = (Object.entries(CONSUMER_CODE) as [keyof typeof CONSUMER_CODE, number][]).find(([, c]) => c === word)
    return found ? found[0] : null
  }
  if (b0 === 0x90) {
    const found = (Object.entries(FUNCTION_OPCODE) as [keyof typeof FUNCTION_OPCODE, number][]).find(([, f]) => f === b1)
    return found ? found[0] : null
  }
  return null
}

export function readButtonRecord(sector: Uint8Array, index: number): Uint8Array {
  const { offset, recordSize } = X3_PROFILE.buttons
  return sector.slice(offset + index * recordSize, offset + (index + 1) * recordSize)
}

export function patchButton(sector: Uint8Array, index: number, action: X3ButtonAction): Uint8Array {
  const { offset, recordSize, slots } = X3_PROFILE.buttons
  if (!Number.isInteger(index) || index < 0 || index >= slots) throw new Error(`Button slot ${index} out of range`)
  const next = new Uint8Array(sector)
  next.set(encodeButtonRecord(action), offset + index * recordSize)
  return finalizeSector(next)
}

/** Format, size and CRC checks shared by every profile write. */
export function checkProfileGate(info: OnboardProfilesInfo, sector: Uint8Array): HitsWriteGate {
  if (info.profileFormat !== X3_PROFILE_FORMAT_ANALOG_BUTTONS) {
    return {
      ok: false,
      reason: `The device reports profile format ${info.profileFormat}; the layout is only known for format ${X3_PROFILE_FORMAT_ANALOG_BUTTONS}.`,
      reasonPl: `Urządzenie zgłasza format profilu ${info.profileFormat}, a układ znany jest tylko dla formatu ${X3_PROFILE_FORMAT_ANALOG_BUTTONS}.`,
    }
  }
  if (info.sectorSize < 64 || info.sectorSize > 4096 || sector.length !== info.sectorSize) {
    return {
      ok: false,
      reason: 'The sector size reported by the device does not match the sector that was read.',
      reasonPl: 'Rozmiar sektora z urządzenia jest niespójny z odczytanym sektorem.',
    }
  }
  if (!sectorCrcIsValid(sector)) {
    return {
      ok: false,
      reason: 'The profile sector has an invalid CRC - not overwriting it.',
      reasonPl: 'Sektor profilu ma nieprawidłowe CRC - nie nadpisuję go.',
    }
  }
  return { ok: true }
}

// --- Gaming surface (HID++ feature 0x8090, "Mode Status") ---------------
// Ported from the OpenMouse project's mode-status.js (AGPL-3.0, same
// license as this repo): modeStatus1 bits 1-2 carry the gaming-surface
// tuning; a bare value/mask write is rejected, the wire form is
// [0x00, newByte, 0x00, changeMask].
export type X3GamingSurfaceMode = 'Auto' | 'On' | 'Off'

const GAMING_SURFACE_FIELD = {
  mask: 0b0000_0110,
  shift: 1,
  values: { Auto: 0, On: 1, Off: 2 } as const,
}

export function decodeGamingSurfaceMode(modeStatus1: number): X3GamingSurfaceMode | null {
  const encoded = (modeStatus1 & GAMING_SURFACE_FIELD.mask) >> GAMING_SURFACE_FIELD.shift
  const entry = (Object.entries(GAMING_SURFACE_FIELD.values) as [X3GamingSurfaceMode, number][]).find(
    ([, value]) => value === encoded,
  )
  return entry?.[0] ?? null
}

/** [modeStatus0, modeStatus1, changeMask0, changeMask1] for feature fn 0x10 (set). */
export function encodeGamingSurfaceWrite(
  currentModeStatus1: number,
  mode: X3GamingSurfaceMode,
): Uint8Array {
  const encoded =
    (currentModeStatus1 & ~GAMING_SURFACE_FIELD.mask) |
    (GAMING_SURFACE_FIELD.values[mode] << GAMING_SURFACE_FIELD.shift)
  return new Uint8Array([0x00, encoded, 0x00, GAMING_SURFACE_FIELD.mask])
}

// LightForce switch mode: same modeStatus1 byte, bit 0.
export type X3LightforceMode = 'Optical' | 'Hybrid'

const LIGHTFORCE_FIELD = {
  mask: 0b0000_0001,
  shift: 0,
  values: { Optical: 0, Hybrid: 1 } as const,
}

export function decodeLightforceMode(modeStatus1: number): X3LightforceMode | null {
  const encoded = (modeStatus1 & LIGHTFORCE_FIELD.mask) >> LIGHTFORCE_FIELD.shift
  const entry = (Object.entries(LIGHTFORCE_FIELD.values) as [X3LightforceMode, number][]).find(
    ([, value]) => value === encoded,
  )
  return entry?.[0] ?? null
}

export function encodeLightforceWrite(
  currentModeStatus1: number,
  mode: X3LightforceMode,
): Uint8Array {
  const encoded =
    (currentModeStatus1 & ~LIGHTFORCE_FIELD.mask) |
    (LIGHTFORCE_FIELD.values[mode] << LIGHTFORCE_FIELD.shift)
  return new Uint8Array([0x00, encoded, 0x00, LIGHTFORCE_FIELD.mask])
}
