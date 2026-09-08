export type ConnectionMode = 'corded' | 'wireless' | 'bluetooth' | 'unknown'

export type ButtonAction =
  | 'left'
  | 'right'
  | 'middle'
  | 'forward'
  | 'back'
  | 'dpi_cycle'
  | 'dpi_up'
  | 'dpi_down'
  | 'dpi_lock_100'
  | 'dpi_lock_200'
  | 'dpi_lock_300'
  | 'dpi_lock_400'
  | 'dpi_lock_500'
  | 'dpi_lock_600'
  | 'dpi_lock_700'
  | 'dpi_lock_800'
  | 'dpi_lock_900'
  | 'dpi_lock_1000'
  | 'dpi_lock_1100'
  | 'dpi_lock_1200'
  | 'scroll_up'
  | 'scroll_down'
  | 'scroll_left'
  | 'scroll_right'
  | 'polling_rate_switch'
  /** OEM KeyFunction type 0x04 (Fire key). */
  | 'fire'
  | 'combo'
  | 'disabled'
  | 'macro'
  | 'media_player'
  | 'media_play_pause'
  | 'media_next'
  | 'media_prev'
  | 'media_stop'
  | 'media_mute'
  | 'media_vol_up'
  | 'media_vol_down'
  | 'media_email'
  | 'media_calc'
  | 'media_computer'
  | 'media_home'
  | 'media_search'
  | 'media_web_forward'
  | 'media_web_back'
  | 'media_web_stop'
  | 'media_refresh'
  | 'media_favorites'
  | 'led_all_toggle'
  | 'led_strip_toggle'
  | 'led_effect_loop'

export interface ButtonBinding {
  /** Display number on mouse art (1-based, OEM KeyParam order). */
  id: number
  /** Flash KeyFunMap slot (0-15) at 0x60 + index×4. */
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
  /** DPI X (and Y when axis sync is on). */
  value: number
  /** DPI Y when axis sync is off (Fenrir / DPIXYEnable). Defaults to value. */
  valueY?: number
  color: string
  enabled: boolean
}

export interface SensorState {
  dpiStages: DpiStage[]
  /** How many DPI levels are active (OEM "DPI Stages" 1-7). */
  dpiStageCount: number
  activeDpiIndex: number
  /**
   * Onboard profile default DPI slot (Solaar `resolution_default_index`, profile byte[1]).
   * Power-on / “Default DPI” button target - distinct from live activeDpiIndex.
   */
  defaultDpiIndex?: number
  /**
   * Onboard DPI-shift slot (Solaar `resolution_shift_index`, profile byte[2]).
   * Used while a button mapped to DPI Shift is held.
   */
  dpiShiftIndex?: number
  /** Live 0x2201 GetSensorDpiList - min/max/step from device (Superlight: 100/25600/50). */
  dpiListMin?: number
  dpiListMax?: number
  dpiListStep?: number
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
  /** Fenrir: OEM click debounce preset index 0-5 when DIY is off. */
  debounceLevel?: number
  /** Fenrir OEM debounce1 - Before Press (ms). */
  debounceBeforePress?: number
  /** Fenrir OEM debounce2 - Before Release (ms). */
  debounceBeforeRelease?: number
  /** Fenrir OEM debounce3 - After Press (ms). */
  debounceAfterPress?: number
  /** Fenrir OEM debounce4 - After Release (ms). */
  debounceAfterRelease?: number
  /** Fenrir: OEM wheel scroll debounce (ms). */
  wheelDebounceMs?: number
  /** Fenrir: DIY mode for wheel debounce (non-preset). */
  wheelDebounceDiy?: boolean
  /** Fenrir: companion rate byte for setWheelDebounce. */
  wheelDebounceRate?: number
  /** Fenrir: OEM wheel debounce preset index 0-3 when DIY is off. */
  wheelDebounceLevel?: number
  /** Fenrir OEM Axis Sync (DPI X = DPI Y). */
  dpiAxisSync?: boolean
  /** Fenrir OEM LED State. */
  ledEnabled?: boolean
  /**
   * Fenrir OEM LED Effect id when LED is on.
   * Old protocol: 1=Static, 2=Breathing (OEM lightColorEffects).
   */
  ledEffect?: number
  /** Fenrir OEM Sensor Angle (degrees). */
  sensorAngle?: number
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
  /** King Ultra sleep timeout in minutes (OEM PowerSaveTime). */
  sleepAfterMin: number
  /**
   * Fenrir OEM Sleep Time in seconds (30-600, step 5).
   * When set, this is the source of truth for Fenrir HID setSleepTime.
   */
  sleepAfterSec?: number
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

export type DeviceSupportStatus = 'live' | 'wip' | 'planned' | 'openmouse'

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
