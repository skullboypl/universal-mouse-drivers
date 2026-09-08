/**
 * Bridges an OpenMouse mouse client to the UMD DeviceDriver interface.
 * DPI / poll / basic sensor when the brand client exposes getStatus / setters.
 */

import type { Transport } from '../../transport/types'
import type { DeviceDriver, DeviceWritePhase } from '../DeviceDriver'
import type {
  ButtonAction,
  DeviceIdentity,
  DeviceState,
  Macro,
  SensorState,
  SettingsState,
} from '../types'
import { OPENMOUSE_BACKED_ID } from './constants'
import { createOpenMouseClient } from './detect'
import {
  capabilitiesFromOmClient,
  OPENMOUSE_DEMO_PROFILES,
  type OpenMouseCapabilityFlags,
  type OpenMouseDemoProfile,
} from './capabilities'

type OmClient = {
  brand?: string
  close?: () => Promise<void> | void
  getStatus?: () => Promise<{
    dpi?: { x: number; y: number; linked?: boolean }
    report_rate?: number
    lod?: number
    angle_snapping?: boolean
    ripple_control?: boolean
    motion_sync?: boolean
    sensor?: string
  } | null>
  setDpi?: (x: number, y?: number) => Promise<unknown>
  setReportRate?: (hz: number) => Promise<unknown>
  setLod?: (mm: number) => Promise<unknown>
  setAngleSnapping?: (on: boolean) => Promise<unknown>
  setRippleControl?: (on: boolean) => Promise<unknown>
  setMotionSync?: (on: boolean) => Promise<unknown>
}

function createOpenMouseDefaultState(): DeviceState {
  const grades = [400, 800, 1600, 3200, 6400]
  return {
    profileIndex: 0,
    buttons: [],
    sensor: {
      dpiStages: grades.map((value, index) => ({
        index,
        value,
        valueY: value,
        color: '#888888',
        enabled: true,
      })),
      dpiStageCount: grades.length,
      activeDpiIndex: 1,
      reportRate: 1000,
      lodMm: 1,
      mode: 'lp',
      peakPerformance: false,
      peakPerformanceTimeoutMin: 15,
      rippleControl: true,
      angleSnapping: false,
      motionSync: false,
      debounceMs: 0,
      debounceEnabled: false,
      dpiAxisSync: true,
    },
    macros: [],
    settings: {
      language: 'pl',
      sleepAfterMin: 1,
      longDistance: false,
      runOnBoot: false,
    },
    info: {
      driveVersion: '0.1.0-web',
      receiverFirmware: '-',
      mouseFirmware: 'OpenMouse',
      batteryPercent: null,
      charging: false,
      connection: 'unknown',
    },
  }
}

function hzToRate(hz: number): number {
  const allowed = [125, 250, 500, 1000, 2000, 4000, 8000]
  let best = 1000
  let bestDiff = Infinity
  for (const a of allowed) {
    const d = Math.abs(a - hz)
    if (d < bestDiff) {
      bestDiff = d
      best = a
    }
  }
  return best
}

function lodMm(v: number): 0.7 | 1 | 2 {
  if (v <= 0.7) return 0.7
  if (v >= 2) return 2
  return 1
}

export class OpenMouseDriverAdapter implements DeviceDriver {
  identity: DeviceIdentity
  private state: DeviceState
  private client: OmClient | null = null
  private hidDevice: HIDDevice | null = null
  private pendingDevice: HIDDevice | null = null
  /** Soft flags from live client methods or demo profile. */
  capabilities: OpenMouseCapabilityFlags = { ...OPENMOUSE_DEMO_PROFILES.full.caps }
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = null
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private writePhaseListeners = new Set<(p: DeviceWritePhase) => void>()
  private demoProfile: OpenMouseDemoProfile | null = null

  constructor(seedDevice?: HIDDevice, demoProfile?: OpenMouseDemoProfile) {
    this.state = createOpenMouseDefaultState()
    this.pendingDevice = seedDevice ?? null
    this.demoProfile = demoProfile ?? null
    if (demoProfile) {
      this.capabilities = { ...OPENMOUSE_DEMO_PROFILES[demoProfile].caps }
    }
    const brand = 'OpenMouse'
    this.identity = {
      id: OPENMOUSE_BACKED_ID,
      brand,
      model: seedDevice?.productName || 'Community devices',
      tagline: 'OpenMouse protocol',
      vendorId: seedDevice?.vendorId ?? 0,
      productIds: seedDevice ? [seedDevice.productId] : [],
      hidIds: seedDevice
        ? [
            `${seedDevice.vendorId.toString(16)}:${seedDevice.productId.toString(16)}`,
          ]
        : ['multi-vendor'],
      status: 'openmouse',
      sensor: 'Varies by OpenMouse driver',
    }
  }

  getState(): DeviceState {
    return this.state
  }

  onWritePhase(cb: (phase: DeviceWritePhase) => void): () => void {
    this.writePhaseListeners.add(cb)
    return () => {
      this.writePhaseListeners.delete(cb)
    }
  }

  private setWritePhase(phase: DeviceWritePhase) {
    this.writePhase = phase
    for (const cb of this.writePhaseListeners) cb(phase)
  }

  async attach(transport: Transport): Promise<void> {
    if (transport.kind === 'mock') {
      const profile = this.demoProfile ?? 'full'
      const preset = OPENMOUSE_DEMO_PROFILES[profile]
      this.capabilities = { ...preset.caps }
      this.identity = {
        id: OPENMOUSE_BACKED_ID,
        brand: 'OpenMouse',
        model: preset.model,
        tagline: 'Shared OpenMouse surface (mock)',
        vendorId: 0,
        productIds: [],
        hidIds: [`demo:${profile}`],
        status: 'openmouse',
        sensor: 'Varies by OpenMouse driver',
        imageUrl: '/devices/openmouse/mouse.svg',
      }
      this.state = {
        ...createOpenMouseDefaultState(),
        info: {
          ...createOpenMouseDefaultState().info,
          mouseFirmware: `OpenMouse demo · ${profile}`,
          connection: 'wireless',
          batteryPercent: null,
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = preset.note
      this.lastWriteOk = true
      return
    }
    await this.attachNative()
  }

  async attachNative(opts?: {
    preferPid?: number
    device?: HIDDevice
  }): Promise<void> {
    const device = opts?.device ?? this.pendingDevice
    if (!device) {
      throw new Error('OpenMouse: no HIDDevice for attachNative')
    }
    this.pendingDevice = device
    this.hidDevice = device
    if (!device.opened) {
      await device.open()
    }
    const client = await createOpenMouseClient(device)
    if (!client) {
      throw new Error('OpenMouse: no supported client for this HID device')
    }
    this.client = client as OmClient
    this.capabilities = capabilitiesFromOmClient(this.client)
    const brand = this.client.brand || 'OpenMouse'
    this.identity = {
      ...this.identity,
      id: OPENMOUSE_BACKED_ID,
      brand,
      model: device.productName || 'HID mouse',
      tagline: `${brand} via OpenMouse`,
      vendorId: device.vendorId,
      productIds: [device.productId],
      hidIds: [
        `${device.vendorId.toString(16)}:${device.productId.toString(16)}`,
      ],
      status: 'openmouse',
    }
    this.state = {
      ...createOpenMouseDefaultState(),
      info: {
        ...createOpenMouseDefaultState().info,
        mouseFirmware: brand,
        connection: 'wireless',
      },
    }
    this.mouseReachable = true
    this.lastVerifyNote = `OpenMouse · ${brand}`
  }

  async detach(): Promise<void> {
    try {
      await this.client?.close?.()
    } catch {
      /* ignore */
    }
    try {
      if (this.hidDevice?.opened) await this.hidDevice.close()
    } catch {
      /* ignore */
    }
    this.client = null
    this.hidDevice = null
    this.mouseReachable = false
  }

  async probeFlashAndSync(): Promise<void> {
    if (!this.client?.getStatus) {
      this.mouseReachable = Boolean(this.client)
      return
    }
    try {
      const st = await this.client.getStatus()
      if (!st) {
        this.mouseReachable = true
        return
      }
      const dpiX = st.dpi ? Math.max(50, Math.round(st.dpi.x)) : null
      const rate =
        typeof st.report_rate === 'number' ? hzToRate(st.report_rate) : null
      this.state = {
        ...this.state,
        sensor: {
          ...this.state.sensor,
          ...(dpiX != null
            ? {
                dpiStages: this.state.sensor.dpiStages.map((s, i) =>
                  i === 0
                    ? { ...s, value: dpiX, valueY: dpiX, enabled: true }
                    : s,
                ),
                dpiStageCount: Math.max(1, this.state.sensor.dpiStageCount),
                activeDpiIndex: 0,
              }
            : {}),
          ...(rate != null ? { reportRate: rate } : {}),
          lodMm: typeof st.lod === 'number' ? lodMm(st.lod) : this.state.sensor.lodMm,
          angleSnapping: Boolean(st.angle_snapping),
          rippleControl: st.ripple_control !== false,
          motionSync: Boolean(st.motion_sync),
        },
        info: {
          ...this.state.info,
          mouseFirmware: st.sensor || this.state.info.mouseFirmware,
        },
      }
      this.mouseReachable = true
      this.lastWriteOk = true
      this.lastWriteError = null
    } catch (e) {
      this.lastWriteError = e instanceof Error ? e.message : String(e)
      this.mouseReachable = false
    }
  }

  async flushToDevice(): Promise<{ wrote: boolean }> {
    if (!this.client) return { wrote: false }
    this.setWritePhase('writing')
    try {
      const stage =
        this.state.sensor.dpiStages[this.state.sensor.activeDpiIndex] ??
        this.state.sensor.dpiStages[0]
      if (stage && this.client.setDpi) {
        await this.client.setDpi(stage.value, stage.valueY ?? stage.value)
      }
      if (this.client.setReportRate) {
        await this.client.setReportRate(this.state.sensor.reportRate)
      }
      if (this.client.setLod) {
        await this.client.setLod(this.state.sensor.lodMm)
      }
      if (this.client.setAngleSnapping) {
        await this.client.setAngleSnapping(this.state.sensor.angleSnapping)
      }
      if (this.client.setRippleControl) {
        await this.client.setRippleControl(this.state.sensor.rippleControl)
      }
      if (this.client.setMotionSync) {
        await this.client.setMotionSync(this.state.sensor.motionSync)
      }
      this.lastWriteOk = true
      this.lastWriteError = null
      this.setWritePhase('ok')
      return { wrote: true }
    } catch (e) {
      this.lastWriteOk = false
      this.lastWriteError = e instanceof Error ? e.message : String(e)
      this.setWritePhase('error')
      return { wrote: false }
    }
  }

  setProfile(index: number): void {
    this.state = { ...this.state, profileIndex: index }
  }

  setButtonAction(
    buttonId: number,
    action: ButtonAction,
    macroId?: string,
  ): void {
    void buttonId
    void action
    void macroId
    /* OpenMouse button remap not unified in v1 */
  }

  patchSensor(patch: Partial<SensorState>): void {
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, ...patch },
    }
  }

  setDpiStageCount(count: number): void {
    const n = Math.max(1, Math.min(7, count))
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStageCount: n,
        dpiStages: this.state.sensor.dpiStages.map((s, i) => ({
          ...s,
          enabled: i < n,
        })),
      },
    }
  }

  setDpiStage(index: number, value: number, valueY?: number): void {
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStages: this.state.sensor.dpiStages.map((s) =>
          s.index === index
            ? { ...s, value, valueY: valueY ?? value }
            : s,
        ),
      },
    }
  }

  setMacros(macros: Macro[]): void {
    this.state = { ...this.state, macros }
  }

  patchSettings(patch: Partial<SettingsState>): void {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...patch },
    }
  }

  restoreDefaults(): void {
    const lang = this.state.settings.language
    this.state = createOpenMouseDefaultState()
    this.state.settings.language = lang
  }

  exportProfile(): string {
    return JSON.stringify({
      device: this.identity.id,
      sensor: this.state.sensor,
      settings: this.state.settings,
    })
  }

  importProfile(json: string): void {
    try {
      const data = JSON.parse(json) as {
        sensor?: SensorState
        settings?: SettingsState
      }
      if (data.sensor) {
        this.state = { ...this.state, sensor: { ...this.state.sensor, ...data.sensor } }
      }
      if (data.settings) {
        this.state = {
          ...this.state,
          settings: { ...this.state.settings, ...data.settings },
        }
      }
    } catch {
      /* ignore */
    }
  }

  async refreshFirmwareVersions(): Promise<void> {
    /* no unified FW API */
  }
}

export function createOpenMouseDriver(
  seed?: HIDDevice,
  demoProfile?: OpenMouseDemoProfile,
): OpenMouseDriverAdapter {
  return new OpenMouseDriverAdapter(seed, demoProfile)
}
