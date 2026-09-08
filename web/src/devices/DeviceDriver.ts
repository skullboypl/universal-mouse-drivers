import type {
  ButtonAction,
  DeviceIdentity,
  DeviceState,
  Macro,
  SensorState,
  SettingsState,
} from './types'
import type { Transport } from '../transport/types'

export type DeviceWritePhase = 'idle' | 'queued' | 'writing' | 'ok' | 'error'

/**
 * Shared surface for King Ultra + Fenrir Max + Superlight so Sensor/Buttons/Settings
 * keep using apply(d => d.patchSensor(...)) without per-device UI trees.
 */
export interface DeviceDriver {
  readonly identity: DeviceIdentity
  lastWriteError: string | null
  lastWriteOk: boolean
  lastVerifyNote: string | null
  mouseReachable: boolean
  writePhase: DeviceWritePhase

  getState(): DeviceState
  attach(transport: Transport): Promise<void>
  /** Fenrir / Superlight / OpenMouse open their own HID stack (optional). */
  attachNative?(opts?: { preferPid?: number; device?: HIDDevice }): Promise<void>
  detach(): Promise<void>
  onWritePhase(cb: (p: DeviceWritePhase) => void): () => void

  setProfile(index: number): void | Promise<void>
  setButtonAction(
    buttonId: number,
    action: ButtonAction,
    /** When action is macro - library id copied into this button’s flash slot. */
    macroId?: string,
  ): void | Promise<void>
  /** May return a Promise when the write is flushed immediately (e.g. Axis Sync). */
  patchSensor(patch: Partial<SensorState>): void | Promise<void>
  setDpiStageCount(count: number): void
  /** valueY defaults to value (axis sync / single-axis mice). */
  setDpiStage(index: number, value: number, valueY?: number): void
  /** Fenrir: OEM SetDPIStageColors for active DPI LED color. */
  setActiveDpiColor?(color: string): void
  setMacros(macros: Macro[]): void
  /**
   * Write assigned macros to device flash (HIDUsb @ 0x300+i×0x180) + KeyFun type=6.
   * Local library edits stay in setMacros until this is called (Macro Save).
   */
  saveMacrosToDevice?(): Promise<void>
  patchSettings(patch: Partial<SettingsState>): void
  restoreDefaults(): void | Promise<void>
  exportProfile(): string
  importProfile(json: string): void
  /**
   * Per-SKU button action catalog for Buttons UI.
   * Each mouse owns its list - never share catalogs across devices.
   */
  readonly buttonActions?: ReadonlyArray<{
    id: ButtonAction
    labelKey: string
    group:
      | 'mouse'
      | 'system'
      | 'scroll'
      | 'dpi'
      | 'media'
      | 'lighting'
      | 'macro'
  }>
  refreshFirmwareVersions(): Promise<void>
  /** King Ultra: read sleep timeout from flash (optional on other devices). */
  refreshSleepFromDevice?(): Promise<void>
  /**
   * Lightweight poll of live DPI stage index + report rate from flash
   * (DPI Loop / Polling Rate Switch on the mouse). Returns true if UI state changed.
   */
  refreshLiveSensorFromDevice?(): Promise<boolean>
  /**
   * Soft feature flags (mainly OpenMouse). When absent, UI assumes full native surface.
   */
  readonly capabilities?: {
    dpi?: boolean
    reportRate?: boolean
    lod?: boolean
    angleSnapping?: boolean
    rippleControl?: boolean
    motionSync?: boolean
    powerModes?: boolean
    buttons?: boolean
    deviceSettings?: boolean
  }
  probeFlashAndSync(): Promise<void>
  flushToDevice(): Promise<{ wrote: boolean }>
}
