export type ConnectionMode = 'corded' | 'wireless' | 'bluetooth' | 'unknown'

export type ButtonAction =
  | 'left'
  | 'right'
  | 'middle'
  | 'forward'
  | 'back'
  | 'dpi_cycle'
  | 'disabled'
  | 'macro'

export interface ButtonBinding {
  /** Display number on mouse art (1-based, OEM KeyParam order). */
  id: number
  /** Flash KeyFunMap slot (0–15) at 0x60 + index×4. */
  flashIndex: number
  label: string
  action: ButtonAction
  /** Pixel position on OEM mouse art (~420×300). */
  uiX: number
  uiY: number
  macroId?: string
}

export interface DpiStage {
  index: number
  value: number
  color: string
  enabled: boolean
}

export interface SensorState {
  dpiStages: DpiStage[]
  /** How many DPI levels are active (OEM "DPI Stages" 1–7). */
  dpiStageCount: number
  activeDpiIndex: number
  reportRate: number
  lodMm: 0.7 | 1 | 2
  mode: 'lp' | 'hp' | 'corded'
  peakPerformance: boolean
  peakPerformanceTimeoutMin: number
  rippleControl: boolean
  angleSnapping: boolean
  motionSync: boolean
  debounceMs: number
  debounceEnabled: boolean
}

export interface MacroEvent {
  id: string
  kind: 'down' | 'up' | 'delay'
  key?: string
  delayMs?: number
}

export type MacroPlayMode =
  | 'until_released'
  | 'until_pressed'
  | 'until_this_key'
  | 'times'

export interface Macro {
  id: string
  name: string
  events: MacroEvent[]
  playMode: MacroPlayMode
  times: number
  autoDelay: boolean
  defaultDelayMs: number
}

export interface DeviceInfo {
  driveVersion: string
  receiverFirmware: string
  mouseFirmware: string
  batteryPercent: number | null
  charging: boolean
  connection: ConnectionMode
}

export interface SettingsState {
  language: string
  sleepAfterMin: number
  longDistance: boolean
  runOnBoot: boolean
}

export interface DeviceState {
  profileIndex: number
  buttons: ButtonBinding[]
  sensor: SensorState
  macros: Macro[]
  settings: SettingsState
  info: DeviceInfo
}

export type DeviceSupportStatus = 'live' | 'wip' | 'planned'

export interface DeviceIdentity {
  id: string
  brand: string
  model: string
  tagline: string
  vendorId: number
  productIds: number[]
  /** Human VID:PID labels for the support list. */
  hidIds: string[]
  status: DeviceSupportStatus
  sensor?: string
  /** Product art for buttons/connect when this device is active. */
  imageUrl?: string
  /** Brand / product logo - used as blurred backdrop behind device UI. */
  logoUrl?: string
  /** Pixel size of imageUrl (badge positioning space). */
  artWidth?: number
  artHeight?: number
}
