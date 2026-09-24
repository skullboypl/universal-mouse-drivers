/**
 * Bridges an OpenMouse mouse client to the UMD DeviceDriver interface.
 * Matches @openmouse/protocol HID clients: readStatus, setDpi, setPollingRate,
 * setLiftOffDistance ("Low"|"Medium"|"High"), setAngleSnapping, …
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
  OPENMOUSE_CAPS_NONE,
  OPENMOUSE_DEMO_PROFILES,
  type OpenMouseCapabilityFlags,
  type OpenMouseDemoProfile,
} from './capabilities'

type OmLod = 'Low' | 'Medium' | 'High'

type OmStatus = {
  dpi?: number
  dpiY?: number
  pollingRateHz?: number
  supportedPollingRates?: number[]
  liftOffDistance?: OmLod | null
  angleSnapping?: boolean | null
  rippleControl?: boolean | null
  motionSync?: boolean | null
  batteryPercent?: number | null
  batteryState?: string
  name?: string
  brand?: string
  connectionType?: string
  firmware?: string[]
  dpiStages?: number[]
  activeDpiStage?: number
  sensor?: string
}

type OmClient = {
  brand?: string
  close?: () => Promise<void> | void
  /** Current OpenMouse API. */
  readStatus?: () => Promise<OmStatus | null>
  /** Legacy alias some forks used - keep as fallback. */
  getStatus?: () => Promise<OmStatus | null>
  setDpi?: (x: number, y?: number) => Promise<unknown>
  setPollingRate?: (hz: number) => Promise<unknown>
  setReportRate?: (hz: number) => Promise<unknown>
  setLiftOffDistance?: (lod: OmLod) => Promise<unknown>
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

function hzToRate(hz: number, allowed?: number[]): number {
  const rates = allowed?.length
    ? allowed
    : [125, 250, 500, 1000, 2000, 4000, 8000]
  let best = rates[0] ?? 1000
  let bestDiff = Infinity
  for (const a of rates) {
    const d = Math.abs(a - hz)
    if (d < bestDiff) {
      bestDiff = d
      best = a
    }
  }
  return best
}

function lodLabelToMm(label: OmLod | null | undefined): 0.7 | 1 | 2 {
  if (label === 'Low') return 0.7
  if (label === 'High') return 2
  return 1
}

function lodMmToLabel(mm: number): OmLod {
  if (mm <= 0.7) return 'Low'
  if (mm >= 2) return 'High'
  return 'Medium'
}

function chargingFromState(state: string | undefined): boolean {
  if (!state) return false
  const s = state.toLowerCase()
  return s.includes('charg') && !s.includes('discharg')
}

export class OpenMouseDriverAdapter implements DeviceDriver {
  identity: DeviceIdentity
  private state: DeviceState
  private client: OmClient | null = null
  private hidDevice: HIDDevice | null = null
  private pendingDevice: HIDDevice | null = null
  /** Soft flags from live client methods or demo profile. */
  capabilities: OpenMouseCapabilityFlags = { ...OPENMOUSE_CAPS_NONE }
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = null
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private writePhaseListeners = new Set<(p: DeviceWritePhase) => void>()
  private demoProfile: OpenMouseDemoProfile | null = null
  private allowedPollRates: number[] | null = null

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
      throw new Error(
        'OpenMouse: no supported mouse client for this HID device (headphones / keyboards from the same brand are ignored)',
      )
    }
    this.client = client as OmClient
    this.capabilities = capabilitiesFromOmClient(this.client)
    const brand =
      this.client.brand ||
      (typeof (client as { deviceBrand?: () => string }).deviceBrand ===
      'function'
        ? (client as { deviceBrand: () => string }).deviceBrand()
        : 'OpenMouse')
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

  private async pullStatus(): Promise<OmStatus | null> {
    if (!this.client) return null
    if (typeof this.client.readStatus === 'function') {
      return (await this.client.readStatus()) ?? null
    }
    if (typeof this.client.getStatus === 'function') {
      return (await this.client.getStatus()) ?? null
    }
    return null
  }

  async probeFlashAndSync(): Promise<void> {
    if (!this.client) {
      this.mouseReachable = false
      return
    }
    try {
      const st = await this.pullStatus()
      if (!st) {
        this.mouseReachable = true
        this.lastVerifyNote = `${this.identity.brand} · connected (no status read)`
        return
      }

      if (st.supportedPollingRates?.length) {
        this.allowedPollRates = [...st.supportedPollingRates]
      }

      const dpiX =
        typeof st.dpi === 'number' && st.dpi > 0
          ? Math.max(50, Math.round(st.dpi))
          : null
      const dpiY =
        typeof st.dpiY === 'number' && st.dpiY > 0
          ? Math.max(50, Math.round(st.dpiY))
          : dpiX
      const rate =
        typeof st.pollingRateHz === 'number'
          ? hzToRate(st.pollingRateHz, this.allowedPollRates ?? undefined)
          : null

      let dpiStages = this.state.sensor.dpiStages
      let dpiStageCount = this.state.sensor.dpiStageCount
      let activeDpiIndex = this.state.sensor.activeDpiIndex

      if (st.dpiStages?.length) {
        dpiStages = st.dpiStages.map((value, index) => ({
          index,
          value,
          valueY: value,
          color: '#888888',
          enabled: true,
        }))
        dpiStageCount = st.dpiStages.length
        activeDpiIndex = Math.min(
          Math.max(0, st.activeDpiStage ?? 0),
          dpiStageCount - 1,
        )
      } else if (dpiX != null) {
        dpiStages = this.state.sensor.dpiStages.map((s, i) =>
          i === 0
            ? {
                ...s,
                value: dpiX,
                valueY: dpiY ?? dpiX,
                enabled: true,
              }
            : s,
        )
        dpiStageCount = Math.max(1, this.state.sensor.dpiStageCount)
        activeDpiIndex = 0
      }

      const charging = chargingFromState(st.batteryState)
      const fw =
        st.firmware?.filter(Boolean).join(' · ') ||
        st.sensor ||
        this.state.info.mouseFirmware

      this.state = {
        ...this.state,
        sensor: {
          ...this.state.sensor,
          dpiStages,
          dpiStageCount,
          activeDpiIndex,
          ...(rate != null ? { reportRate: rate } : {}),
          lodMm: lodLabelToMm(st.liftOffDistance),
          angleSnapping: Boolean(st.angleSnapping),
          rippleControl: st.rippleControl !== false,
          motionSync: Boolean(st.motionSync),
          dpiAxisSync: dpiY == null || dpiY === dpiX,
        },
        info: {
          ...this.state.info,
          mouseFirmware: fw,
          batteryPercent:
            typeof st.batteryPercent === 'number' ? st.batteryPercent : null,
          charging,
          connection:
            st.connectionType === 'Wired'
              ? 'corded'
              : st.connectionType === 'Wireless'
                ? 'wireless'
                : this.state.info.connection,
        },
      }
      if (st.name) {
        this.identity = { ...this.identity, model: st.name }
      }
      if (st.brand) {
        this.identity = { ...this.identity, brand: st.brand }
      }
      this.mouseReachable = true
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `${this.identity.brand} · status OK`
    } catch (e) {
      this.lastWriteError = e instanceof Error ? e.message : String(e)
      this.mouseReachable = false
    }
  }

  async flushToDevice(): Promise<{ wrote: boolean }> {
    if (!this.client) return { wrote: false }
    this.setWritePhase('writing')
    const errors: string[] = []
    let wrote = false
    try {
      const stage =
        this.state.sensor.dpiStages[this.state.sensor.activeDpiIndex] ??
        this.state.sensor.dpiStages[0]

      if (stage && typeof this.client.setDpi === 'function') {
        try {
          await this.client.setDpi(stage.value, stage.valueY ?? stage.value)
          wrote = true
        } catch (e) {
          errors.push(`DPI: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      const setRate =
        this.client.setPollingRate ?? this.client.setReportRate
      if (typeof setRate === 'function') {
        try {
          const hz = hzToRate(
            this.state.sensor.reportRate,
            this.allowedPollRates ?? undefined,
          )
          await setRate.call(this.client, hz)
          wrote = true
        } catch (e) {
          errors.push(`Poll: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      if (typeof this.client.setLiftOffDistance === 'function') {
        try {
          await this.client.setLiftOffDistance(
            lodMmToLabel(this.state.sensor.lodMm),
          )
          wrote = true
        } catch (e) {
          errors.push(`LOD: ${e instanceof Error ? e.message : String(e)}`)
        }
      } else if (typeof this.client.setLod === 'function') {
        try {
          await this.client.setLod(this.state.sensor.lodMm)
          wrote = true
        } catch (e) {
          errors.push(`LOD: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      if (typeof this.client.setAngleSnapping === 'function') {
        try {
          await this.client.setAngleSnapping(this.state.sensor.angleSnapping)
          wrote = true
        } catch (e) {
          errors.push(`Angle: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      if (typeof this.client.setRippleControl === 'function') {
        try {
          await this.client.setRippleControl(this.state.sensor.rippleControl)
          wrote = true
        } catch (e) {
          errors.push(`Ripple: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      if (typeof this.client.setMotionSync === 'function') {
        try {
          await this.client.setMotionSync(this.state.sensor.motionSync)
          wrote = true
        } catch (e) {
          errors.push(`Motion: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      if (errors.length) {
        this.lastWriteOk = false
        this.lastWriteError = errors.join(' · ')
        this.setWritePhase('error')
        return { wrote }
      }

      // Re-read so UI matches what the mouse kept.
      await this.probeFlashAndSync()
      this.lastWriteOk = wrote
      this.lastWriteError = wrote ? null : 'No writable OpenMouse setters on this client'
      this.setWritePhase(wrote ? 'ok' : 'error')
      return { wrote }
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
  }

  patchSensor(patch: Partial<SensorState>): void {
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, ...patch },
    }
  }

  setDpiStageCount(count: number): void {
    if (!this.capabilities.dpiWritable) return
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
    if (!this.capabilities.dpiWritable) return
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
    await this.probeFlashAndSync()
  }
}

export function createOpenMouseDriver(
  seedDevice?: HIDDevice,
  demoProfile?: OpenMouseDemoProfile,
): OpenMouseDriverAdapter {
  return new OpenMouseDriverAdapter(seedDevice, demoProfile)
}
