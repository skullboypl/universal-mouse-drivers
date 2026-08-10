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
 * Shared surface for King Ultra + Fenrir Max so Sensor/Buttons/Settings
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
  /** Fenrir opens its own multi-interface HID stack (optional). */
  attachNative?(opts?: { preferPid?: number }): Promise<void>
  detach(): Promise<void>
  onWritePhase(cb: (p: DeviceWritePhase) => void): () => void

  setProfile(index: number): void
  setButtonAction(buttonId: number, action: ButtonAction): void
  /** May return a Promise when the write is flushed immediately (e.g. Axis Sync). */
  patchSensor(patch: Partial<SensorState>): void | Promise<void>
  setDpiStageCount(count: number): void
  /** valueY defaults to value (axis sync / single-axis mice). */
  setDpiStage(index: number, value: number, valueY?: number): void
  /** Fenrir: OEM SetDPIStageColors for active DPI LED color. */
  setActiveDpiColor?(color: string): void
  setMacros(macros: Macro[]): void
  patchSettings(patch: Partial<SettingsState>): void
  restoreDefaults(): void
  exportProfile(): string
  importProfile(json: string): void
  refreshFirmwareVersions(): Promise<void>
  probeFlashAndSync(): Promise<void>
  flushToDevice(): Promise<{ wrote: boolean }>
}
